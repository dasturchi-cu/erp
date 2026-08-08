import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class SalesHistoryView extends StatefulWidget {
  const SalesHistoryView({super.key});

  @override
  State<SalesHistoryView> createState() => _SalesHistoryViewState();
}

class _SalesHistoryViewState extends State<SalesHistoryView> {
  final _api = ApiService();
  bool _loading = true;
  List<dynamic> _sales = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get('/sales?limit=50&sortBy=createdAt&sortOrder=desc');
      if (mounted) {
        setState(() {
          final data = res.data;
          _sales = data['data'] ?? data ?? [];
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'COMPLETED': return Colors.green;
      case 'PENDING': return Colors.orange;
      case 'VOIDED': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _statusLabel(String? status) {
    switch (status) {
      case 'COMPLETED': return 'Yakunlangan';
      case 'PENDING': return 'Kutilmoqda';
      case 'VOIDED': return 'Bekor qilingan';
      default: return status ?? '';
    }
  }

  String _paymentLabel(String? method) {
    switch (method) {
      case 'CASH': return 'Naqd';
      case 'CARD': return 'Karta';
      case 'TRANSFER': return 'Transfer';
      case 'MIXED': return 'Aralash';
      case 'DEBT': return 'Nasiya';
      default: return method ?? '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Sotuvlar Tarixi', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _sales.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.receipt_outlined, size: 64, color: theme.colorScheme.outline),
                          const SizedBox(height: 12),
                          Text('Sotuvlar topilmadi', style: GoogleFonts.outfit(fontSize: 16)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _sales.length,
                      itemBuilder: (ctx, i) {
                        final sale = _sales[i];
                        final total = (sale['totalAmount'] ?? sale['total'] ?? 0.0) as num;
                        final status = sale['status'] as String?;
                        final payMethod = sale['paymentMethod'] as String?;
                        final itemCount = (sale['items'] as List?)?.length ?? sale['itemCount'] ?? 0;
                        final date = sale['createdAt'] != null
                            ? DateTime.tryParse(sale['createdAt'])
                            : null;
                        return Card(
                          margin: const EdgeInsets.only(bottom: 10),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: _statusColor(status).withOpacity(0.15),
                                  child: Icon(Icons.receipt_outlined, color: _statusColor(status)),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            '${total.toStringAsFixed(0)} so\'m',
                                            style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: _statusColor(status).withOpacity(0.15),
                                              borderRadius: BorderRadius.circular(10),
                                            ),
                                            child: Text(
                                              _statusLabel(status),
                                              style: TextStyle(color: _statusColor(status), fontSize: 11, fontWeight: FontWeight.w600),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          Icon(Icons.shopping_cart_outlined, size: 14, color: theme.colorScheme.onSurfaceVariant),
                                          const SizedBox(width: 4),
                                          Text('$itemCount ta mahsulot', style: GoogleFonts.outfit(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                                          const SizedBox(width: 12),
                                          Icon(Icons.payment_outlined, size: 14, color: theme.colorScheme.onSurfaceVariant),
                                          const SizedBox(width: 4),
                                          Text(_paymentLabel(payMethod), style: GoogleFonts.outfit(fontSize: 12, color: theme.colorScheme.onSurfaceVariant)),
                                          if (date != null) ...[
                                            const Spacer(),
                                            Text(
                                              '${date.hour.toString().padLeft(2,'0')}:${date.minute.toString().padLeft(2,'0')}',
                                              style: GoogleFonts.outfit(fontSize: 12, color: theme.colorScheme.onSurfaceVariant),
                                            ),
                                          ]
                                        ],
                                      ),
                                    ],
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
