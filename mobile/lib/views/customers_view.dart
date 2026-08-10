import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class CustomersView extends StatefulWidget {
  const CustomersView({super.key});

  @override
  State<CustomersView> createState() => _CustomersViewState();
}

class _CustomersViewState extends State<CustomersView> {
  final _apiService = ApiService();
  bool _loading = true;
  List<dynamic> _customers = [];
  String _searchQuery = '';
  final _searchController = TextEditingController();

  // Form controllers for creating customer
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchCustomers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _fetchCustomers([String? q]) async {
    setState(() => _loading = true);
    try {
      final queryStr = q != null && q.isNotEmpty ? '&q=${Uri.encodeComponent(q)}' : '';
      final res = await _apiService.get('/customers?limit=100$queryStr');
      if (res.statusCode == 200) {
        final rawData = res.data;
        List<dynamic> list = [];
        if (rawData is Map && rawData.containsKey('data')) {
          list = rawData['data'] is List ? rawData['data'] : [];
        } else if (rawData is List) {
          list = rawData;
        }
        if (mounted) {
          setState(() {
            _customers = list;
            _loading = false;
          });
        }
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  double _parseAmount(dynamic val) {
    if (val == null) return 0.0;
    if (val is num) return val.toDouble();
    return double.tryParse(val.toString().replaceAll(',', '')) ?? 0.0;
  }

  String _formatCurrency(double amount, [String unit = 'UZS']) {
    final str = amount.abs().toStringAsFixed(0);
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) {
        buffer.write(' ');
      }
      buffer.write(str[i]);
    }
    return '${amount < 0 ? '-' : ''}${buffer.toString()} $unit';
  }

  void _showAddCustomerDialog() {
    _nameController.clear();
    _phoneController.clear();
    _addressController.clear();
    _notesController.clear();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Yangi Mijoz Qo\'shish',
                  style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Mijoz ismi / Tashkilot *',
                prefixIcon: Icon(Icons.person),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Telefon (+998...) *',
                prefixIcon: Icon(Icons.phone),
                hintText: '+998901234567',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _addressController,
              decoration: const InputDecoration(
                labelText: 'Manzil (ixtiyoriy)',
                prefixIcon: Icon(Icons.location_on_outlined),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _notesController,
              decoration: const InputDecoration(
                labelText: 'Izoh / Qayd',
                prefixIcon: Icon(Icons.note_outlined),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () async {
                final name = _nameController.text.trim();
                var phone = _phoneController.text.trim();
                if (name.isEmpty || phone.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Ism va telefon raqam majburiy!')),
                  );
                  return;
                }
                if (!phone.startsWith('+')) {
                  phone = '+$phone';
                }

                try {
                  final res = await _apiService.post('/customers', {
                    'name': name,
                    'phone': phone,
                    if (_addressController.text.trim().isNotEmpty)
                      'address': _addressController.text.trim(),
                    if (_notesController.text.trim().isNotEmpty)
                      'notes': _notesController.text.trim(),
                  });

                  if (res.statusCode == 200 || res.statusCode == 201) {
                    if (mounted) {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Mijoz muvaffaqiyatli qo\'shildi!')),
                      );
                      _fetchCustomers();
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
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: Text(
                'Saqlash',
                style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCustomerDetail(Map<String, dynamic> c) {
    final theme = Theme.of(context);
    final debtUzs = _parseAmount(c['debtUzs'] ?? c['totalDebtUzs'] ?? c['debt']);
    final debtUsd = _parseAmount(c['debtUsd'] ?? c['totalDebtUsd']);
    final purchases = _parseAmount(c['totalPurchasesUzs']);

    final payAmountController = TextEditingController(text: debtUzs > 0 ? debtUzs.toStringAsFixed(0) : '');
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
            left: 20,
            right: 20,
            top: 20,
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
                    child: Icon(Icons.person, color: theme.colorScheme.onPrimaryContainer, size: 28),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          c['name'] ?? '',
                          style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          c['phone'] ?? 'Telefon ko\'rsatilmagan',
                          style: GoogleFonts.outfit(color: theme.colorScheme.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Divider(height: 24),
              // Financial Info Cards
              Row(
                children: [
                  Expanded(
                    child: Card(
                      color: debtUzs > 0 ? Colors.red.withOpacity(0.1) : Colors.green.withOpacity(0.1),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Qarz (UZS)',
                              style: TextStyle(
                                fontSize: 12,
                                color: debtUzs > 0 ? Colors.red : Colors.green,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _formatCurrency(debtUzs),
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: debtUzs > 0 ? Colors.red : Colors.green,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Card(
                      color: theme.colorScheme.surfaceContainerHighest,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Jami Xaridlar', style: TextStyle(fontSize: 12)),
                            const SizedBox(height: 4),
                            Text(
                              _formatCurrency(purchases),
                              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (c['address'] != null && c['address'].toString().isNotEmpty)
                ListTile(
                  dense: true,
                  leading: const Icon(Icons.location_on_outlined),
                  title: Text(c['address']),
                  subtitle: const Text('Manzil'),
                ),
              if (c['notes'] != null && c['notes'].toString().isNotEmpty)
                ListTile(
                  dense: true,
                  leading: const Icon(Icons.note_outlined),
                  title: Text(c['notes']),
                  subtitle: const Text('Izoh'),
                ),
              const SizedBox(height: 16),
              // Debt Payment Section
              if (debtUzs > 0) ...[
                Text(
                  'Qarz To\'lovini Qabul Qilish',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: payAmountController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'To\'lov summasi',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
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
                      onChanged: (val) {
                        if (val != null) setModalState(() => payMethod = val);
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  icon: const Icon(Icons.payments_outlined),
                  label: const Text('To\'lovni Saqlash'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onPressed: () async {
                    final payAmt = payAmountController.text.trim();
                    if (payAmt.isEmpty) return;
                    try {
                      final res = await _apiService.post('/debt-payments', {
                        'customerId': c['id'],
                        'amount': payAmt,
                        'currency': 'UZS',
                        'paymentMethod': payMethod,
                        'paymentType': 'DEBT_PAYMENT',
                        'notes': 'Mobil ilovadan qarz to\'lovi',
                      });
                      if (res.statusCode == 200 || res.statusCode == 201) {
                        if (mounted) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Qarz to\'lovi qabul qilindi!')),
                          );
                          _fetchCustomers(_searchQuery);
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
        title: Text(
          'Mijozlar Ro\'yxati',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _fetchCustomers(_searchQuery),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddCustomerDialog,
        icon: const Icon(Icons.person_add),
        label: Text('Mijoz Qo\'shish', style: GoogleFonts.outfit()),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                labelText: 'Mijoz qidirish (Ism yoki telefon)...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _searchQuery = '');
                          _fetchCustomers();
                        },
                      )
                    : null,
                border: const OutlineInputBorder(),
              ),
              onChanged: (val) {
                setState(() => _searchQuery = val.trim());
                _fetchCustomers(val.trim());
              },
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _customers.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.people_outline, size: 60, color: theme.colorScheme.outline),
                            const SizedBox(height: 12),
                            Text(
                              _searchQuery.isEmpty
                                  ? 'Mijozlar topilmadi'
                                  : '"$_searchQuery" bo\'yicha mijoz topilmadi',
                              style: GoogleFonts.outfit(fontSize: 16),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () => _fetchCustomers(_searchQuery),
                        child: ListView.builder(
                          itemCount: _customers.length,
                          itemBuilder: (context, idx) {
                            final c = _customers[idx];
                            final debtUzs = _parseAmount(c['debtUzs'] ?? c['totalDebtUzs'] ?? c['debt']);
                            return Card(
                              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              child: ListTile(
                                onTap: () => _showCustomerDetail(c),
                                leading: CircleAvatar(
                                  backgroundColor: theme.colorScheme.primaryContainer,
                                  child: Icon(Icons.person, color: theme.colorScheme.onPrimaryContainer),
                                ),
                                title: Text(c['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                                subtitle: Text(c['phone'] ?? '+998 (--) --- -- --'),
                                trailing: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      'Qarz:',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: theme.colorScheme.onSurfaceVariant,
                                      ),
                                    ),
                                    Text(
                                      _formatCurrency(debtUzs),
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 13,
                                        color: debtUzs > 0 ? Colors.red : Colors.green,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
