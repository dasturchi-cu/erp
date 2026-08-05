import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/search_picker.dart';

class InventoryReceiveView extends StatefulWidget {
  const InventoryReceiveView({super.key});

  @override
  State<InventoryReceiveView> createState() => _InventoryReceiveViewState();
}

class _InventoryReceiveViewState extends State<InventoryReceiveView> {
  final _apiService = ApiService();

  Map<String, dynamic>? _product;
  Map<String, dynamic>? _warehouse;
  Map<String, dynamic>? _supplier;
  String _paymentType = 'CASH';

  final _quantityCtrl = TextEditingController();
  final _unitCostCtrl = TextEditingController();
  final _batchNumberCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();

  bool _submitting = false;

  Future<void> _pickProduct() async {
    final selected = await showSearchPicker(
      context: context,
      title: 'Mahsulot tanlash',
      endpoint: '/products',
      titleBuilder: (p) => p['name'] ?? '',
      subtitleBuilder: (p) => 'SKU: ${p['sku']}',
    );
    if (selected != null) setState(() => _product = selected);
  }

  Future<void> _pickWarehouse() async {
    final selected = await showSearchPicker(
      context: context,
      title: 'Ombor tanlash',
      endpoint: '/warehouses',
      titleBuilder: (w) => w['name'] ?? '',
      subtitleBuilder: (w) => w['branchName'] ?? '',
    );
    if (selected != null) setState(() => _warehouse = selected);
  }

  Future<void> _pickSupplier() async {
    final selected = await showSearchPicker(
      context: context,
      title: 'Yetkazib beruvchi tanlash',
      endpoint: '/suppliers',
      titleBuilder: (s) => s['name'] ?? '',
      subtitleBuilder: (s) => s['phone'] ?? '',
    );
    if (selected != null) setState(() => _supplier = selected);
  }

  Future<void> _submit() async {
    if (_product == null || _warehouse == null || _supplier == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mahsulot, ombor va yetkazib beruvchini tanlang')),
      );
      return;
    }
    if (_quantityCtrl.text.trim().isEmpty || _unitCostCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Miqdor va tannarxni kiriting')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      await _apiService.post('/inventory/receive', {
        'productId': _product!['id'],
        'warehouseId': _warehouse!['id'],
        'supplierId': _supplier!['id'],
        'quantity': _quantityCtrl.text.trim(),
        'unitCostUzs': _unitCostCtrl.text.trim(),
        'paymentType': _paymentType,
        if (_batchNumberCtrl.text.trim().isNotEmpty) 'batchNumber': _batchNumberCtrl.text.trim(),
        if (_noteCtrl.text.trim().isNotEmpty) 'note': _noteCtrl.text.trim(),
      });
      if (mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tovar qabul qilindi')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xatolik: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  void dispose() {
    _quantityCtrl.dispose();
    _unitCostCtrl.dispose();
    _batchNumberCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Tovar qabul qilish', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _pickerTile('Mahsulot', _product?['name'], Icons.inventory_2_outlined, _pickProduct),
          const SizedBox(height: 12),
          _pickerTile('Ombor', _warehouse?['name'], Icons.warehouse_outlined, _pickWarehouse),
          const SizedBox(height: 12),
          _pickerTile('Yetkazib beruvchi', _supplier?['name'], Icons.local_shipping_outlined, _pickSupplier),
          const SizedBox(height: 16),
          TextField(
            controller: _quantityCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'Miqdor', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _unitCostCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'Dona tannarxi (UZS)', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'CASH', label: Text('Naqd')),
              ButtonSegment(value: 'CREDIT', label: Text('Nasiya')),
            ],
            selected: {_paymentType},
            onSelectionChanged: (s) => setState(() => _paymentType = s.first),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _batchNumberCtrl,
            decoration: const InputDecoration(
              labelText: 'Partiya raqami (ixtiyoriy)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _noteCtrl,
            maxLines: 2,
            decoration: const InputDecoration(labelText: 'Izoh (ixtiyoriy)', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _submitting ? null : _submit,
            style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
            child: _submitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Qabul qilish'),
          ),
        ],
      ),
    );
  }

  Widget _pickerTile(String label, String? value, IconData icon, VoidCallback onTap) {
    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(icon),
      label: Align(
        alignment: Alignment.centerLeft,
        child: Text(value ?? '$label tanlash', overflow: TextOverflow.ellipsis),
      ),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        alignment: Alignment.centerLeft,
      ),
    );
  }
}
