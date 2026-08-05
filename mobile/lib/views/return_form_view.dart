import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class ReturnFormView extends StatefulWidget {
  final Map<String, dynamic> sale;

  const ReturnFormView({super.key, required this.sale});

  @override
  State<ReturnFormView> createState() => _ReturnFormViewState();
}

class _ReturnFormViewState extends State<ReturnFormView> {
  final _apiService = ApiService();
  final _reasonCtrl = TextEditingController();
  late final Map<String, TextEditingController> _qtyControllers;
  final Map<String, bool> _selected = {};
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final lineItems = (widget.sale['lineItems'] as List<dynamic>? ?? []);
    _qtyControllers = {
      for (final li in lineItems) li['productId'] as String: TextEditingController(text: '${li['quantity']}'),
    };
    for (final li in lineItems) {
      _selected[li['productId'] as String] = false;
    }
  }

  @override
  void dispose() {
    _reasonCtrl.dispose();
    for (final c in _qtyControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    final lineItems = (widget.sale['lineItems'] as List<dynamic>? ?? []);
    final chosen = lineItems.where((li) => _selected[li['productId']] == true).toList();

    if (chosen.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Kamida bitta mahsulot tanlang')),
      );
      return;
    }
    if (_reasonCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Qaytarish sababini kiriting')),
      );
      return;
    }

    setState(() => _submitting = true);

    final payload = {
      'reason': _reasonCtrl.text.trim(),
      'lineItems': chosen
          .map((li) => {
                'productId': li['productId'],
                'quantity': _qtyControllers[li['productId']]!.text.trim(),
              })
          .toList(),
    };

    try {
      await _apiService.postIdempotent('/sales/${widget.sale['id']}/returns', payload);
      if (mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Qaytarish so\'rovi yuborildi')),
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
  Widget build(BuildContext context) {
    final lineItems = (widget.sale['lineItems'] as List<dynamic>? ?? []);
    return Scaffold(
      appBar: AppBar(
        title: Text('Qaytarish yaratish', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text('Qaytariladigan mahsulotlarni tanlang', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          ...lineItems.map((li) {
            final pid = li['productId'] as String;
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: CheckboxListTile(
                value: _selected[pid] ?? false,
                onChanged: (v) => setState(() => _selected[pid] = v ?? false),
                title: Text(li['productName'] ?? ''),
                subtitle: Row(
                  children: [
                    const Text('Miqdor: '),
                    SizedBox(
                      width: 80,
                      child: TextField(
                        controller: _qtyControllers[pid],
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(isDense: true, border: OutlineInputBorder()),
                      ),
                    ),
                    Text(' / ${li['quantity']} sotilgan'),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 16),
          TextField(
            controller: _reasonCtrl,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Qaytarish sababi',
              border: OutlineInputBorder(),
            ),
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
                : const Text('Qaytarishni yuborish'),
          ),
        ],
      ),
    );
  }
}
