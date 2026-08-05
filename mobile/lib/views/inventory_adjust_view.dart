import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/search_picker.dart';

class InventoryAdjustView extends StatefulWidget {
  const InventoryAdjustView({super.key});

  @override
  State<InventoryAdjustView> createState() => _InventoryAdjustViewState();
}

class _InventoryAdjustViewState extends State<InventoryAdjustView> {
  final _apiService = ApiService();

  Map<String, dynamic>? _product;
  Map<String, dynamic>? _warehouse;
  final _deltaCtrl = TextEditingController();
  final _reasonCtrl = TextEditingController();
  bool _isIncrease = true;
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

  Future<void> _submit() async {
    if (_product == null || _warehouse == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mahsulot va omborni tanlang')),
      );
      return;
    }
    final raw = _deltaCtrl.text.trim();
    if (raw.isEmpty || num.tryParse(raw) == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('To\'g\'ri miqdor kiriting')),
      );
      return;
    }
    if (_reasonCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sababni kiriting')),
      );
      return;
    }

    final delta = _isIncrease ? raw : '-$raw';

    setState(() => _submitting = true);
    try {
      await _apiService.post('/inventory/adjust', {
        'productId': _product!['id'],
        'warehouseId': _warehouse!['id'],
        'quantityDelta': delta,
        'reason': _reasonCtrl.text.trim(),
      });
      if (mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Qoldiq tuzatildi')),
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
    _deltaCtrl.dispose();
    _reasonCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Inventarizatsiya (qoldiqni tuzatish)', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _pickerTile('Mahsulot', _product?['name'], Icons.inventory_2_outlined, _pickProduct),
          const SizedBox(height: 12),
          _pickerTile('Ombor', _warehouse?['name'], Icons.warehouse_outlined, _pickWarehouse),
          const SizedBox(height: 16),
          SegmentedButton<bool>(
            segments: const [
              ButtonSegment(value: true, label: Text('Ko\'paytirish (+)')),
              ButtonSegment(value: false, label: Text('Kamaytirish (-)')),
            ],
            selected: {_isIncrease},
            onSelectionChanged: (s) => setState(() => _isIncrease = s.first),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _deltaCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'Miqdor', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _reasonCtrl,
            maxLines: 2,
            decoration: const InputDecoration(labelText: 'Sabab', border: OutlineInputBorder()),
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
                : const Text('Tasdiqlash'),
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
