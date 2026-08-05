import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/sync_service.dart';
import 'receipt_view.dart';
import 'sales_history_view.dart';

class PosView extends StatefulWidget {
  const PosView({super.key});

  @override
  State<PosView> createState() => _PosViewState();
}

class _PosViewState extends State<PosView> {
  final _apiService = ApiService();
  final _syncService = SyncService();
  final _searchController = TextEditingController();

  List<dynamic> _searchResults = [];
  final List<Map<String, dynamic>> _cart = [];

  String _paymentType = 'CASH'; // CASH | CREDIT | MIXED
  Map<String, dynamic>? _selectedCustomer;
  bool _submitting = false;

  Future<void> _searchProducts(String q) async {
    if (q.isEmpty) {
      setState(() => _searchResults = []);
      return;
    }
    try {
      final res = await _apiService.get('/pos/products?q=$q');
      if (res.statusCode == 200) {
        setState(() => _searchResults = res.data['data'] ?? []);
      }
    } catch (_) {}
  }

  void _addToCart(dynamic product) {
    setState(() {
      final existingIndex = _cart.indexWhere((item) => item['product']['id'] == product['id']);
      if (existingIndex >= 0) {
        _cart[existingIndex]['quantity'] += 1;
      } else {
        _cart.add({
          'product': product,
          'quantity': 1.0,
          'salePrice': double.parse(product['salePriceUzs']?.toString() ?? '0.0'),
        });
      }
      _searchResults = [];
      _searchController.clear();
    });
  }

  double get _totalAmount {
    return _cart.fold(0.0, (sum, item) => sum + (item['quantity'] * item['salePrice']));
  }

  Future<void> _pickCustomer() async {
    final controller = TextEditingController();
    List<dynamic> results = [];
    final selected = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          Future<void> search(String q) async {
            if (q.trim().isEmpty) {
              setDialogState(() => results = []);
              return;
            }
            try {
              final res = await _apiService.get('/customers?q=$q');
              setDialogState(() => results = res.data['data'] ?? []);
            } catch (_) {}
          }

          return AlertDialog(
            title: const Text('Mijoz tanlash'),
            content: SizedBox(
              width: double.maxFinite,
              height: 320,
              child: Column(
                children: [
                  TextField(
                    controller: controller,
                    autofocus: true,
                    decoration: const InputDecoration(
                      labelText: 'Ism yoki telefon bo\'yicha qidirish',
                      prefixIcon: Icon(Icons.search),
                    ),
                    onChanged: search,
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: ListView.builder(
                      itemCount: results.length,
                      itemBuilder: (context, idx) {
                        final c = results[idx];
                        return ListTile(
                          title: Text(c['name'] ?? ''),
                          subtitle: Text(c['phone'] ?? ''),
                          onTap: () => Navigator.of(ctx).pop(c),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Bekor qilish')),
            ],
          );
        },
      ),
    );
    if (selected != null) {
      setState(() => _selectedCustomer = selected);
    }
  }

  Future<void> _handleCheckout() async {
    if (_cart.isEmpty || _submitting) return;

    if ((_paymentType == 'CREDIT' || _paymentType == 'MIXED') && _selectedCustomer == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nasiya yoki aralash to\'lov uchun mijoz tanlang')),
      );
      return;
    }

    // Check if any items are sold below cost (purchasePrice)
    bool belowCost = false;
    for (final item in _cart) {
      final cost = double.parse(item['product']['purchasePriceUzs']?.toString() ?? '0.0');
      if (item['salePrice'] < cost) {
        belowCost = true;
        break;
      }
    }

    if (belowCost) {
      final proceed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Diqqat!'),
          content: const Text(
            'Diqqat! Mahsulot tannarxidan past narxda sotilyapti. Davom etasizmi?'
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Yo\'q'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Ha'),
            ),
          ],
        ),
      );
      if (proceed != true) return;
    }

    setState(() => _submitting = true);

    // Prepare sale payload
    final salePayload = {
      if (_selectedCustomer != null) 'customerId': _selectedCustomer!['id'],
      'originalCurrency': 'UZS',
      'paymentType': _paymentType,
      'amountPaidUzs': _paymentType == 'CREDIT' ? '0' : _totalAmount.toStringAsFixed(4),
      'lineItems': _cart
          .map((item) => {
                'productId': item['product']['id'],
                'quantity': item['quantity'].toStringAsFixed(4),
                'unitPriceUzs': item['salePrice'].toStringAsFixed(4),
              })
          .toList(),
    };

    final idempotencyKey = newIdempotencyKey();

    try {
      final res = await _apiService.postIdempotent('/sales', salePayload, idempotencyKey: idempotencyKey);
      if (res.statusCode == 200 || res.statusCode == 201) {
        _successCheckout(res.data);
      } else {
        _queueOffline({...salePayload, '_idempotencyKey': idempotencyKey});
      }
    } catch (_) {
      _queueOffline({...salePayload, '_idempotencyKey': idempotencyKey});
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _successCheckout(Map<String, dynamic> sale) {
    if (!mounted) return;
    setState(() {
      _cart.clear();
      _selectedCustomer = null;
      _paymentType = 'CASH';
    });
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => ReceiptView(sale: sale)),
    );
  }

  void _queueOffline(Map<String, dynamic> salePayload) async {
    await _syncService.queueOfflineSale(salePayload);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Internet aloqasi yo\'q. Sotuv offline saqlandi!')),
    );
    setState(() {
      _cart.clear();
      _selectedCustomer = null;
      _paymentType = 'CASH';
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Kassa POS',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            tooltip: 'Sotuv tarixi',
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const SalesHistoryView()),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search & Scanner
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: const InputDecoration(
                      labelText: 'Mahsulot qidirish...',
                      prefixIcon: Icon(Icons.search),
                      border: OutlineInputBorder(),
                    ),
                    onChanged: _searchProducts,
                  ),
                ),
              ],
            ),
          ),

          // Search results
          if (_searchResults.isNotEmpty)
            Container(
              constraints: const BoxConstraints(maxHeight: 200),
              color: theme.colorScheme.surfaceContainerHighest,
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: _searchResults.length,
                itemBuilder: (context, idx) {
                  final p = _searchResults[idx];
                  return ListTile(
                    title: Text(p['name'] ?? ''),
                    subtitle: Text('${p['salePriceUzs']} UZS | SKU: ${p['sku']}'),
                    trailing: const Icon(Icons.add),
                    onTap: () => _addToCart(p),
                  );
                },
              ),
            ),

          // Customer + payment type row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _pickCustomer,
                    icon: const Icon(Icons.person_outline),
                    label: Text(
                      _selectedCustomer?['name'] ?? 'Mijoz tanlash (ixtiyoriy)',
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
                if (_selectedCustomer != null)
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => setState(() => _selectedCustomer = null),
                  ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'CASH', label: Text('Naqd')),
                ButtonSegment(value: 'CREDIT', label: Text('Nasiya')),
                ButtonSegment(value: 'MIXED', label: Text('Aralash')),
              ],
              selected: {_paymentType},
              onSelectionChanged: (s) => setState(() => _paymentType = s.first),
            ),
          ),

          // Shopping Cart
          Expanded(
            child: _cart.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.shopping_cart_outlined, size: 60, color: theme.colorScheme.outline),
                        const SizedBox(height: 12),
                        const Text('Savat bo\'sh'),
                      ],
                    ),
                  )
                : ListView.builder(
                    itemCount: _cart.length,
                    itemBuilder: (context, idx) {
                      final item = _cart[idx];
                      final p = item['product'];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        child: ListTile(
                          title: Text(p['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('SKU: ${p['sku']}'),
                              Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.remove_circle_outline),
                                    onPressed: () {
                                      setState(() {
                                        if (item['quantity'] > 1) {
                                          item['quantity'] -= 1;
                                        } else {
                                          _cart.removeAt(idx);
                                        }
                                      });
                                    },
                                  ),
                                  Text('${item['quantity']}', style: const TextStyle(fontSize: 16)),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline),
                                    onPressed: () {
                                      setState(() => item['quantity'] += 1);
                                    },
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                                    onPressed: () => setState(() => _cart.removeAt(idx)),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              SizedBox(
                                width: 100,
                                child: TextFormField(
                                  initialValue: '${item['salePrice']}',
                                  keyboardType: TextInputType.number,
                                  decoration: const InputDecoration(
                                    suffixText: 'UZS',
                                    isDense: true,
                                  ),
                                  onChanged: (val) {
                                    setState(() {
                                      item['salePrice'] = double.tryParse(val) ?? 0.0;
                                    });
                                  },
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // Total Bar
          if (_cart.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerLow,
                border: Border(top: BorderSide(color: theme.colorScheme.outlineVariant)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Jami summa:'),
                      Text(
                        '$_totalAmount UZS',
                        style: GoogleFonts.outfit(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.primary,
                        ),
                      ),
                    ],
                  ),
                  ElevatedButton(
                    onPressed: _submitting ? null : _handleCheckout,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
                      backgroundColor: theme.colorScheme.primary,
                      foregroundColor: theme.colorScheme.onPrimary,
                    ),
                    child: _submitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('To\'lov qilish'),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
