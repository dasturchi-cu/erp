import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'supplier_form_view.dart';

class SupplierDetailView extends StatefulWidget {
  final String supplierId;

  const SupplierDetailView({super.key, required this.supplierId});

  @override
  State<SupplierDetailView> createState() => _SupplierDetailViewState();
}

class _SupplierDetailViewState extends State<SupplierDetailView> {
  final _apiService = ApiService();
  bool _loading = true;
  Map<String, dynamic>? _supplier;
  List<dynamic> _history = [];
  bool _archiving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _apiService.get('/suppliers/${widget.supplierId}'),
        _apiService.get('/suppliers/${widget.supplierId}/debt-history'),
      ]);
      setState(() {
        _supplier = results[0].data;
        _history = results[1].data['data'] ?? [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _editSupplier() async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => SupplierFormView(supplier: _supplier)),
    );
    if (changed == true) _load();
  }

  Future<void> _toggleArchive() async {
    final isActive = _supplier?['status'] == 'ACTIVE';
    final action = isActive ? 'archive' : 'restore';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isActive ? 'Arxivlash' : 'Qayta tiklash'),
        content: Text(isActive
            ? '${_supplier?['name']} arxivlansinmi?'
            : '${_supplier?['name']} qayta tiklansinmi?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Bekor qilish')),
          TextButton(onPressed: () => Navigator.of(ctx).pop(true), child: const Text('Ha')),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _archiving = true);
    try {
      await _apiService.post('/suppliers/${widget.supplierId}/$action', {});
      await _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xatolik: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _archiving = false);
    }
  }

  Future<void> _recordPayment() async {
    final amountCtrl = TextEditingController();
    String paymentMethod = 'CASH';

    final submitted = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('To\'lov qilish'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: amountCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: 'Summa (UZS)'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: paymentMethod,
                  decoration: const InputDecoration(labelText: 'To\'lov usuli'),
                  items: const [
                    DropdownMenuItem(value: 'CASH', child: Text('Naqd')),
                    DropdownMenuItem(value: 'CARD', child: Text('Karta')),
                    DropdownMenuItem(value: 'BANK_TRANSFER', child: Text('Bank o\'tkazmasi')),
                  ],
                  onChanged: (v) => setDialogState(() => paymentMethod = v ?? 'CASH'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Bekor qilish')),
            FilledButton(
              onPressed: () async {
                final amount = amountCtrl.text.trim();
                if (amount.isEmpty || num.tryParse(amount) == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('To\'g\'ri summa kiriting')),
                  );
                  return;
                }
                try {
                  await _apiService.post('/suppliers/${widget.supplierId}/payments', {
                    'amount': amount,
                    'currency': 'UZS',
                    'paymentMethod': paymentMethod,
                  });
                  if (ctx.mounted) Navigator.of(ctx).pop(true);
                } catch (e) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      SnackBar(content: Text('Xatolik: ${e.toString()}')),
                    );
                  }
                }
              },
              child: const Text('Saqlash'),
            ),
          ],
        ),
      ),
    );

    if (submitted == true) {
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('To\'lov qilindi')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final s = _supplier;
    final debt = double.parse(s?['remainingDebtUzs']?.toString() ?? '0.0');
    final isActive = s?['status'] == 'ACTIVE';

    return Scaffold(
      appBar: AppBar(
        title: Text('Yetkazib beruvchi profili', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(icon: const Icon(Icons.edit_outlined), onPressed: _loading ? null : _editSupplier),
          IconButton(
            icon: _archiving
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : Icon(isActive ? Icons.archive_outlined : Icons.unarchive_outlined),
            onPressed: _archiving ? null : _toggleArchive,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : s == null
              ? const Center(child: Text('Topilmadi'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(s['name'] ?? '', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18)),
                              const SizedBox(height: 4),
                              Text('Tel: ${s['phone'] ?? ''}'),
                              if (s['contactPerson'] != null) Text('Aloqa shaxsi: ${s['contactPerson']}'),
                              Text('Holat: ${isActive ? 'Faol' : 'Arxivlangan'}'),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Card(
                        color: debt > 0 ? Colors.red.withOpacity(0.08) : theme.colorScheme.primaryContainer,
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Qolgan qarz'),
                                  Text(
                                    '$debt UZS',
                                    style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 20,
                                      color: debt > 0 ? Colors.red : Colors.green,
                                    ),
                                  ),
                                ],
                              ),
                              FilledButton.icon(
                                onPressed: _recordPayment,
                                icon: const Icon(Icons.payments_outlined),
                                label: const Text('To\'lov qilish'),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text('Qarz tarixi', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 16)),
                      const SizedBox(height: 8),
                      if (_history.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 12),
                          child: Text('Qarz tarixi mavjud emas'),
                        )
                      else
                        ..._history.map((h) => Card(
                              margin: const EdgeInsets.only(bottom: 6),
                              child: ListTile(
                                title: Text('${h['amountUzs']} UZS'),
                                subtitle: Text('${h['type'] ?? ''} • ${h['createdAt'] ?? ''}'),
                                trailing: Text('Qoldiq: ${h['balanceAfterUzs'] ?? ''}'),
                              ),
                            )),
                    ],
                  ),
                ),
    );
  }
}
