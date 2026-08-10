import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class ExpensesView extends StatefulWidget {
  const ExpensesView({super.key});

  @override
  State<ExpensesView> createState() => _ExpensesViewState();
}

class _ExpensesViewState extends State<ExpensesView> {
  final _api = ApiService();
  bool _loading = true;
  List<dynamic> _expenses = [];
  Map<String, dynamic> _cashBalance = {};

  // Add expense form
  final _amountCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();
  String _selectedCategory = 'OTHER';

  final _categories = [
    {'value': 'RENT', 'label': 'Ijara', 'icon': Icons.home_outlined},
    {'value': 'SALARY', 'label': 'Maosh', 'icon': Icons.payments_outlined},
    {'value': 'UTILITIES', 'label': 'Kommunal', 'icon': Icons.electrical_services_outlined},
    {'value': 'SUPPLIES', 'label': 'Jihozlar / Zaxira', 'icon': Icons.shopping_bag_outlined},
    {'value': 'MARKETING', 'label': 'Reklama', 'icon': Icons.campaign_outlined},
    {'value': 'TRANSPORT', 'label': 'Transport', 'icon': Icons.directions_car_outlined},
    {'value': 'MAINTENANCE', 'label': 'Ta\'mirlash', 'icon': Icons.build_outlined},
    {'value': 'OTHER', 'label': 'Boshqa', 'icon': Icons.category_outlined},
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get('/expenses?limit=50');
      final cashRes = await _api.get('/expenses/cash-register');
      if (mounted) {
        setState(() {
          final raw = res.data;
          _expenses = raw is Map && raw.containsKey('data') ? raw['data'] : (raw is List ? raw : []);
          _cashBalance = cashRes.data ?? {};
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _addExpense() async {
    final amtText = _amountCtrl.text.trim();
    if (amtText.isEmpty) return;

    final parsedAmt = double.tryParse(amtText);
    if (parsedAmt == null || parsedAmt <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Xarajat summasi musbat raqam bo\'lishi kerak!')),
      );
      return;
    }

    final note = _noteCtrl.text.trim();
    final catObj = _categories.firstWhere((c) => c['value'] == _selectedCategory, orElse: () => _categories.last);
    final desc = note.isNotEmpty ? note : (catObj['label'] as String);

    try {
      final res = await _api.post('/expenses', {
        'category': _selectedCategory,
        'description': desc,
        'originalCurrency': 'UZS',
        'amount': parsedAmt,
        'expenseDate': DateTime.now().toIso8601String(),
        if (note.isNotEmpty) 'notes': note,
      });

      if (res.statusCode == 200 || res.statusCode == 201) {
        _amountCtrl.clear();
        _noteCtrl.clear();
        if (mounted) {
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Xarajat muvaffaqiyatli saqlandi!')),
          );
          _load();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xatolik: ${ApiService.parseError(e)}')),
        );
      }
    }
  }

  void _showAddExpenseDialog() {
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
              Text('Xarajat Qo\'shish', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextField(
                controller: _amountCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Summa (so\'m) *',
                  prefixIcon: Icon(Icons.money),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _selectedCategory,
                decoration: const InputDecoration(
                  labelText: 'Kategoriya *',
                  border: OutlineInputBorder(),
                ),
                items: _categories.map((c) => DropdownMenuItem(
                  value: c['value'] as String,
                  child: Text(c['label'] as String),
                )).toList(),
                onChanged: (v) => setModalState(() => _selectedCategory = v!),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _noteCtrl,
                decoration: const InputDecoration(
                  labelText: 'Izoh / Tafsilot',
                  prefixIcon: Icon(Icons.notes),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _addExpense,
                icon: const Icon(Icons.add),
                label: Text('Saqlash', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatNumber(dynamic val) {
    if (val == null) return '0';
    final n = (val is num) ? val.toDouble() : (double.tryParse(val.toString()) ?? 0.0);
    final str = n.abs().toStringAsFixed(0);
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) {
        buffer.write(' ');
      }
      buffer.write(str[i]);
    }
    return '${n < 0 ? '-' : ''}${buffer.toString()}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cashBalance = (_cashBalance['balance'] ?? 0.0);

    return Scaffold(
      appBar: AppBar(
        title: Text('Xarajatlar', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddExpenseDialog,
        icon: const Icon(Icons.add),
        label: Text('Xarajat Qo\'shish', style: GoogleFonts.outfit()),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: Column(
                children: [
                  // Cash balance card
                  Container(
                    margin: const EdgeInsets.all(16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [theme.colorScheme.primary, theme.colorScheme.tertiary],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.account_balance_wallet, color: Colors.white, size: 36),
                        const SizedBox(width: 16),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Kassa Balansi', style: GoogleFonts.outfit(color: Colors.white70, fontSize: 14)),
                            Text(
                              '${_formatNumber(cashBalance)} so\'m',
                              style: GoogleFonts.outfit(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  // Expenses list
                  Expanded(
                    child: _expenses.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.receipt_long_outlined, size: 64, color: theme.colorScheme.outline),
                                const SizedBox(height: 12),
                                Text('Xarajatlar topilmadi', style: GoogleFonts.outfit(fontSize: 16)),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _expenses.length,
                            itemBuilder: (ctx, i) {
                              final e = _expenses[i];
                              final cat = _categories.firstWhere(
                                (c) => c['value'] == e['category'],
                                orElse: () => _categories.last,
                              );
                              final amt = e['amount'] ?? 0;
                              return Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: Colors.red.withOpacity(0.15),
                                    child: Icon(cat['icon'] as IconData, color: Colors.red, size: 20),
                                  ),
                                  title: Text(
                                    (e['description'] != null && e['description'].toString().isNotEmpty)
                                        ? e['description']
                                        : (cat['label'] as String),
                                    style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
                                  ),
                                  subtitle: Text(e['notes'] ?? e['note'] ?? cat['label'] as String, style: GoogleFonts.outfit(fontSize: 13)),
                                  trailing: Text(
                                    '-${_formatNumber(amt)} so\'m',
                                    style: GoogleFonts.outfit(
                                      color: Colors.red,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
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
}
