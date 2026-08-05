import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class CustomerFormView extends StatefulWidget {
  final Map<String, dynamic>? customer;

  const CustomerFormView({super.key, this.customer});

  @override
  State<CustomerFormView> createState() => _CustomerFormViewState();
}

class _CustomerFormViewState extends State<CustomerFormView> {
  final _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();

  bool get _isEdit => widget.customer != null;

  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _phoneSecondaryCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final c = widget.customer;
    if (c != null) {
      _nameCtrl.text = c['name'] ?? '';
      _phoneCtrl.text = c['phone'] ?? '';
      _phoneSecondaryCtrl.text = c['phoneSecondary'] ?? '';
      _emailCtrl.text = c['email'] ?? '';
      _addressCtrl.text = c['address'] ?? '';
      _notesCtrl.text = c['notes'] ?? '';
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _phoneSecondaryCtrl.dispose();
    _emailCtrl.dispose();
    _addressCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  String? _requiredValidator(String? v) => (v == null || v.trim().isEmpty) ? 'Majburiy maydon' : null;

  String? _phoneValidator(String? v) {
    if (v == null || v.trim().isEmpty) return 'Majburiy maydon';
    if (!RegExp(r'^\+[1-9]\d{1,14}$').hasMatch(v.trim())) {
      return 'Format: +998901234567';
    }
    return null;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);
    final payload = {
      'name': _nameCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim(),
      if (_phoneSecondaryCtrl.text.trim().isNotEmpty) 'phoneSecondary': _phoneSecondaryCtrl.text.trim(),
      if (_emailCtrl.text.trim().isNotEmpty) 'email': _emailCtrl.text.trim(),
      if (_addressCtrl.text.trim().isNotEmpty) 'address': _addressCtrl.text.trim(),
      if (_notesCtrl.text.trim().isNotEmpty) 'notes': _notesCtrl.text.trim(),
    };

    try {
      if (_isEdit) {
        await _apiService.patch('/customers/${widget.customer!['id']}', payload);
      } else {
        await _apiService.post('/customers', payload);
      }
      if (mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_isEdit ? 'Mijoz yangilandi' : 'Mijoz qo\'shildi')),
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
        title: Text(_isEdit ? 'Mijozni tahrirlash' : 'Yangi mijoz', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Ism / Tashkilot nomi', border: OutlineInputBorder()),
              validator: _requiredValidator,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Telefon',
                helperText: 'Format: +998901234567',
                border: OutlineInputBorder(),
              ),
              validator: _phoneValidator,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phoneSecondaryCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Qo\'shimcha telefon (ixtiyoriy)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email (ixtiyoriy)', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _addressCtrl,
              decoration: const InputDecoration(labelText: 'Manzil (ixtiyoriy)', border: OutlineInputBorder()),
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
