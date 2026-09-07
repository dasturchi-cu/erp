import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class DebtAgingView extends StatefulWidget {
  const DebtAgingView({super.key});

  @override
  State<DebtAgingView> createState() => _DebtAgingViewState();
}

class _DebtAgingViewState extends State<DebtAgingView> with SingleTickerProviderStateMixin {
  final _api = ApiService();
  late final TabController _tabController;
  bool _loading = true;
  Map<String, dynamic>? _summary;
  List<dynamic> _customerRows = [];
  List<dynamic> _supplierRows = [];
  String? _selectedBucket;

  static const List<String> _buckets = ['0-30', '31-60', '61-90', '91-120', '120+'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        _api.get('/debt/aging/summary'),
        _api.get('/debt/aging/customers?limit=100${_selectedBucket != null ? '&bucket=$_selectedBucket' : ''}'),
        _api.get('/debt/aging/suppliers?limit=100${_selectedBucket != null ? '&bucket=$_selectedBucket' : ''}'),
      ]);
      if (mounted) {
        setState(() {
          _summary = results[0].data is Map ? results[0].data as Map<String, dynamic> : null;
          final custRaw = results[1].data;
          _customerRows = custRaw is Map && custRaw['data'] is List ? custRaw['data'] as List : [];
          final supRaw = results[2].data;
          _supplierRows = supRaw is Map && supRaw['data'] is List ? supRaw['data'] as List : [];
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Yuklanmadi: ${ApiService.parseError(e)}')),
        );
      }
    }
  }

  String _formatMoney(dynamic val) {
    final n = (val is num) ? val.toDouble() : (double.tryParse(val?.toString() ?? '0') ?? 0.0);
    final str = n.abs().toStringAsFixed(0);
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) buffer.write(' ');
      buffer.write(str[i]);
    }
    return buffer.toString();
  }

  Widget _bucketChips() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          ChoiceChip(
            label: const Text('Barchasi'),
            selected: _selectedBucket == null,
            onSelected: (_) {
              setState(() => _selectedBucket = null);
              _load();
            },
          ),
          const SizedBox(width: 6),
          ..._buckets.map((b) => Padding(
                padding: const EdgeInsets.only(right: 6),
                child: ChoiceChip(
                  label: Text('$b kun'),
                  selected: _selectedBucket == b,
                  onSelected: (_) {
                    setState(() => _selectedBucket = b);
                    _load();
                  },
                ),
              )),
        ],
      ),
    );
  }

  Widget _summaryCard(String title, Map<String, dynamic>? data, {bool showUsd = false}) {
    final theme = Theme.of(context);
    if (data == null) return const SizedBox.shrink();
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 8),
            Text(
              '${_formatMoney(data['totalDebtUzs'])} UZS',
              style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: theme.colorScheme.primary),
            ),
            if (showUsd && data['totalDebtUsd'] != null)
              Text('\$${_formatMoney(data['totalDebtUsd'])}', style: GoogleFonts.outfit(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
            Text('${data['entityCount'] ?? 0} ta', style: GoogleFonts.outfit(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
          ],
        ),
      ),
    );
  }

  Widget _rowsList(List<dynamic> rows) {
    final theme = Theme.of(context);
    if (rows.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Text('Ma\'lumot topilmadi', style: GoogleFonts.outfit(color: theme.colorScheme.onSurfaceVariant)),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: rows.length,
      itemBuilder: (ctx, i) {
        final r = rows[i] as Map<String, dynamic>;
        final bucket = (r['bucket'] ?? '').toString();
        final isOld = bucket == '91-120' || bucket == '120+';
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: (isOld ? Colors.red : Colors.orange).withValues(alpha: 0.15),
              child: Text('${r['ageDays'] ?? 0}', style: TextStyle(color: isOld ? Colors.red : Colors.orange, fontWeight: FontWeight.bold, fontSize: 12)),
            ),
            title: Text((r['name'] ?? '').toString(), style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
            subtitle: Text('${r['phone'] ?? ''} · $bucket kun', style: GoogleFonts.outfit(fontSize: 12)),
            trailing: Text(
              '${_formatMoney(r['debtUzs'])} UZS',
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: theme.colorScheme.primary),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Qarz Muddati Tahlili', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [Tab(text: 'Mijozlar'), Tab(text: 'Ta\'minotchilar')],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: TabBarView(
                controller: _tabController,
                children: [
                  Column(
                    children: [
                      _summaryCard('Mijozlar qarzi', _summary?['customers'] as Map<String, dynamic>?, showUsd: true),
                      _bucketChips(),
                      Expanded(child: _rowsList(_customerRows)),
                    ],
                  ),
                  Column(
                    children: [
                      _summaryCard('Ta\'minotchilarga qarz', _summary?['suppliers'] as Map<String, dynamic>?),
                      _bucketChips(),
                      Expanded(child: _rowsList(_supplierRows)),
                    ],
                  ),
                ],
              ),
            ),
    );
  }
}
