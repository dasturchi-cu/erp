import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class ReportsView extends StatefulWidget {
  const ReportsView({super.key});

  @override
  State<ReportsView> createState() => _ReportsViewState();
}

class _ReportsViewState extends State<ReportsView> {
  final _apiService = ApiService();
  bool _loading = true;
  Map<String, dynamic> _stats = {};
  List<dynamic> _topProducts = [];

  @override
  void initState() {
    super.initState();
    _fetchReports();
  }

  Future<void> _fetchReports() async {
    setState(() => _loading = true);
    try {
      final res = await _apiService.get('/analytics/dashboard/enterprise');
      final topRes = await _apiService.get('/analytics/top/products');
      if (mounted) {
        setState(() {
          _stats = res.data ?? {};
          _topProducts = topRes.data is List ? topRes.data : (topRes.data['data'] ?? []);
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _formatAmount(dynamic val) {
    if (val == null) return '0 UZS';
    final n = (val is num) ? val.toDouble() : (double.tryParse(val.toString()) ?? 0.0);
    final str = n.abs().toStringAsFixed(0);
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) {
        buffer.write(' ');
      }
      buffer.write(str[i]);
    }
    return '${n < 0 ? '-' : ''}${buffer.toString()} UZS';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Moliya va Hisobotlar',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchReports,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchReports,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Asosiy Ko\'rsatkichlar', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            _buildReportRow(
                              'Bugungi Sotuv',
                              _formatAmount(_stats['todaySales']),
                              Icons.trending_up,
                              Colors.blue,
                            ),
                            const Divider(height: 20),
                            _buildReportRow(
                              'Haftalik Sotuv',
                              _formatAmount(_stats['weeklySales']),
                              Icons.calendar_view_week,
                              Colors.green,
                            ),
                            const Divider(height: 20),
                            _buildReportRow(
                              'Sof Foyda',
                              _formatAmount(_stats['netProfit']),
                              Icons.attach_money,
                              Colors.purple,
                            ),
                            const Divider(height: 20),
                            _buildReportRow(
                              'Mijozlar Qarzdorligi',
                              _formatAmount(_stats['customerDebt']),
                              Icons.assignment_late,
                              Colors.red,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text('Eng Ko\'p Sotilgan Mahsulotlar', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    _topProducts.isEmpty
                        ? Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Center(
                                child: Text('Ma\'lumot yetarli emas', style: GoogleFonts.outfit(color: theme.colorScheme.onSurfaceVariant)),
                              ),
                            ),
                          )
                        : ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _topProducts.length,
                            itemBuilder: (ctx, i) {
                              final p = _topProducts[i];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: theme.colorScheme.primaryContainer,
                                    child: Text('${i + 1}'),
                                  ),
                                  title: Text(p['name'] ?? p['productName'] ?? 'Mahsulot', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                                  subtitle: Text('${p['totalQuantity'] ?? p['quantity'] ?? 0} dona sotilgan'),
                                  trailing: Text(
                                    _formatAmount(p['totalRevenue'] ?? p['revenue']),
                                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: theme.colorScheme.primary),
                                  ),
                                ),
                              );
                            },
                          ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildReportRow(String label, String value, IconData icon, Color color) {
    return Row(
      children: [
        CircleAvatar(
          backgroundColor: color.withOpacity(0.15),
          radius: 18,
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(label, style: GoogleFonts.outfit(fontSize: 14)),
        ),
        Text(
          value,
          style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}
