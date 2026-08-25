import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class ReturnsView extends StatefulWidget {
  const ReturnsView({super.key});

  @override
  State<ReturnsView> createState() => _ReturnsViewState();
}

class _ReturnsViewState extends State<ReturnsView> {
  final _api = ApiService();
  bool _loading = true;
  List<dynamic> _returns = [];
  List<dynamic> _sales = [];

  final _reasonCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController(text: '1');
  Map<String, dynamic>? _selectedSale;
  Map<String, dynamic>? _selectedLineItem;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _reasonCtrl.dispose();
    _qtyCtrl.dispose();
    super.dispose();
  }

  List<dynamic> _unwrap(dynamic raw) {
    if (raw is Map && raw['data'] is List) return raw['data'] as List;
    if (raw is List) return raw;
    return [];
  }

  List<dynamic> _lineItemsOf(Map<String, dynamic>? sale) {
    if (sale == null) return [];
    final items = sale['lineItems'];
    return items is List ? items : [];
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get('/sales/returns');
      // A return must be tied to an existing sale, so we select from recent sales.
      final sRes = await _api.get('/sales?limit=50&sortBy=createdAt&sortOrder=desc');
      if (mounted) {
        setState(() {
          _returns = _unwrap(res.data);
          _sales = _unwrap(sRes.data);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showCreateReturnDialog() {
    final theme = Theme.of(context);
    _reasonCtrl.clear();
    _qtyCtrl.text = '1';
    _selectedSale = _sales.isNotEmpty ? _sales.first as Map<String, dynamic> : null;
    final firstItems = _lineItemsOf(_selectedSale);
    _selectedLineItem = firstItems.isNotEmpty ? firstItems.first as Map<String, dynamic> : null;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final lineItems = _lineItemsOf(_selectedSale);
          return Padding(
            padding: EdgeInsets.only(
              left: 20, right: 20, top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Vozvrat (Tovarni Qaytarish)', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  if (_sales.isNotEmpty)
                    DropdownButtonFormField<Map<String, dynamic>>(
                      value: _selectedSale,
                      isExpanded: true,
                      style: TextStyle(color: theme.colorScheme.onSurface, fontSize: 14, fontWeight: FontWeight.w500),
                      dropdownColor: theme.colorScheme.surface,
                      iconEnabledColor: theme.colorScheme.onSurface,
                      decoration: const InputDecoration(
                        labelText: 'Savdo (Chek) *',
                        border: OutlineInputBorder(),
                      ),
                      items: _sales.map((s) {
                        final sale = s as Map<String, dynamic>;
                        final number = sale['number'] ?? sale['id'];
                        final customer = sale['customerName'] ?? 'Mijozsiz';
                        final total = sale['totalUzs'] ?? '0';
                        return DropdownMenuItem(
                          value: sale,
                          child: Text('#$number · $customer · $total UZS', style: TextStyle(color: theme.colorScheme.onSurface), overflow: TextOverflow.ellipsis),
                        );
                      }).toList(),
                      onChanged: (val) => setModalState(() {
                        _selectedSale = val;
                        final items = _lineItemsOf(val);
                        _selectedLineItem = items.isNotEmpty ? items.first as Map<String, dynamic> : null;
                        _qtyCtrl.text = _selectedLineItem?['quantity']?.toString() ?? '1';
                      }),
                    )
                  else
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8.0),
                      child: Text('Qaytarish uchun savdolar topilmadi.', style: TextStyle(color: Colors.red)),
                    ),
                  const SizedBox(height: 12),
                  if (lineItems.isNotEmpty)
                    DropdownButtonFormField<Map<String, dynamic>>(
                      value: _selectedLineItem,
                      isExpanded: true,
                      style: TextStyle(color: theme.colorScheme.onSurface, fontSize: 14, fontWeight: FontWeight.w500),
                      dropdownColor: theme.colorScheme.surface,
                      iconEnabledColor: theme.colorScheme.onSurface,
                      decoration: const InputDecoration(
                        labelText: 'Qaytarilayotgan Mahsulot *',
                        border: OutlineInputBorder(),
                      ),
                      items: lineItems.map((it) {
                        final item = it as Map<String, dynamic>;
                        final name = item['productName'] ?? '';
                        final qty = item['quantity'] ?? '';
                        return DropdownMenuItem(
                          value: item,
                          child: Text('$name (sotilgan: $qty)', style: TextStyle(color: theme.colorScheme.onSurface), overflow: TextOverflow.ellipsis),
                        );
                      }).toList(),
                      onChanged: (val) => setModalState(() {
                        _selectedLineItem = val;
                        _qtyCtrl.text = val?['quantity']?.toString() ?? '1';
                      }),
                    ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _qtyCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Soni (Miqdori) *',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _reasonCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Qaytarish Sababi (Brak, yaroqsiz...) *',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () async {
                      if (_selectedSale == null || _selectedLineItem == null || _reasonCtrl.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Savdo, mahsulot va sabab majburiy!')),
                        );
                        return;
                      }
                      try {
                        final saleId = _selectedSale!['id'];
                        final res = await _api.post('/sales/$saleId/returns', {
                          'reason': _reasonCtrl.text.trim(),
                          'lineItems': [
                            {
                              'productId': _selectedLineItem!['productId'],
                              'quantity': _qtyCtrl.text.trim(),
                            }
                          ]
                        });
                        if (res.statusCode == 200 || res.statusCode == 201) {
                          if (mounted) {
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Vozvrat muvaffaqiyatli saqlandi!')),
                            );
                            _load();
                          }
                        }
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Xatolik: ${ApiService.parseError(e)}')),
                          );
                        }
                      }
                    },
                    style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                    child: Text('Vozvrat Yaratish', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Vozvratlar (Qaytarish)', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateReturnDialog,
        icon: const Icon(Icons.assignment_return),
        label: Text('Vozvrat Yaratish', style: GoogleFonts.outfit()),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _returns.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.assignment_return_outlined, size: 64, color: theme.colorScheme.outline),
                          const SizedBox(height: 12),
                          Text('Vozvratlar topilmadi', style: GoogleFonts.outfit(fontSize: 16)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _returns.length,
                      itemBuilder: (ctx, i) {
                        final r = _returns[i];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: Colors.orange.withOpacity(0.15),
                              child: const Icon(Icons.assignment_return, color: Colors.orange),
                            ),
                            title: Text(r['reason'] ?? 'Vozvrat', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                            subtitle: Text('Status: ${r['status'] ?? 'PENDING'}'),
                            trailing: Text(
                              '${r['totalRefundUzs'] ?? '0'} UZS',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red),
                            ),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
