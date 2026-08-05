import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/search_picker.dart';

class InventoryTransferView extends StatefulWidget {
  const InventoryTransferView({super.key});

  @override
  State<InventoryTransferView> createState() => _InventoryTransferViewState();
}

class _InventoryTransferViewState extends State<InventoryTransferView> {
  final _apiService = ApiService();

  Map<String, dynamic>? _product;
  Map<String, dynamic>? _fromWarehouse;
  Map<String, dynamic>? _toWarehouse;
  final _quantityCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();
  bool _submitting = false;

  Future<void> _pickProduct() async {
    final selected = await showSearchPicker(
      context: context,
      title: 'Mahsulot tanlash',
      endpoint: '/products',
      titleBuilder: (p) => p['name'] ?? '',
      subtitleBuilder: (p) => 'SKU: ${p['sku']} | Qoldiq: ${p['stock'] ?? 0}',
    );
    if (selected != null) setState(() => _product = selected);
  }

  Future<void> _pickWarehouse({required bool isFrom}) async {
    final selected = await showSearchPicker(
      context: context,
      title: isFrom ? 'Qaysi ombordan' : 'Qaysi omborga',
      endpoint: '/warehouses',
      titleBuilder: (w) => w['name'] ?? '',
      subtitleBuilder: (w) => w['branchName'] ?? '',
    );
    if (selected != null) {
      setState(() {
        if (isFrom) {
          _fromWarehouse = selected;
        } else {
          _toWarehouse = selected;
        }
      });
    }
  }

  Future<void> _submit() async {
    if (_product == null || _fromWarehouse == null || _toWarehouse == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mahsulot va ikkala omborni tanlang')),
      );
      return;
    }
    if (_fromWarehouse!['id'] == _toWarehouse!['id']) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Manba va maqsad ombor bir xil bo\'lmasligi kerak')),
      );
      return;
    }
    if (_quantityCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Miqdorni kiriting')),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      await _apiService.post('/inventory/transfers', {
        'productId': _product!['id'],
        'fromWarehouseId': _fromWarehouse!['id'],
        'toWarehouseId': _toWarehouse!['id'],
        'quantity': _quantityCtrl.text.trim(),
        if (_noteCtrl.text.trim().isNotEmpty) 'note': _noteCtrl.text.trim(),
      });
      if (mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Mahsulot ko\'chirildi')),
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
    _noteCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Omborlar orasida ko\'chirish', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _pickerTile('Mahsulot', _product?['name'], Icons.inventory_2_outlined, _pickProduct),
          const SizedBox(height: 12),
          _pickerTile('Qaysi ombordan', _fromWarehouse?['name'], Icons.warehouse_outlined,
              () => _pickWarehouse(isFrom: true)),
          const SizedBox(height: 12),
          _pickerTile('Qaysi omborga', _toWarehouse?['name'], Icons.warehouse,
              () => _pickWarehouse(isFrom: false)),
          const SizedBox(height: 16),
          TextField(
            controller: _quantityCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'Miqdor', border: OutlineInputBorder()),
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
                : const Text('Ko\'chirish'),
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
