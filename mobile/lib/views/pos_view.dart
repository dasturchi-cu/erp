import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/sync_service.dart';

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

  // Checkout Options
  String _paymentType = 'CASH'; // CASH, CARD, TRANSFER, DEBT
  Map<String, dynamic>? _selectedCustomer;
  List<dynamic> _customers = [];

  @override
  void initState() {
    super.initState();
    _loadCustomers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadCustomers() async {
    try {
      final res = await _apiService.get('/customers?limit=100');
      if (res.statusCode == 200) {
        final raw = res.data;
        setState(() {
          if (raw is Map && raw.containsKey('data')) {
            _customers = raw['data'] is List ? raw['data'] : [];
          } else if (raw is List) {
            _customers = raw;
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _searchProducts(String q) async {
    if (q.isEmpty) {
      setState(() => _searchResults = []);
      return;
    }
    try {
      final res = await _apiService.get('/products/pos-products?q=${Uri.encodeComponent(q)}');
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

  String _formatCurrency(double amount) {
    final str = amount.abs().toStringAsFixed(0);
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) {
        buffer.write(' ');
      }
      buffer.write(str[i]);
    }
    return '${buffer.toString()} UZS';
  }

  Future<void> _handleCheckout() async {
    if (_cart.isEmpty) return;

    if (_paymentType == 'DEBT' && _selectedCustomer == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nasiya sotuv uchun mijozni tanlash majburiy!')),
      );
      return;
    }

    // Check if any items are sold below cost
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
          content: const Text('Mahsulot tannarxidan past narxda sotilyapti. Davom etasizmi?'),
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

    final salePayload = {
      'originalCurrency': 'UZS',
      'paymentType': _paymentType,
      'amountPaidUzs': _totalAmount.toStringAsFixed(4),
      if (_selectedCustomer != null) 'customerId': _selectedCustomer!['id'],
      'lineItems': _cart
          .map((item) => {
                'productId': item['product']['id'],
                'quantity': item['quantity'].toStringAsFixed(4),
                'customPrice': item['salePrice'].toStringAsFixed(4),
              })
          .toList(),
    };

    try {
      final res = await _apiService.post('/sales', salePayload);
      if (res.statusCode == 200 || res.statusCode == 201) {
        _successCheckout();
      } else {
        _queueOffline(salePayload);
      }
    } catch (_) {
      _queueOffline(salePayload);
    }
  }

  void _successCheckout() {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Xarid muvaffaqiyatli yakunlandi!')),
    );
    setState(() {
      _cart.clear();
      _selectedCustomer = null;
      _paymentType = 'CASH';
    });
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
                const SizedBox(width: 8),
                IconButton.filled(
                  icon: const Icon(Icons.qr_code_scanner),
                  onPressed: () {
                    _searchProducts('BARCODE-101');
                  },
                ),
              ],
            ),
          ),

          // Search results dropdown
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
                    subtitle: Text('${_formatCurrency(double.tryParse(p['salePriceUzs']?.toString() ?? '0') ?? 0)} | SKU: ${p['sku']}'),
                    trailing: const Icon(Icons.add_circle, color: Colors.green),
                    onTap: () => _addToCart(p),
                  );
                },
              ),
            ),

          // Cart List
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
                                  Text('${item['quantity']}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline),
                                    onPressed: () {
                                      setState(() => item['quantity'] += 1);
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                          trailing: SizedBox(
                            width: 110,
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
                        ),
                      );
                    },
                  ),
          ),

          // Checkout Panel
          if (_cart.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerLow,
                border: Border(top: BorderSide(color: theme.colorScheme.outlineVariant)),
              ),
              child: Column(
                children: [
                  // Payment Options Row
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _paymentType,
                          decoration: const InputDecoration(
                            labelText: 'To\'lov turi',
                            isDense: true,
                            border: OutlineInputBorder(),
                          ),
                          items: const [
                            DropdownMenuItem(value: 'CASH', child: Text('Naqd')),
                            DropdownMenuItem(value: 'CARD', child: Text('Karta')),
                            DropdownMenuItem(value: 'TRANSFER', child: Text('O\'tkazma')),
                            DropdownMenuItem(value: 'DEBT', child: Text('Nasiya (Qarz)')),
                          ],
                          onChanged: (val) {
                            if (val != null) setState(() => _paymentType = val);
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonFormField<Map<String, dynamic>>(
                          value: _selectedCustomer,
                          isExpanded: true,
                          decoration: InputDecoration(
                            labelText: _paymentType == 'DEBT' ? 'Mijoz *' : 'Mijoz (ixtiyoriy)',
                            isDense: true,
                            border: const OutlineInputBorder(),
                          ),
                          items: [
                            const DropdownMenuItem(value: null, child: Text('Mijozsiz sotuv')),
                            ..._customers.map((c) => DropdownMenuItem(
                                  value: c as Map<String, dynamic>,
                                  child: Text(c['name'] ?? '', overflow: TextOverflow.ellipsis),
                                )),
                          ],
                          onChanged: (val) {
                            setState(() => _selectedCustomer = val);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Jami summa:', style: TextStyle(fontSize: 12)),
                          Text(
                            _formatCurrency(_totalAmount),
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                      ElevatedButton.icon(
                        onPressed: _handleCheckout,
                        icon: const Icon(Icons.check),
                        label: const Text('To\'lov qilish'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                          backgroundColor: theme.colorScheme.primary,
                          foregroundColor: theme.colorScheme.onPrimary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
