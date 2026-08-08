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

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get('/suppliers?limit=50');
      final sumRes = await _api.get('/suppliers/summary');
      if (mounted) {
        setState(() {
          _suppliers = res.data['data'] ?? res.data ?? [];
          _summary = sumRes.data ?? {};
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Ta\'minotchilar', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: Column(
                children: [
                  // Summary cards
                  Container(
                    padding: const EdgeInsets.all(16),
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
                              final debt = (s['balance'] ?? s['totalDebt'] ?? 0.0) as num;
                              return Card(
                                margin: const EdgeInsets.only(bottom: 10),
                                child: ListTile(
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
                                  trailing: debt != 0
                                      ? Chip(
                                          label: Text(
                                            '${debt < 0 ? '+' : '-'}${_formatAmount(debt.abs())}',
                                            style: const TextStyle(fontSize: 12, color: Colors.white),
                                          ),
                                          backgroundColor: debt < 0 ? Colors.green : Colors.red,
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
    final n = (val as num).toDouble();
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(0)}K';
    return n.toStringAsFixed(0);
  }
}
