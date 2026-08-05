import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class ReceiptView extends StatelessWidget {
  final Map<String, dynamic> sale;

  const ReceiptView({super.key, required this.sale});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final lineItems = (sale['lineItems'] as List<dynamic>? ?? []);

    return Scaffold(
      appBar: AppBar(
        title: Text('Chek', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Center(
            child: Column(
              children: [
                Icon(Icons.check_circle, color: Colors.green, size: 64),
                const SizedBox(height: 12),
                Text(
                  'Sotuv muvaffaqiyatli yakunlandi',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text('№ ${sale['number'] ?? sale['id'] ?? ''}', style: theme.textTheme.bodyMedium),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (sale['customerName'] != null)
                    _row('Mijoz', sale['customerName']),
                  _row('Kassir', sale['cashierName'] ?? '-'),
                  _row('To\'lov turi', _paymentLabel(sale['paymentType'])),
                  _row('Sana', sale['createdAt'] ?? ''),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text('Mahsulotlar', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 16)),
          const SizedBox(height: 8),
          ...lineItems.map((li) => Card(
                margin: const EdgeInsets.only(bottom: 6),
                child: ListTile(
                  title: Text(li['productName'] ?? ''),
                  subtitle: Text('${li['quantity']} x ${li['unitPriceUzs']} UZS'),
                  trailing: Text(
                    '${li['totalUzs']} UZS',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
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
                  Text('Jami', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 16)),
                  Text(
                    '${sale['totalUzs'] ?? 0} UZS',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Yopish'),
          ),
        ],
      ),
    );
  }

  String _paymentLabel(String? type) {
    switch (type) {
      case 'CASH':
        return 'Naqd';
      case 'CREDIT':
        return 'Nasiya';
      case 'MIXED':
        return 'Aralash';
      default:
        return type ?? '-';
    }
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Flexible(child: Text(value, textAlign: TextAlign.end)),
        ],
      ),
    );
  }
}
