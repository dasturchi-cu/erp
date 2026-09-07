import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class InventoryTransferView extends StatefulWidget {
  final Map<String, dynamic>? initialProduct;

  const InventoryTransferView({super.key, this.initialProduct});

  @override
  State<InventoryTransferView> createState() => _InventoryTransferViewState();
}

class _InventoryTransferViewState extends State<InventoryTransferView> {
  final _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();
  bool _submitted = false;
  bool _loading = true;
  bool _submitting = false;

  List<dynamic> _products = [];
  List<dynamic> _warehouses = [];

  Map<String, dynamic>? _selectedProduct;
  Map<String, dynamic>? _fromWarehouse;
  Map<String, dynamic>? _toWarehouse;

  final _quantityController = TextEditingController();
  final _noteController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadDependencies();
  }

  @override
  void dispose() {
    _quantityController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _loadDependencies() async {
    setState(() => _loading = true);
    try {
      final pRes = await _apiService.get('/products?limit=100');
      final wRes = await _apiService.get('/warehouses');

      if (mounted) {
        final pList = pRes.data is Map && pRes.data.containsKey('data') ? pRes.data['data'] : (pRes.data is List ? pRes.data : []);
        final wList = wRes.data is Map && wRes.data.containsKey('data') ? wRes.data['data'] : (wRes.data is List ? wRes.data : []);

        setState(() {
          _products = pList is List ? pList : [];
          _warehouses = wList is List ? wList : [];

          if (_warehouses.isNotEmpty) {
            _fromWarehouse = _warehouses.first as Map<String, dynamic>;
            _toWarehouse = _warehouses.length > 1 ? _warehouses[1] as Map<String, dynamic> : null;
          }

          if (widget.initialProduct != null) {
            final match = _products.firstWhere(
              (p) => p['id'] == widget.initialProduct!['id'],
              orElse: () => widget.initialProduct,
            );
            _selectedProduct = match as Map<String, dynamic>?;
          } else if (_products.isNotEmpty) {
            _selectedProduct = _products.first as Map<String, dynamic>;
          }

          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Yuklanmadi: ${ApiService.parseError(e)}')),
        );
      }
    }
  }

  double _getProductStock(Map<String, dynamic>? p) {
    if (p == null) return 0.0;
    final val = p['stock'] ?? p['totalStock'] ?? 0;
    return double.tryParse(val.toString()) ?? 0.0;
  }

  Future<void> _handleTransfer() async {
    setState(() => _submitted = true);
    if (!_formKey.currentState!.validate()) return;

    if (_selectedProduct == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Mahsulotni tanlang!')));
      return;
    }
    if (_fromWarehouse == null || _toWarehouse == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Ikkala omborni ham tanlang!')));
      return;
    }
    if (_fromWarehouse!['id'] == _toWarehouse!['id']) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Manba va maqsad ombor bir xil bo\'lmasligi kerak!')));
      return;
    }

    final qtyNum = double.tryParse(_quantityController.text.trim());
    if (qtyNum == null || qtyNum <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Miqdor musbat son bo\'lishi kerak!')));
      return;
    }

    setState(() => _submitting = true);
    try {
      final res = await _apiService.post('/inventory/transfers', {
        'productId': _selectedProduct!['id'],
        'fromWarehouseId': _fromWarehouse!['id'],
        'toWarehouseId': _toWarehouse!['id'],
        'quantity': qtyNum.toStringAsFixed(4),
        if (_noteController.text.trim().isNotEmpty) 'note': _noteController.text.trim(),
      });

      if (res.statusCode == 200 || res.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(backgroundColor: Colors.green, content: Text('Mahsulot omborlar orasida muvaffaqiyatli ko\'chirildi!')),
          );
          _quantityController.clear();
          _noteController.clear();
          await _loadDependencies();
          setState(() => _submitting = false);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: Colors.red, content: Text('Xatolik: ${ApiService.parseError(e)}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final currentStock = _getProductStock(_selectedProduct);

    return Scaffold(
      appBar: AppBar(
        title: Text('Omborlar Orasida Ko\'chirish', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : GestureDetector(
              onTap: () => FocusScope.of(context).unfocus(),
              child: SingleChildScrollView(
                padding: EdgeInsets.only(
                  left: 16.0, right: 16.0, top: 16.0,
                  bottom: MediaQuery.of(context).viewInsets.bottom + 40.0,
                ),
                child: Form(
                  key: _formKey,
                  autovalidateMode: _submitted ? AutovalidateMode.always : AutovalidateMode.disabled,
                  child: Card(
                    elevation: 1,
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          DropdownButtonFormField<Map<String, dynamic>>(
                            value: _selectedProduct,
                            isExpanded: true,
                            validator: (v) => v == null ? 'Mahsulot tanlanishi majburiy!' : null,
                            decoration: const InputDecoration(
                              labelText: 'Mahsulot *',
                              prefixIcon: Icon(Icons.inventory_2_outlined),
                              border: OutlineInputBorder(),
                            ),
                            items: _products.map((p) {
                              final stockVal = _getProductStock(p as Map<String, dynamic>);
                              return DropdownMenuItem(
                                value: p,
                                child: Text('${p['name']} (Qoldiq: $stockVal ${p['unitOfMeasure'] ?? 'dona'})', overflow: TextOverflow.ellipsis),
                              );
                            }).toList(),
                            onChanged: (val) => setState(() => _selectedProduct = val),
                          ),
                          if (_selectedProduct != null) ...[
                            const SizedBox(height: 8),
                            Text(
                              'Jami qoldiq (barcha omborlarda): $currentStock ${_selectedProduct!['unitOfMeasure'] ?? 'dona'}',
                              style: GoogleFonts.outfit(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                            ),
                          ],
                          const SizedBox(height: 14),
                          DropdownButtonFormField<Map<String, dynamic>>(
                            value: _fromWarehouse,
                            isExpanded: true,
                            validator: (v) => v == null ? 'Manba ombor tanlanishi majburiy!' : null,
                            decoration: const InputDecoration(
                              labelText: 'Qaysi ombordan *',
                              prefixIcon: Icon(Icons.warehouse_outlined),
                              border: OutlineInputBorder(),
                            ),
                            items: _warehouses.map((w) => DropdownMenuItem(
                                  value: w as Map<String, dynamic>,
                                  child: Text(w['name'] ?? 'Ombor', overflow: TextOverflow.ellipsis),
                                )).toList(),
                            onChanged: (val) => setState(() => _fromWarehouse = val),
                          ),
                          const SizedBox(height: 8),
                          Center(child: Icon(Icons.arrow_downward, color: theme.colorScheme.primary)),
                          const SizedBox(height: 8),
                          DropdownButtonFormField<Map<String, dynamic>>(
                            value: _toWarehouse,
                            isExpanded: true,
                            validator: (v) => v == null ? 'Maqsad ombor tanlanishi majburiy!' : null,
                            decoration: const InputDecoration(
                              labelText: 'Qaysi omborga *',
                              prefixIcon: Icon(Icons.warehouse),
                              border: OutlineInputBorder(),
                            ),
                            items: _warehouses.map((w) => DropdownMenuItem(
                                  value: w as Map<String, dynamic>,
                                  child: Text(w['name'] ?? 'Ombor', overflow: TextOverflow.ellipsis),
                                )).toList(),
                            onChanged: (val) => setState(() => _toWarehouse = val),
                          ),
                          const SizedBox(height: 14),
                          TextFormField(
                            controller: _quantityController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) return 'Miqdor majburiy!';
                              final n = double.tryParse(v.trim());
                              if (n == null || n <= 0) return 'Musbat raqam kiriting!';
                              return null;
                            },
                            decoration: const InputDecoration(
                              labelText: 'Ko\'chiriladigan miqdor *',
                              prefixIcon: Icon(Icons.swap_horiz),
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 14),
                          TextFormField(
                            controller: _noteController,
                            decoration: const InputDecoration(
                              labelText: 'Izoh (ixtiyoriy)',
                              prefixIcon: Icon(Icons.notes_outlined),
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 20),
                          ElevatedButton.icon(
                            icon: _submitting
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5))
                                : const Icon(Icons.swap_horiz),
                            label: Text(
                              _submitting ? 'Saqlanmoqda...' : 'Ko\'chirishni Saqlash',
                              style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              backgroundColor: theme.colorScheme.primary,
                              foregroundColor: Colors.white,
                            ),
                            onPressed: _submitting ? null : _handleTransfer,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
    );
  }
}
