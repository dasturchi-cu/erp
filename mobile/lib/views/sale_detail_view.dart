import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'return_form_view.dart';

class SaleDetailView extends StatefulWidget {
  final String saleId;

  const SaleDetailView({super.key, required this.saleId});

  @override
  State<SaleDetailView> createState() => _SaleDetailViewState();
}

class _SaleDetailViewState extends State<SaleDetailView> {
  final _apiService = ApiService();
  bool _loading = true;
  Map<String, dynamic>? _sale;
  bool _voiding = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _apiService.get('/sales/${widget.saleId}');
      setState(() {
        _sale = res.data;
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _voidSale() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sotuvni bekor qilish'),
        content: const Text('Ushbu sotuv bekor qilinsinmi? Bu amalni ortga qaytarib bo\'lmaydi.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Yo\'q')),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Ha, bekor qilish', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _voiding = true);
    try {
      await _apiService.postIdempotent('/sales/${widget.saleId}/void', {});
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Sotuv bekor qilindi')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xatolik: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _voiding = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final sale = _sale;
    final canModify = sale != null && sale['status'] == 'COMPLETED';

    return Scaffold(
      appBar: AppBar(
        title: Text('Sotuv tafsiloti', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
        actions: [
          if (canModify)
            PopupMenuButton<String>(
              onSelected: (v) {
                if (v == 'void') _voidSale();
                if (v == 'return') {
                  Navigator.of(context)
                      .push(MaterialPageRoute(builder: (_) => ReturnFormView(sale: sale)))
                      .then((_) => _load());
                }
              },
              itemBuilder: (ctx) => [
                const PopupMenuItem(value: 'return', child: Text('Qaytarish yaratish')),
                const PopupMenuItem(value: 'void', child: Text('Sotuvni bekor qilish')),
              ],
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : sale == null
              ? const Center(child: Text('Sotuv topilmadi'))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('№ ${sale['number'] ?? sale['id']}',
                                style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 16)),
                            const SizedBox(height: 8),
                            Text('Mijoz: ${sale['customerName'] ?? 'Mijozsiz'}'),
                            Text('Kassir: ${sale['cashierName'] ?? '-'}'),
                            Text('Holat: ${sale['status'] ?? '-'}'),
                            Text('Sana: ${sale['createdAt'] ?? ''}'),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text('Mahsulotlar', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 16)),
                    const SizedBox(height: 8),
                    ...(sale['lineItems'] as List<dynamic>? ?? []).map((li) => Card(
                          margin: const EdgeInsets.only(bottom: 6),
                          child: ListTile(
                            title: Text(li['productName'] ?? ''),
                            subtitle: Text('${li['quantity']} x ${li['unitPriceUzs']} UZS'),
                            trailing: Text('${li['totalUzs']} UZS', style: const TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        )),
                    const SizedBox(height: 16),
                    Card(
                      color: theme.colorScheme.primaryContainer,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Jami', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
                            Text('${sale['totalUzs'] ?? 0} UZS',
                                style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18)),
                          ],
                        ),
                      ),
                    ),
                    if (_voiding) const Padding(
                      padding: EdgeInsets.only(top: 16),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                  ],
                ),
    );
  }
}
