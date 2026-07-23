import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class InventoryView extends StatefulWidget {
  const InventoryView({super.key});

  @override
  State<InventoryView> createState() => _InventoryViewState();
}

class _InventoryViewState extends State<InventoryView> {
  final _apiService = ApiService();
  bool _loading = true;
  List<dynamic> _batches = [];

  @override
  void initState() {
    super.initState();
    _fetchInventory();
  }

  Future<void> _fetchInventory() async {
    setState(() => _loading = true);
    try {
      final res = await _apiService.get('/inventory/batches');
      if (res.statusCode == 200) {
        setState(() {
          _batches = res.data['data'] ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Ombor va Partiyalar',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _batches.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.warehouse_outlined, size: 60, color: theme.colorScheme.outline),
                      const SizedBox(height: 12),
                      const Text('Omborda mahsulot partiyalari mavjud emas'),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchInventory,
                  child: ListView.builder(
                    itemCount: _batches.length,
                    itemBuilder: (context, idx) {
                      final b = _batches[idx];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        child: ListTile(
                          leading: Icon(Icons.layers, color: theme.colorScheme.secondary),
                          title: Text(b['productName'] ?? b['product']?['name'] ?? 'Mahsulot nomi noma\'lum'),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Partiya #: ${b['batchNumber'] ?? 'Noma\'lum'}'),
                              Text('Ombor: ${b['warehouseName'] ?? b['warehouse']?['name'] ?? 'Asosiy Ombor'}'),
                            ],
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '${b['remainingQty']} dona',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                              if (b['expiresAt'] != null)
                                Text(
                                  'Muddati: ${b['expiresAt'].toString().split('T')[0]}',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: theme.colorScheme.error,
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
