import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../services/api_service.dart';

class ReportsView extends StatefulWidget {
  const ReportsView({super.key});

  @override
  State<ReportsView> createState() => _ReportsViewState();
}

class _ReportsViewState extends State<ReportsView> with SingleTickerProviderStateMixin {
  final _apiService = ApiService();
  late final TabController _tabController;

  // --- Asosiy (dashboard summary) ---
  bool _loadingSummary = true;
  Map<String, dynamic> _stats = {};
  List<dynamic> _topProducts = [];

  // --- Katalog ---
  bool _loadingCatalog = true;
  List<dynamic> _catalog = [];
  String _catalogSearch = '';

  // --- Tarix ---
  bool _loadingHistory = true;
  List<dynamic> _history = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchSummary();
    _fetchCatalog();
    _fetchHistory();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchSummary() async {
    setState(() => _loadingSummary = true);
    try {
      final res = await _apiService.get('/analytics/dashboard/enterprise');
      final topRes = await _apiService.get('/analytics/top/products');
      if (mounted) {
        final topRaw = topRes.data;
        setState(() {
          _stats = res.data ?? {};
          _topProducts = topRaw is Map && topRaw.containsKey('data')
              ? (topRaw['data'] is List ? topRaw['data'] : [])
              : (topRaw is List ? topRaw : []);
          _loadingSummary = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingSummary = false);
    }
  }

  Future<void> _fetchCatalog() async {
    setState(() => _loadingCatalog = true);
    try {
      final res = await _apiService.get('/reports/catalog?limit=100');
      final raw = res.data;
      if (mounted) {
        setState(() {
          _catalog = raw is Map && raw['data'] is List ? raw['data'] as List : [];
          _loadingCatalog = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingCatalog = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Katalog yuklanmadi: ${ApiService.parseError(e)}')),
        );
      }
    }
  }

  Future<void> _fetchHistory() async {
    setState(() => _loadingHistory = true);
    try {
      final res = await _apiService.get('/reports/history?limit=50');
      final raw = res.data;
      if (mounted) {
        setState(() {
          _history = raw is Map && raw['data'] is List ? raw['data'] as List : [];
          _loadingHistory = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loadingHistory = false);
    }
  }

  String _formatAmount(dynamic val) {
    if (val == null) return '0 UZS';
    double n = 0.0;
    if (val is Map) {
      n = double.tryParse(val['uzs']?.toString() ?? val['amount']?.toString() ?? '0') ?? 0.0;
    } else if (val is num) {
      n = val.toDouble();
    } else {
      n = double.tryParse(val.toString()) ?? 0.0;
    }
    final str = n.abs().toStringAsFixed(0);
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) buffer.write(' ');
      buffer.write(str[i]);
    }
    return '${n < 0 ? '-' : ''}${buffer.toString()} UZS';
  }

  String _formatDateTime(String? iso) {
    if (iso == null) return 'Hali yaratilmagan';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return iso;
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(dt.day)}.${two(dt.month)}.${dt.year} ${two(dt.hour)}:${two(dt.minute)}';
  }

  Future<void> _downloadAndShare(String jobId, String reportName, String format) async {
    try {
      final res = await _apiService.downloadBytes('/reports/jobs/$jobId/download');
      final dir = await getTemporaryDirectory();
      final ext = format.toLowerCase();
      final safeName = reportName.replaceAll(RegExp(r'\s+'), '_');
      final filePath = '${dir.path}/${safeName}_${DateTime.now().millisecondsSinceEpoch}.$ext';
      final file = File(filePath);
      await file.writeAsBytes(res.data ?? []);
      if (!mounted) return;
      await SharePlus.instance.share(ShareParams(files: [XFile(filePath)], text: reportName));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Yuklab olishda xatolik: ${ApiService.parseError(e)}')),
        );
      }
    }
  }

  void _openGenerateSheet(Map<String, dynamic> report) {
    String format = 'PDF';
    String period = 'monthly';
    DateTime dateFrom = DateTime.now().subtract(const Duration(days: 30));
    DateTime dateTo = DateTime.now();
    bool generating = false;
    int progress = 0;
    String? errorMsg;

    final reportId = (report['id'] ?? '').toString();
    final parts = reportId.split('_');
    final categoryCode = parts.isNotEmpty ? parts.first : '';
    final template = parts.length > 1 ? parts.sublist(1).join('_') : '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          Future<void> generate() async {
            setSheetState(() {
              generating = true;
              errorMsg = null;
              progress = 0;
            });
            try {
              final res = await _apiService.post('/reports/generate', {
                'template': template,
                'category': categoryCode,
                'format': format,
                'period': period,
                if (period == 'custom') 'date_from': dateFrom.toIso8601String().substring(0, 10),
                if (period == 'custom') 'date_to': dateTo.toIso8601String().substring(0, 10),
              });
              final data = res.data;
              final jobId = data is Map ? data['jobId']?.toString() : null;
              final isAsync = data is Map ? data['async'] == true : false;
              if (jobId == null) throw Exception('jobId topilmadi');

              if (!isAsync) {
                setSheetState(() => progress = 100);
                if (ctx.mounted) Navigator.pop(ctx);
                await _downloadAndShare(jobId, (report['name'] ?? 'hisobot').toString(), format);
                _fetchCatalog();
                _fetchHistory();
                return;
              }

              // Poll job status until COMPLETED/FAILED.
              while (true) {
                await Future.delayed(const Duration(milliseconds: 1500));
                final statusRes = await _apiService.get('/reports/jobs/$jobId');
                final job = statusRes.data;
                final status = job is Map ? job['status']?.toString() : null;
                if (status == 'COMPLETED') {
                  setSheetState(() => progress = 100);
                  if (ctx.mounted) Navigator.pop(ctx);
                  await _downloadAndShare(jobId, (report['name'] ?? 'hisobot').toString(), format);
                  _fetchCatalog();
                  _fetchHistory();
                  return;
                } else if (status == 'FAILED') {
                  setSheetState(() {
                    generating = false;
                    errorMsg = (job is Map ? job['errorMessage']?.toString() : null) ?? 'Hisobot yaratish muvaffaqiyatsiz yakunlandi';
                  });
                  return;
                } else {
                  final p = job is Map ? (job['progress'] as num?)?.toInt() ?? 0 : 0;
                  setSheetState(() => progress = p);
                }
              }
            } catch (e) {
              setSheetState(() {
                generating = false;
                errorMsg = ApiService.parseError(e);
              });
            }
          }

          return Padding(
            padding: EdgeInsets.only(left: 20, right: 20, top: 20, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text((report['name'] ?? '').toString(), style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text((report['description'] ?? '').toString(), style: GoogleFonts.outfit(fontSize: 13, color: Colors.grey)),
                  const SizedBox(height: 16),
                  if (errorMsg != null)
                    Container(
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                      child: Text(errorMsg!, style: const TextStyle(color: Colors.red)),
                    ),
                  DropdownButtonFormField<String>(
                    value: format,
                    decoration: const InputDecoration(labelText: 'Format', border: OutlineInputBorder(), isDense: true),
                    items: const [
                      DropdownMenuItem(value: 'PDF', child: Text('PDF hujjat')),
                      DropdownMenuItem(value: 'XLSX', child: Text('Excel jadvali')),
                      DropdownMenuItem(value: 'CSV', child: Text('CSV matnli jadval')),
                    ],
                    onChanged: generating ? null : (v) => setSheetState(() => format = v ?? 'PDF'),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: period,
                    decoration: const InputDecoration(labelText: 'Davr', border: OutlineInputBorder(), isDense: true),
                    items: const [
                      DropdownMenuItem(value: 'daily', child: Text('Bugun')),
                      DropdownMenuItem(value: 'weekly', child: Text('Shu hafta')),
                      DropdownMenuItem(value: 'monthly', child: Text('Shu oy')),
                      DropdownMenuItem(value: 'yearly', child: Text('Shu yil')),
                      DropdownMenuItem(value: 'custom', child: Text('Boshqa davr...')),
                    ],
                    onChanged: generating ? null : (v) => setSheetState(() => period = v ?? 'monthly'),
                  ),
                  if (period == 'custom') ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: generating
                                ? null
                                : () async {
                                    final picked = await showDatePicker(
                                      context: ctx, initialDate: dateFrom, firstDate: DateTime(2020), lastDate: DateTime.now(),
                                    );
                                    if (picked != null) setSheetState(() => dateFrom = picked);
                                  },
                            child: Text('Dan: ${dateFrom.toIso8601String().substring(0, 10)}'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton(
                            onPressed: generating
                                ? null
                                : () async {
                                    final picked = await showDatePicker(
                                      context: ctx, initialDate: dateTo, firstDate: DateTime(2020), lastDate: DateTime.now(),
                                    );
                                    if (picked != null) setSheetState(() => dateTo = picked);
                                  },
                            child: Text('Gacha: ${dateTo.toIso8601String().substring(0, 10)}'),
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 20),
                  if (generating)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Column(
                        children: [
                          CircularProgressIndicator(value: progress > 0 ? progress / 100 : null),
                          const SizedBox(height: 8),
                          Text('Hisobot tayyorlanmoqda: $progress%', style: GoogleFonts.outfit(fontSize: 13)),
                        ],
                      ),
                    ),
                  ElevatedButton(
                    onPressed: generating ? null : generate,
                    style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                    child: Text(generating ? 'Jarayonda...' : 'Yaratish', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSummaryTab() {
    final theme = Theme.of(context);
    return _loadingSummary
        ? const Center(child: CircularProgressIndicator())
        : RefreshIndicator(
            onRefresh: _fetchSummary,
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
                          _buildReportRow('Bugungi Sotuv', _formatAmount(_stats['todaySales']), Icons.trending_up, Colors.blue),
                          const Divider(height: 20),
                          _buildReportRow('Haftalik Sotuv', _formatAmount(_stats['weeklySales']), Icons.calendar_view_week, Colors.green),
                          const Divider(height: 20),
                          _buildReportRow('Sof Foyda', _formatAmount(_stats['netProfit']), Icons.attach_money, Colors.purple),
                          const Divider(height: 20),
                          _buildReportRow('Mijozlar Qarzdorligi', _formatAmount(_stats['customerDebt']), Icons.assignment_late, Colors.red),
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
                            child: Center(child: Text('Ma\'lumot yetarli emas', style: GoogleFonts.outfit(color: theme.colorScheme.onSurfaceVariant))),
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
                                leading: CircleAvatar(backgroundColor: theme.colorScheme.primaryContainer, child: Text('${i + 1}')),
                                title: Text(p['name'] ?? p['productName'] ?? 'Mahsulot', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                                subtitle: Text('${p['totalQuantity'] ?? p['quantity'] ?? 0} dona sotilgan'),
                                trailing: Text(_formatAmount(p['totalRevenue'] ?? p['revenue']), style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: theme.colorScheme.primary)),
                              ),
                            );
                          },
                        ),
                ],
              ),
            ),
          );
  }

  Widget _buildCatalogTab() {
    final theme = Theme.of(context);
    final filtered = _catalogSearch.isEmpty
        ? _catalog
        : _catalog.where((r) {
            final name = (r['name'] ?? '').toString().toLowerCase();
            final cat = (r['category'] ?? '').toString().toLowerCase();
            return name.contains(_catalogSearch.toLowerCase()) || cat.contains(_catalogSearch.toLowerCase());
          }).toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            decoration: InputDecoration(
              hintText: 'Hisobot qidirish...',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              isDense: true,
            ),
            onChanged: (v) => setState(() => _catalogSearch = v),
          ),
        ),
        Expanded(
          child: _loadingCatalog
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: _fetchCatalog,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: filtered.length,
                    itemBuilder: (ctx, i) {
                      final r = filtered[i] as Map<String, dynamic>;
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: theme.colorScheme.primaryContainer,
                            child: const Icon(Icons.description_outlined),
                          ),
                          title: Text((r['name'] ?? '').toString(), style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text((r['description'] ?? '').toString(), style: GoogleFonts.outfit(fontSize: 12)),
                              Text(
                                'Oxirgi: ${_formatDateTime(r['lastGenerated'] as String?)}',
                                style: GoogleFonts.outfit(fontSize: 11, color: theme.colorScheme.onSurfaceVariant),
                              ),
                            ],
                          ),
                          isThreeLine: true,
                          trailing: ElevatedButton(
                            onPressed: () => _openGenerateSheet(r),
                            child: const Text('Yaratish'),
                          ),
                        ),
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildHistoryTab() {
    final theme = Theme.of(context);
    return _loadingHistory
        ? const Center(child: CircularProgressIndicator())
        : RefreshIndicator(
            onRefresh: _fetchHistory,
            child: _history.isEmpty
                ? ListView(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(32),
                        child: Center(child: Text('Hali hisobot yaratilmagan', style: GoogleFonts.outfit(color: theme.colorScheme.onSurfaceVariant))),
                      ),
                    ],
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _history.length,
                    itemBuilder: (ctx, i) {
                      final h = _history[i] as Map<String, dynamic>;
                      final status = (h['status'] ?? '').toString();
                      final isCompleted = status == 'COMPLETED';
                      final isFailed = status == 'FAILED';
                      final color = isCompleted ? Colors.green : (isFailed ? Colors.red : Colors.orange);
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: color.withValues(alpha: 0.15),
                            child: Icon(isCompleted ? Icons.check : (isFailed ? Icons.close : Icons.hourglass_top), color: color, size: 20),
                          ),
                          title: Text((h['reportName'] ?? '').toString(), style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
                          subtitle: Text(
                            '${h['format'] ?? ''} · ${_formatDateTime(h['createdAt'] as String?)}',
                            style: GoogleFonts.outfit(fontSize: 12),
                          ),
                          trailing: isCompleted
                              ? IconButton(
                                  icon: const Icon(Icons.download_outlined),
                                  onPressed: () => _downloadAndShare((h['id'] ?? '').toString(), (h['reportName'] ?? 'hisobot').toString(), (h['format'] ?? 'PDF').toString()),
                                )
                              : null,
                        ),
                      );
                    },
                  ),
          );
  }

  Widget _buildReportRow(String label, String value, IconData icon, Color color) {
    return Row(
      children: [
        CircleAvatar(backgroundColor: color.withValues(alpha: 0.15), radius: 18, child: Icon(icon, color: color, size: 20)),
        const SizedBox(width: 12),
        Expanded(child: Text(label, style: GoogleFonts.outfit(fontSize: 14))),
        Text(value, style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold)),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Moliya va Hisobotlar', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [Tab(text: 'Asosiy'), Tab(text: 'Hisobot katalogi'), Tab(text: 'Tarix')],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [_buildSummaryTab(), _buildCatalogTab(), _buildHistoryTab()],
      ),
    );
  }
}
