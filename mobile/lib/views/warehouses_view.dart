import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/search_picker.dart';

class WarehousesView extends StatefulWidget {
  const WarehousesView({super.key});

  @override
  State<WarehousesView> createState() => _WarehousesViewState();
}

class _WarehousesViewState extends State<WarehousesView> {
  final _apiService = ApiService();
  bool _loading = true;
  List<dynamic> _warehouses = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _apiService.get('/warehouses');
      setState(() {
        _warehouses = res.data['data'] ?? [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _createWarehouse() async {
    final nameCtrl = TextEditingController();
    final addressCtrl = TextEditingController();
    Map<String, dynamic>? branch;

    final created = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Yangi ombor'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(labelText: 'Ombor nomi'),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: () async {
                    final selected = await showSearchPicker(
                      context: context,
                      title: 'Filial tanlash',
                      endpoint: '/branches',
                      titleBuilder: (b) => b['name'] ?? '',
                    );
                    if (selected != null) setDialogState(() => branch = selected);
                  },
                  icon: const Icon(Icons.store_outlined),
                  label: Text(branch?['name'] ?? 'Filial tanlash'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: addressCtrl,
                  decoration: const InputDecoration(labelText: 'Manzil (ixtiyoriy)'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Bekor qilish')),
            FilledButton(
              onPressed: () async {
                if (nameCtrl.text.trim().isEmpty || branch == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Nomi va filialni kiriting')),
                  );
                  return;
                }
                try {
                  await _apiService.post('/warehouses', {
                    'name': nameCtrl.text.trim(),
                    'branchId': branch!['id'],
                    if (addressCtrl.text.trim().isNotEmpty) 'address': addressCtrl.text.trim(),
                  });
                  if (ctx.mounted) Navigator.of(ctx).pop(true);
                } catch (e) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      SnackBar(content: Text('Xatolik: ${e.toString()}')),
                    );
                  }
                }
              },
              child: const Text('Saqlash'),
            ),
          ],
        ),
      ),
    );

    if (created == true) {
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ombor yaratildi')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Omborlar', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _createWarehouse,
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _warehouses.isEmpty
              ? const Center(child: Text('Omborlar mavjud emas'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    itemCount: _warehouses.length,
                    itemBuilder: (context, idx) {
                      final w = _warehouses[idx];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        child: ListTile(
                          leading: Icon(Icons.warehouse, color: theme.colorScheme.primary),
                          title: Text(w['name'] ?? ''),
                          subtitle: Text('${w['branchName'] ?? ''} • Mahsulotlar: ${w['productCount'] ?? 0}'),
                          trailing: Text(
                            '${w['totalValueUzs'] ?? 0} UZS',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
