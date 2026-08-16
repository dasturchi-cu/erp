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

  // Create & Edit Supplier Form
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

    final formKey = GlobalKey<FormState>();
    bool submitted = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              left: 20, right: 20, top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            child: SingleChildScrollView(
              child: Form(
                key: formKey,
                autovalidateMode: submitted ? AutovalidateMode.always : AutovalidateMode.disabled,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Yangi Ta\'minotchi Qo\'shish', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _nameCtrl,
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Ta\'minotchi / firma nomi majburiy!' : null,
                      decoration: const InputDecoration(
                        labelText: 'Ta\'minotchi Nomi / Firma *',
                        prefixIcon: Icon(Icons.store),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Telefon raqam majburiy!' : null,
                      decoration: const InputDecoration(
                        labelText: 'Telefon Raqam *',
                        prefixIcon: Icon(Icons.phone),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _contactCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Mas\'ul Shaxs (Kontakt)',
                        prefixIcon: Icon(Icons.person_outline),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
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
                        setModalState(() => submitted = true);
                        if (!formKey.currentState!.validate()) {
                          return;
                        }

                        final name = _nameCtrl.text.trim();
                        final phone = _phoneCtrl.text.trim();

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
                                const SnackBar(content: Text('Ta\'minotchi muvaffaqiyatli qo\'shildi!')),
                              );
                              _load(_searchQuery);
                            }
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Xatolik: ${ApiService.parseError(e)}')),
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
            ),
          );
        },
      ),
    );
  }

  void _showEditSupplierDialog(Map<String, dynamic> s) {
    _nameCtrl.text = s['name'] ?? '';
    _phoneCtrl.text = s['phone'] ?? '';
    _contactCtrl.text = s['contactPerson'] ?? '';
    _notesCtrl.text = s['notes'] ?? '';

    final formKey = GlobalKey<FormState>();
    bool submitted = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          return Padding(
            padding: EdgeInsets.only(
              left: 20, right: 20, top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            child: SingleChildScrollView(
              child: Form(
                key: formKey,
                autovalidateMode: submitted ? AutovalidateMode.always : AutovalidateMode.disabled,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Ta\'minotchini Tahrirlash', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _nameCtrl,
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Ta\'minotchi nomi majburiy!' : null,
                      decoration: const InputDecoration(
                        labelText: 'Ta\'minotchi Nomi *',
                        prefixIcon: Icon(Icons.store),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _phoneCtrl,
                      keyboardType: TextInputType.phone,
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Telefon raqam majburiy!' : null,
                      decoration: const InputDecoration(
                        labelText: 'Telefon Raqam *',
                        prefixIcon: Icon(Icons.phone),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _contactCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Mas\'ul Shaxs',
                        prefixIcon: Icon(Icons.person_outline),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _notesCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Izoh',
                        prefixIcon: Icon(Icons.notes),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () async {
                        setModalState(() => submitted = true);
                        if (!formKey.currentState!.validate()) {
                          return;
                        }

                        final name = _nameCtrl.text.trim();
                        final phone = _phoneCtrl.text.trim();

                        try {
                          final res = await _api.patch('/suppliers/${s['id']}', {
                            'name': name,
                            'phone': phone,
                            'contactPerson': _contactCtrl.text.trim(),
                            'notes': _notesCtrl.text.trim(),
                          });
                          if (res.statusCode == 200 || res.statusCode == 204) {
                            if (mounted) {
                              Navigator.pop(ctx);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Ta\'minotchi ma\'lumotlari yangilandi!')),
                              );
                              _load(_searchQuery);
                            }
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Xatolik: ${ApiService.parseError(e)}')),
                            );
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                      child: Text('O\'zgarishlarni Saqlash', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void _confirmDeleteSupplier(Map<String, dynamic> s) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Ta\'minotchini o\'chirish'),
        content: Text('Haqiqatan ham "${s['name']}" ta\'minotchisini o\'chirmoqchimisiz (arxivlamoqchimisiz)?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Bekor qilish'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                final res = await _api.delete('/suppliers/${s['id']}');
                if (res.statusCode == 200 || res.statusCode == 204) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Ta\'minotchi muvaffaqiyatli o\'chirildi!')),
                    );
                    _load(_searchQuery);
                  }
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Xatolik: ${ApiService.parseError(e)}')),
                  );
                }
              }
            },
            child: const Text('O\'chirish'),
          ),
        ],
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
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
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
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.edit, size: 18),
                        label: const Text('Tahrirlash'),
                        onPressed: () {
                          Navigator.pop(ctx);
                          _showEditSupplierDialog(s);
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.delete_outline, color: Colors.red, size: 18),
                        label: const Text('O\'chirish', style: TextStyle(color: Colors.red)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.red),
                        ),
                        onPressed: () {
                          Navigator.pop(ctx);
                          _confirmDeleteSupplier(s);
                        },
                      ),
                    ),
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
                if (s['notes'] != null && s['notes'].toString().isNotEmpty)
                  ListTile(
                    dense: true,
                    leading: const Icon(Icons.notes),
                    title: Text(s['notes']),
                    subtitle: const Text('Izoh'),
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
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: TextStyle(color: theme.colorScheme.onSurface, fontWeight: FontWeight.bold),
                          decoration: const InputDecoration(labelText: 'Summa (so\'m)', border: OutlineInputBorder(), isDense: true),
                        ),
                      ),
                      const SizedBox(width: 8),
                      DropdownButton<String>(
                        value: payMethod,
                        dropdownColor: theme.colorScheme.surface,
                        style: TextStyle(color: theme.colorScheme.onSurface, fontSize: 14, fontWeight: FontWeight.w500),
                        iconEnabledColor: theme.colorScheme.onSurface,
                        items: [
                          DropdownMenuItem(value: 'CASH', child: Text('Naqd', style: TextStyle(color: theme.colorScheme.onSurface))),
                          DropdownMenuItem(value: 'CARD', child: Text('Karta', style: TextStyle(color: theme.colorScheme.onSurface))),
                          DropdownMenuItem(value: 'BANK_TRANSFER', child: Text('O\'tkazma', style: TextStyle(color: theme.colorScheme.onSurface))),
                        ],
                        onChanged: (v) => setModalState(() => payMethod = v!),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.payment),
                    label: const Text('To\'lovni Amalga Oshirish'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 12)),
                    onPressed: () async {
                      final payAmt = payCtrl.text.trim();
                      if (payAmt.isEmpty) return;
                      try {
                        final res = await _api.post('/suppliers/${s['id']}/payments', {
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
                        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Xatolik: ${ApiService.parseError(e)}')));
                      }
                    },
                  ),
                ],
              ],
            ),
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
                                  trailing: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      debtNum != 0
                                          ? Chip(
                                              label: Text(
                                                '${debtNum > 0 ? '-' : '+'}${_formatAmount(debtNum.abs())}',
                                                style: const TextStyle(fontSize: 12, color: Colors.white),
                                              ),
                                              backgroundColor: debtNum < 0 ? Colors.green : Colors.red,
                                              padding: EdgeInsets.zero,
                                            )
                                          : const Icon(Icons.check_circle_outline, color: Colors.green),
                                      const SizedBox(width: 4),
                                      PopupMenuButton<String>(
                                        icon: const Icon(Icons.more_vert),
                                        onSelected: (val) {
                                          if (val == 'edit') {
                                            _showEditSupplierDialog(s);
                                          } else if (val == 'delete') {
                                            _confirmDeleteSupplier(s);
                                          }
                                        },
                                        itemBuilder: (ctx) => [
                                          const PopupMenuItem(
                                            value: 'edit',
                                            child: Row(
                                              children: [
                                                Icon(Icons.edit, size: 18),
                                                SizedBox(width: 8),
                                                Text('Tahrirlash'),
                                              ],
                                            ),
                                          ),
                                          const PopupMenuItem(
                                            value: 'delete',
                                            child: Row(
                                              children: [
                                                Icon(Icons.delete_outline, color: Colors.red, size: 18),
                                                SizedBox(width: 8),
                                                Text('O\'chirish', style: TextStyle(color: Colors.red)),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
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
