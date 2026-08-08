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
  String _selectedCategory = 'other';

  final _categories = [
    {'value': 'rent', 'label': 'Ijara', 'icon': Icons.home_outlined},
    {'value': 'salary', 'label': 'Maosh', 'icon': Icons.payments_outlined},
    {'value': 'utilities', 'label': 'Kommunal', 'icon': Icons.electrical_services_outlined},
    {'value': 'transport', 'label': 'Transport', 'icon': Icons.directions_car_outlined},
    {'value': 'other', 'label': 'Boshqa', 'icon': Icons.category_outlined},
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
      final res = await _api.get('/expenses?limit=30');
      final cashRes = await _api.get('/expenses/cash-register');
      if (mounted) {
        setState(() {
          _expenses = res.data['data'] ?? res.data ?? [];
          _cashBalance = cashRes.data ?? {};
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _addExpense() async {
    if (_amountCtrl.text.isEmpty) return;
    try {
      await _api.post('/expenses', {
        'amount': double.parse(_amountCtrl.text),
        'category': _selectedCategory,
        'note': _noteCtrl.text,
      });
      _amountCtrl.clear();
      _noteCtrl.clear();
      Navigator.of(context).pop();
      _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Xarajat qo\'shildi!')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xatolik: ${e.toString()}')),
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
                  labelText: 'Summa (so\'m)',
                  prefixIcon: Icon(Icons.money),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _selectedCategory,
                decoration: const InputDecoration(
                  labelText: 'Kategoriya',
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
                  labelText: 'Izoh (ixtiyoriy)',
                  prefixIcon: Icon(Icons.notes),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _addExpense,
                icon: const Icon(Icons.add),
                label: Text('Qo\'shish', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600)),
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cashBalance = (_cashBalance['balance'] ?? 0.0) as num;

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
        label: Text('Xarajat', style: GoogleFonts.outfit()),
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
                        Icon(Icons.account_balance_wallet, color: Colors.white, size: 36),
                        const SizedBox(width: 16),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Kassa Balansi', style: GoogleFonts.outfit(color: Colors.white70, fontSize: 14)),
                            Text(
                              '${cashBalance.toStringAsFixed(0)} so\'m',
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
                                Text('Xarajatlar yo\'q', style: GoogleFonts.outfit(fontSize: 16)),
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
                              return Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: Colors.red.withOpacity(0.15),
                                    child: Icon(cat['icon'] as IconData, color: Colors.red, size: 20),
                                  ),
                                  title: Text(
                                    cat['label'] as String,
                                    style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
                                  ),
                                  subtitle: Text(e['note'] ?? '', style: GoogleFonts.outfit(fontSize: 13)),
                                  trailing: Text(
                                    '-${(e['amount'] ?? 0).toString()} so\'m',
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
