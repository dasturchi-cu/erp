import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class SuppliersView extends StatefulWidget {
  const SuppliersView({super.key});

  @override
  State<SuppliersView> createState() => _SuppliersViewState();
}

class _SuppliersViewState extends State<SuppliersView> {
  final _api = ApiService();
  bool _loading = true;
  List<dynamic> _suppliers = [];
  Map<String, dynamic> _summary = {};
  String _searchQuery = '';
  final _searchCtrl = TextEditingController();

  // Create Supplier Form
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _contactCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _load([String? q]) async {
    setState(() => _loading = true);
    try {
      final qParam = q != null && q.isNotEmpty ? '&q=${Uri.encodeComponent(q)}' : '';
      final res = await _api.get('/suppliers?limit=100$qParam');
      final sumRes = await _api.get('/suppliers/summary');
      if (mounted) {
        setState(() {
          final raw = res.data;
          if (raw is Map && raw.containsKey('data')) {
            _suppliers = raw['data'] is List ? raw['data'] : [];
          } else if (raw is List) {
            _suppliers = raw;
          }
          _summary = sumRes.data ?? {};
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showAddSupplierDialog() {
    _nameCtrl.clear();
    _phoneCtrl.clear();
    _contactCtrl.clear();
    _notesCtrl.clear();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20, right: 20, top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Yangi Ta\'minotchi Qo\'shish', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextField(
              controller: _nameCtrl,
              decoration: const InputDecoration(
                labelText: 'Ta\'minotchi Nomi / Firma *',
                prefixIcon: Icon(Icons.store),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Telefon Raqam *',
                prefixIcon: Icon(Icons.phone),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _contactCtrl,
              decoration: const InputDecoration(
                labelText: 'Mas\'ul Shaxs (Kontakt)',
                prefixIcon: Icon(Icons.person_outline),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notesCtrl,
              decoration: const InputDecoration(
                labelText: 'Izoh / Qayd',
                prefixIcon: Icon(Icons.notes),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                final name = _nameCtrl.text.trim();
                final phone = _phoneCtrl.text.trim();
                if (name.isEmpty || phone.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Nomi va telefon raqam majburiy!')),
                  );
                  return;
                }
                try {
                  final res = await _api.post('/suppliers', {
                    'name': name,
                    'phone': phone,
                    if (_contactCtrl.text.trim().isNotEmpty) 'contactPerson': _contactCtrl.text.trim(),
                    if (_notesCtrl.text.trim().isNotEmpty) 'notes': _notesCtrl.text.trim(),
                  });
                  if (res.statusCode == 200 || res.statusCode == 201) {
                    if (mounted) {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Ta\'minotchi qo\'shildi!')),
                      );
                      _load(_searchQuery);
                    }
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Xatolik: ${e.toString()}')),
                    );
                  }
                }
              },
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
              child: Text('Saqlash', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  void _showSupplierDetail(Map<String, dynamic> s) {
    final theme = Theme.of(context);
    final debt = (s['balance'] ?? s['totalDebt'] ?? s['debtUzs'] ?? 0.0);
    final debtNum = (debt is num) ? debt.toDouble() : (double.tryParse(debt.toString()) ?? 0.0);

    final payCtrl = TextEditingController(text: debtNum > 0 ? debtNum.toStringAsFixed(0) : '');
    String payMethod = 'CASH';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: theme.colorScheme.primaryContainer,
                    child: Icon(Icons.store, color: theme.colorScheme.onPrimaryContainer, size: 28),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(s['name'] ?? '', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                        Text(s['phone'] ?? '', style: GoogleFonts.outfit(color: theme.colorScheme.onSurfaceVariant)),
                      ],
                    ),
                  ),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const Divider(height: 24),
              Card(
                color: debtNum > 0 ? Colors.red.withOpacity(0.1) : Colors.green.withOpacity(0.1),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Qarz balansi', style: TextStyle(color: debtNum > 0 ? Colors.red : Colors.green, fontSize: 12)),
                      const SizedBox(height: 4),
                      Text(
                        '${_formatAmount(debtNum)} UZS',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: debtNum > 0 ? Colors.red : Colors.green),
                      ),
                    ],
                  ),
                ),
              ),
              if (s['contactPerson'] != null && s['contactPerson'].toString().isNotEmpty)
                ListTile(
                  dense: true,
                  leading: const Icon(Icons.person_outline),
                  title: Text(s['contactPerson']),
                  subtitle: const Text('Mas\'ul shaxs'),
                ),
              const SizedBox(height: 16),
              if (debtNum > 0) ...[
                Text('Ta\'minotchiga To\'lov Qilish', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 15)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: payCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Summa (so\'m)', border: OutlineInputBorder(), isDense: true),
                      ),
                    ),
                    const SizedBox(width: 8),
                    DropdownButton<String>(
                      value: payMethod,
                      items: const [
                        DropdownMenuItem(value: 'CASH', child: Text('Naqd')),
                        DropdownMenuItem(value: 'CARD', child: Text('Karta')),
                        DropdownMenuItem(value: 'TRANSFER', child: Text('O\'tkazma')),
                      ],
                      onChanged: (v) => setModalState(() => payMethod = v!),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  icon: const Icon(Icons.payment),
                  label: const Text('To\'lovni Amamalga Oshirish'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 12)),
                  onPressed: () async {
                    final payAmt = payCtrl.text.trim();
                    if (payAmt.isEmpty) return;
                    try {
                      final res = await _api.post('/suppliers/payments', {
                        'supplierId': s['id'],
                        'amount': payAmt,
                        'paymentMethod': payMethod,
                        'currency': 'UZS',
                        'notes': 'Mobil ilovadan ta\'minotchi to\'lovi',
                      });
                      if (res.statusCode == 200 || res.statusCode == 201) {
                        if (mounted) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('To\'lov muvaffaqiyatli qilindi!')));
                          _load(_searchQuery);
                        }
                      }
                    } catch (e) {
                      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Xatolik: ${e.toString()}')));
                    }
                  },
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Ta\'minotchilar', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: () => _load(_searchQuery)),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddSupplierDialog,
        icon: const Icon(Icons.add_business),
        label: Text('Ta\'minotchi', style: GoogleFonts.outfit()),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => _load(_searchQuery),
              child: Column(
                children: [
                  // Search Bar
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: TextField(
                      controller: _searchCtrl,
                      decoration: InputDecoration(
                        labelText: 'Ta\'minotchi qidirish...',
                        prefixIcon: const Icon(Icons.search),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear),
                                onPressed: () {
                                  _searchCtrl.clear();
                                  setState(() => _searchQuery = '');
                                  _load();
                                },
                              )
                            : null,
                        border: const OutlineInputBorder(),
                      ),
                      onChanged: (v) {
                        setState(() => _searchQuery = v.trim());
                        _load(v.trim());
                      },
                    ),
                  ),
                  // Summary cards
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    child: Row(
                      children: [
                        Expanded(
                          child: _summaryCard(
                            'Jami Qarz',
                            _formatAmount(_summary['totalDebt']),
                            Icons.money_off,
                            Colors.red,
                            theme,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _summaryCard(
                            'Ta\'minotchilar',
                            '${_summary['total'] ?? _suppliers.length}',
                            Icons.store_outlined,
                            Colors.blue,
                            theme,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: _suppliers.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.store_outlined, size: 64, color: theme.colorScheme.outline),
                                const SizedBox(height: 12),
                                Text('Ta\'minotchilar topilmadi', style: GoogleFonts.outfit(fontSize: 16)),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _suppliers.length,
                            itemBuilder: (ctx, i) {
                              final s = _suppliers[i];
                              final debt = (s['balance'] ?? s['totalDebt'] ?? s['debtUzs'] ?? 0.0);
                              final debtNum = (debt is num) ? debt.toDouble() : (double.tryParse(debt.toString()) ?? 0.0);
                              return Card(
                                margin: const EdgeInsets.only(bottom: 10),
                                child: ListTile(
                                  onTap: () => _showSupplierDetail(s),
                                  leading: CircleAvatar(
                                    backgroundColor: theme.colorScheme.primaryContainer,
                                    child: Text(
                                      (s['name'] ?? '?')[0].toUpperCase(),
                                      style: TextStyle(
                                        color: theme.colorScheme.onPrimaryContainer,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  title: Text(
                                    s['name'] ?? 'Noma\'lum',
                                    style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
                                  ),
                                  subtitle: Text(
                                    s['phone'] ?? s['contactPerson'] ?? '',
                                    style: GoogleFonts.outfit(fontSize: 13),
                                  ),
                                  trailing: debtNum != 0
                                      ? Chip(
                                          label: Text(
                                            '${debtNum > 0 ? '-' : '+'}${_formatAmount(debtNum.abs())}',
                                            style: const TextStyle(fontSize: 12, color: Colors.white),
                                          ),
                                          backgroundColor: debtNum < 0 ? Colors.green : Colors.red,
                                          padding: EdgeInsets.zero,
                                        )
                                      : const Icon(Icons.check_circle_outline, color: Colors.green),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _summaryCard(String label, String value, IconData icon, Color color, ThemeData theme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: color.withOpacity(0.15),
              radius: 20,
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: GoogleFonts.outfit(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                  Text(value, style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatAmount(dynamic val) {
    if (val == null) return '0';
    final n = (val is num) ? val.toDouble() : (double.tryParse(val.toString()) ?? 0.0);
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(0)}K';
    return n.toStringAsFixed(0);
  }
}
