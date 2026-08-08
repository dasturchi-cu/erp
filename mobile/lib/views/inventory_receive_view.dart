import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class InventoryReceiveView extends StatefulWidget {
  const InventoryReceiveView({super.key});

  @override
  State<InventoryReceiveView> createState() => _InventoryReceiveViewState();
}

class _InventoryReceiveViewState extends State<InventoryReceiveView> {
  final _apiService = ApiService();
  bool _loading = true;

  List<dynamic> _products = [];
  List<dynamic> _warehouses = [];
  List<dynamic> _suppliers = [];

  Map<String, dynamic>? _selectedProduct;
  Map<String, dynamic>? _selectedWarehouse;
  Map<String, dynamic>? _selectedSupplier;

  final _quantityController = TextEditingController();
  final _costController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadDependencies();
  }

  @override
  void dispose() {
    _quantityController.dispose();
    _costController.dispose();
    super.dispose();
  }

  Future<void> _loadDependencies() async {
    setState(() => _loading = true);
    try {
      final pRes = await _apiService.get('/products?limit=100');
      final wRes = await _apiService.get('/inventory/warehouses');
      final sRes = await _apiService.get('/suppliers?limit=100');

      if (mounted) {
        setState(() {
          _products = pRes.data['data'] ?? pRes.data ?? [];
          _warehouses = wRes.data['data'] ?? wRes.data ?? [];
          _suppliers = sRes.data['data'] ?? sRes.data ?? [];

          if (_warehouses.isNotEmpty) _selectedWarehouse = _warehouses.first;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleReceive() async {
    if (_selectedProduct == null || _selectedWarehouse == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mahsulot va Ombor tanlanishi majburiy!')),
      );
      return;
    }

    final qty = _quantityController.text.trim();
    final cost = _costController.text.trim();

    if (qty.isEmpty || cost.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Miqdor va Kelish Narxi kiritilishi kerak!')),
      );
      return;
    }

    try {
      final res = await _apiService.post('/inventory/receive', {
        'productId': _selectedProduct!['id'],
        'warehouseId': _selectedWarehouse!['id'],
        'quantity': qty,
        'unitCostUzs': cost,
        if (_selectedSupplier != null) 'supplierId': _selectedSupplier!['id'],
      });

      if (res.statusCode == 200 || res.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Mahsulot omborga muvaffaqiyatli kirim qilindi!')),
          );
          _quantityController.clear();
          _costController.clear();
          setState(() {
            _selectedProduct = null;
            _selectedSupplier = null;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xatolik: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Mahsulot Kirim Qilish',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Kirim Ma\'lumotlari',
                        style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 16),
                      // Product Picker
                      DropdownButtonFormField<Map<String, dynamic>>(
                        value: _selectedProduct,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          labelText: 'Mahsulot *',
                          prefixIcon: Icon(Icons.inventory_2_outlined),
                          border: OutlineInputBorder(),
                        ),
                        items: _products.map((p) => DropdownMenuItem(
                          value: p as Map<String, dynamic>,
                          child: Text('${p['name']} (SKU: ${p['sku']})', overflow: TextOverflow.ellipsis),
                        )).toList(),
                        onChanged: (val) {
                          setState(() {
                            _selectedProduct = val;
                            if (val != null && val['purchasePriceUzs'] != null) {
                              _costController.text = val['purchasePriceUzs'].toString();
                            }
                          });
                        },
                      ),
                      const SizedBox(height: 12),
                      // Warehouse Picker
                      DropdownButtonFormField<Map<String, dynamic>>(
                        value: _selectedWarehouse,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          labelText: 'Qaysi Omborgacha? *',
                          prefixIcon: Icon(Icons.warehouse_outlined),
                          border: OutlineInputBorder(),
                        ),
                        items: _warehouses.map((w) => DropdownMenuItem(
                          value: w as Map<String, dynamic>,
                          child: Text(w['name'] ?? 'Ombor', overflow: TextOverflow.ellipsis),
                        )).toList(),
                        onChanged: (val) => setState(() => _selectedWarehouse = val),
                      ),
                      const SizedBox(height: 12),
                      // Supplier Picker
                      DropdownButtonFormField<Map<String, dynamic>>(
                        value: _selectedSupplier,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          labelText: 'Ta\'minotchi (ixtiyoriy)',
                          prefixIcon: Icon(Icons.store_outlined),
                          border: OutlineInputBorder(),
                        ),
                        items: [
                          const DropdownMenuItem(value: null, child: Text('Ta\'minotchisiz')),
                          ..._suppliers.map((s) => DropdownMenuItem(
                            value: s as Map<String, dynamic>,
                            child: Text(s['name'] ?? '', overflow: TextOverflow.ellipsis),
                          )),
                        ],
                        onChanged: (val) => setState(() => _selectedSupplier = val),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _quantityController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'Kirim Miqdori *',
                                border: OutlineInputBorder(),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: _costController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'Tannarx (UZS) *',
                                border: OutlineInputBorder(),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add_shopping_cart),
                        label: Text('Kirimni Saqlash', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor: theme.colorScheme.primary,
                          foregroundColor: theme.colorScheme.onPrimary,
                        ),
                        onPressed: _handleReceive,
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}
