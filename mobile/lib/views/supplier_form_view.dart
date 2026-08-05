import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class SupplierFormView extends StatefulWidget {
  final Map<String, dynamic>? supplier;

  const SupplierFormView({super.key, this.supplier});

  @override
  State<SupplierFormView> createState() => _SupplierFormViewState();
}

class _SupplierFormViewState extends State<SupplierFormView> {
  final _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();

  bool get _isEdit => widget.supplier != null;

  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _contactPersonCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final s = widget.supplier;
    if (s != null) {
      _nameCtrl.text = s['name'] ?? '';
      _phoneCtrl.text = s['phone'] ?? '';
      _contactPersonCtrl.text = s['contactPerson'] ?? '';
      _notesCtrl.text = s['notes'] ?? '';
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _contactPersonCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  String? _requiredValidator(String? v) => (v == null || v.trim().isEmpty) ? 'Majburiy maydon' : null;

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);
    final payload = {
      'name': _nameCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim(),
      if (_contactPersonCtrl.text.trim().isNotEmpty) 'contactPerson': _contactPersonCtrl.text.trim(),
      if (_notesCtrl.text.trim().isNotEmpty) 'notes': _notesCtrl.text.trim(),
    };

    try {
      if (_isEdit) {
        await _apiService.patch('/suppliers/${widget.supplier!['id']}', payload);
      } else {
        await _apiService.post('/suppliers', payload);
      }
      if (mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_isEdit ? 'Yangilandi' : 'Qo\'shildi')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xatolik: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'Tahrirlash' : 'Yangi yetkazib beruvchi', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Nomi', border: OutlineInputBorder()),
              validator: _requiredValidator,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Telefon', border: OutlineInputBorder()),
              validator: _requiredValidator,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _contactPersonCtrl,
              decoration: const InputDecoration(labelText: 'Aloqa shaxsi (ixtiyoriy)', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _notesCtrl,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Izoh (ixtiyoriy)', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _saving ? null : _save,
              style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              child: _saving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Saqlash'),
            ),
          ],
        ),
      ),
    );
  }
}
