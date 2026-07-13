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

  @override
  void initState() {
    super.initState();
    _fetchCustomers();
  }

  Future<void> _fetchCustomers() async {
    setState(() => _loading = true);
    try {
      final res = await _apiService.get('/customers');
      if (res.statusCode == 200) {
        setState(() {
          _customers = res.data['data'] ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      setState(() => _loading = false);
    }
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
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _customers.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.people_outline, size: 60, color: theme.colorScheme.outline),
                      const SizedBox(height: 12),
                      const Text('Mijozlar topilmadi'),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchCustomers,
                  child: ListView.builder(
                    itemCount: _customers.length,
                    itemBuilder: (context, idx) {
                      final c = _customers[idx];
                      final debt = double.parse(c['totalDebtUzs']?.toString() ?? '0.0');
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: theme.colorScheme.primaryContainer,
                            child: const Icon(Icons.person),
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
                                  fontSize: 12,
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                              Text(
                                '$debt UZS',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: debt > 0 ? Colors.red : Colors.green,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
