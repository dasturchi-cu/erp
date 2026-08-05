import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'supplier_detail_view.dart';
import 'supplier_form_view.dart';

class SuppliersView extends StatefulWidget {
  const SuppliersView({super.key});

  @override
  State<SuppliersView> createState() => _SuppliersViewState();
}

class _SuppliersViewState extends State<SuppliersView> {
  final _apiService = ApiService();
  bool _loading = true;
  List<dynamic> _suppliers = [];
  String _query = '';

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _loading = true);
    try {
      final res = await _apiService.get('/suppliers?q=$_query');
      setState(() {
        _suppliers = res.data['data'] ?? [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _openSupplier(String id) async {
    await Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => SupplierDetailView(supplierId: id)),
    );
    _fetch();
  }

  Future<void> _addSupplier() async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => const SupplierFormView()),
    );
    if (created == true) _fetch();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Yetkazib beruvchilar', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _addSupplier,
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: TextField(
              decoration: const InputDecoration(
                labelText: 'Nomi yoki telefon bo\'yicha qidirish',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (v) {
                _query = v;
                _fetch();
              },
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _suppliers.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.local_shipping_outlined, size: 60, color: theme.colorScheme.outline),
                            const SizedBox(height: 12),
                            const Text('Yetkazib beruvchilar topilmadi'),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _fetch,
                        child: ListView.builder(
                          itemCount: _suppliers.length,
                          itemBuilder: (context, idx) {
                            final s = _suppliers[idx];
                            final debt = double.parse(s['remainingDebtUzs']?.toString() ?? '0.0');
                            return Card(
                              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              child: ListTile(
                                onTap: () => _openSupplier(s['id']),
                                leading: CircleAvatar(
                                  backgroundColor: theme.colorScheme.secondaryContainer,
                                  child: const Icon(Icons.local_shipping_outlined),
                                ),
                                title: Text(s['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                                subtitle: Text(s['phone'] ?? ''),
                                trailing: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    const Text('Qarz:', style: TextStyle(fontSize: 12)),
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
          ),
        ],
      ),
    );
  }
}
