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
        final raw = res.data;
        setState(() {
          _sales = raw is Map && raw.containsKey('data') ? (raw['data'] is List ? raw['data'] : []) : (raw is List ? raw : []);
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
      case 'PARTIALLY_RETURNED': return Colors.amber;
      case 'RETURNED': return Colors.purple;
      default: return Colors.blue;
    }
  }

  String _statusLabel(String? status) {
    switch (status) {
      case 'COMPLETED': return 'Yakunlangan';
      case 'PENDING': return 'Kutilmoqda';
      case 'VOIDED': return 'Bekor qilingan';
      case 'PARTIALLY_RETURNED': return 'Qisman qaytarilgan';
      case 'RETURNED': return 'Qaytarilgan';
      default: return status ?? 'Yakunlangan';
    }
  }

  String _paymentLabel(String? method) {
    switch (method) {
      case 'CASH': return 'Naqd';
      case 'CARD': return 'Karta';
      case 'TRANSFER': return 'O\'tkazma';
      case 'BANK_TRANSFER': return 'O\'tkazma';
      case 'MIXED': return 'Aralash';
      case 'CREDIT': return 'Nasiya (Qarz)';
      case 'DEBT': return 'Nasiya (Qarz)';
      default: return method ?? 'Naqd';
    }
  }

  String _formatNumber(dynamic val) {
    if (val == null) return '0';
    final n = (val is num) ? val.toDouble() : (double.tryParse(val.toString()) ?? 0.0);
    final str = n.abs().toStringAsFixed(0);
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) {
        buffer.write(' ');
      }
      buffer.write(str[i]);
    }
    return '${n < 0 ? '-' : ''}${buffer.toString()}';
  }

  void _showSaleDetails(Map<String, dynamic> sale) {
    final theme = Theme.of(context);
    final items = sale['lineItems'] is List
        ? (sale['lineItems'] as List)
        : (sale['items'] is List ? (sale['items'] as List) : []);
    final customerName = sale['customerName'] ?? sale['customer']?['name'];
    final rawTotal = sale['totalUzs'] ?? sale['totalAmount'] ?? sale['total'] ?? 0;
    final total = (rawTotal is num) ? rawTotal.toDouble() : (double.tryParse(rawTotal.toString()) ?? 0.0);
    final dateStr = sale['createdAt'] != null ? DateTime.tryParse(sale['createdAt'].toString()) : null;
    final saleNumber = sale['number'] ?? sale['saleNumber'] ?? sale['id']?.toString().substring(0, 8);
    final paymentType = sale['paymentType'] ?? sale['paymentMethod'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20, right: 20, top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Chek #$saleNumber', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                  Chip(
                    label: Text(_statusLabel(sale['status'] as String?)),
                    backgroundColor: _statusColor(sale['status'] as String?).withValues(alpha: 0.15),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              if (customerName != null && customerName.toString().isNotEmpty)
                Text('Mijoz: $customerName', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w600)),
              Text('To\'lov turi: ${_paymentLabel(paymentType as String?)}', style: GoogleFonts.outfit(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
              if (dateStr != null)
                Text('Sana: ${dateStr.toString().split('.')[0]}', style: GoogleFonts.outfit(fontSize: 13, color: theme.colorScheme.onSurfaceVariant)),
              const Divider(height: 24),
              Text('Xarid qilingan tovarlar:', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              if (items.isEmpty)
                Text('Tovarlar ro\'yxati yo\'q', style: GoogleFonts.outfit(color: theme.colorScheme.onSurfaceVariant))
              else
                ...items.map((it) {
                  final name = it['productName'] ?? it['product']?['name'] ?? 'Mahsulot';
                  final rawQty = it['quantity'] ?? 1;
                  final qty = (rawQty is num) ? rawQty.toDouble() : (double.tryParse(rawQty.toString()) ?? 1.0);
                  final rawPrice = it['unitPriceUzs'] ?? it['price'] ?? 0;
                  final price = (rawPrice is num) ? rawPrice.toDouble() : (double.tryParse(rawPrice.toString()) ?? 0.0);
                  final rawItemTotal = it['totalUzs'];
                  final itemTotal = rawItemTotal != null
                      ? ((rawItemTotal is num) ? rawItemTotal.toDouble() : (double.tryParse(rawItemTotal.toString()) ?? (price * qty)))
                      : (price * qty);

                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(child: Text('$name (x${qty.toStringAsFixed(qty % 1 == 0 ? 0 : 2)})', style: GoogleFonts.outfit())),
                        Text('${_formatNumber(itemTotal)} UZS', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
                      ],
                    ),
                  );
                }),
              const Divider(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('JAMI SUMMA:', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
                  Text(
                    '${_formatNumber(total)} UZS',
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: theme.colorScheme.primary),
                  ),
                ],
              ),
              const SizedBox(height: 16),
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
                        final rawTotal = sale['totalUzs'] ?? sale['totalAmount'] ?? sale['total'] ?? 0;
                        final total = (rawTotal is num) ? rawTotal.toDouble() : (double.tryParse(rawTotal.toString()) ?? 0.0);
                        final status = sale['status'] as String?;
                        final payMethod = sale['paymentType'] ?? sale['paymentMethod'] as String?;
                        final items = sale['lineItems'] is List
                            ? (sale['lineItems'] as List)
                            : (sale['items'] is List ? (sale['items'] as List) : []);
                        final itemCount = items.isNotEmpty ? items.length : (sale['itemCount'] ?? 0);
                        final date = sale['createdAt'] != null
                            ? DateTime.tryParse(sale['createdAt'].toString())
                            : null;
                        return Card(
                          margin: const EdgeInsets.only(bottom: 10),
                          child: InkWell(
                            onTap: () => _showSaleDetails(sale),
                            borderRadius: BorderRadius.circular(12),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: _statusColor(status).withValues(alpha: 0.15),
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
                                              '${_formatNumber(total)} UZS',
                                              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                                            ),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: _statusColor(status).withValues(alpha: 0.15),
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
                                                '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}',
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
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
