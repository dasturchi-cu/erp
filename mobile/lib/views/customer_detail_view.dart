import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'customer_form_view.dart';

class CustomerDetailView extends StatefulWidget {
  final String customerId;

  const CustomerDetailView({super.key, required this.customerId});

  @override
  State<CustomerDetailView> createState() => _CustomerDetailViewState();
}

class _CustomerDetailViewState extends State<CustomerDetailView> {
  final _apiService = ApiService();
  bool _loading = true;
  Map<String, dynamic>? _customer;
  List<dynamic> _history = [];
  bool _deleting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _apiService.get('/customers/${widget.customerId}'),
        _apiService.get('/customers/${widget.customerId}/debt-history'),
      ]);
      setState(() {
        _customer = results[0].data;
        _history = results[1].data['data'] ?? [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _editCustomer() async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => CustomerFormView(customer: _customer)),
    );
    if (changed == true) _load();
  }

  Future<void> _deleteCustomer() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Mijozni o\'chirish'),
        content: Text('${_customer?['name']} o\'chirilsinmi?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Bekor qilish')),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('O\'chirish', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _deleting = true);
    try {
      await _apiService.delete('/customers/${widget.customerId}');
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _deleting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('O\'chirishda xatolik: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _recordPayment() async {
    final amountCtrl = TextEditingController();
    String paymentType = 'PARTIAL';
    String paymentMethod = 'CASH';

    final submitted = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('To\'lov qabul qilish'),
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
                  initialValue: paymentType,
                  decoration: const InputDecoration(labelText: 'To\'lov turi'),
                  items: const [
                    DropdownMenuItem(value: 'PARTIAL', child: Text('Qisman')),
                    DropdownMenuItem(value: 'FULL', child: Text('To\'liq')),
                  ],
                  onChanged: (v) => setDialogState(() => paymentType = v ?? 'PARTIAL'),
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
                  await _apiService.postIdempotent('/debt-payments', {
                    'customerId': widget.customerId,
                    'amount': amount,
                    'currency': 'UZS',
                    'paymentMethod': paymentMethod,
                    'paymentType': paymentType,
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
          const SnackBar(content: Text('To\'lov qabul qilindi')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final c = _customer;
    final debt = double.parse(c?['debtUzs']?.toString() ?? '0.0');

    return Scaffold(
      appBar: AppBar(
        title: Text('Mijoz profili', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(icon: const Icon(Icons.edit_outlined), onPressed: _loading ? null : _editCustomer),
          IconButton(
            icon: _deleting
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.delete_outline),
            onPressed: _deleting ? null : _deleteCustomer,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : c == null
              ? const Center(child: Text('Mijoz topilmadi'))
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
                              Text(c['name'] ?? '', style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 18)),
                              const SizedBox(height: 4),
                              Text('Tel: ${c['phone'] ?? ''}'),
                              if (c['email'] != null) Text('Email: ${c['email']}'),
                              if (c['address'] != null) Text('Manzil: ${c['address']}'),
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
                                  const Text('Joriy qarz'),
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
                                label: const Text('To\'lov qabul qilish'),
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
                                leading: Icon(
                                  h['type'] == 'payment' ? Icons.arrow_downward : Icons.arrow_upward,
                                  color: h['type'] == 'payment' ? Colors.green : Colors.red,
                                ),
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
