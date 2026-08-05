import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'sale_detail_view.dart';

class SalesHistoryView extends StatefulWidget {
  const SalesHistoryView({super.key});

  @override
  State<SalesHistoryView> createState() => _SalesHistoryViewState();
}

class _SalesHistoryViewState extends State<SalesHistoryView> {
  final _apiService = ApiService();
  bool _loading = true;
  List<dynamic> _sales = [];
  String _query = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _apiService.get('/sales?q=$_query&pageSize=50&sort=-createdAt');
      setState(() {
        _sales = res.data['data'] ?? [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'COMPLETED':
        return Colors.green;
      case 'CANCELLED':
        return Colors.red;
      case 'PARTIALLY_RETURNED':
      case 'RETURNED':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  String _statusLabel(String? status) {
    switch (status) {
      case 'COMPLETED':
        return 'Yakunlangan';
      case 'CANCELLED':
        return 'Bekor qilingan';
      case 'PARTIALLY_RETURNED':
        return 'Qisman qaytarilgan';
      case 'RETURNED':
        return 'Qaytarilgan';
      default:
        return status ?? '-';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Sotuvlar tarixi', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: TextField(
              decoration: const InputDecoration(
                labelText: 'Sotuv raqami yoki mijoz bo\'yicha qidirish',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (v) {
                _query = v;
                _load();
              },
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _sales.isEmpty
                    ? const Center(child: Text('Sotuvlar topilmadi'))
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          itemCount: _sales.length,
                          itemBuilder: (context, idx) {
                            final s = _sales[idx];
                            return Card(
                              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: _statusColor(s['status']).withOpacity(0.15),
                                  child: Icon(Icons.receipt_long, color: _statusColor(s['status'])),
                                ),
                                title: Text('№ ${s['number'] ?? s['id']}'),
                                subtitle: Text('${s['customerName'] ?? 'Mijozsiz'} • ${_statusLabel(s['status'])}'),
                                trailing: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      '${s['totalUzs']} UZS',
                                      style: TextStyle(
                                        color: theme.colorScheme.primary,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                                onTap: () async {
                                  await Navigator.of(context).push(
                                    MaterialPageRoute(builder: (_) => SaleDetailView(saleId: s['id'])),
                                  );
                                  _load();
                                },
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
