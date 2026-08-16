import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'inventory_receive_view.dart';
import 'inventory_adjust_view.dart';

class InventoryView extends StatefulWidget {
  const InventoryView({super.key});

  @override
  State<InventoryView> createState() => _InventoryViewState();
}

class _InventoryViewState extends State<InventoryView> {
  final _apiService = ApiService();
  bool _loading = true;

  List<dynamic> _batches = [];
  List<dynamic> _warehouses = [];
  List<dynamic> _branches = [];

  final _warehouseNameCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _warehouseNameCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final bRes = await _apiService.get('/inventory/batches?limit=100');
      final wRes = await _apiService.get('/warehouses');
      final brRes = await _apiService.get('/branches');

      if (mounted) {
        final rawB = bRes.data;
        final rawW = wRes.data;
        final rawBr = brRes.data;

        setState(() {
          _batches = rawB is Map && rawB.containsKey('data') ? rawB['data'] : (rawB is List ? rawB : []);
          _warehouses = rawW is Map && rawW.containsKey('data') ? rawW['data'] : (rawW is List ? rawW : []);
          _branches = rawBr is Map && rawBr.containsKey('data') ? rawBr['data'] : (rawBr is List ? rawBr : []);
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showAddWarehouseDialog() {
    _warehouseNameCtrl.text = 'Asosiy Ombor';
    String? selectedBranchId = _branches.isNotEmpty ? _branches.first['id'] as String? : null;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final theme = Theme.of(context);
          final formKey = GlobalKey<FormState>();
          bool submitted = false;

          return Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            child: Form(
              key: formKey,
              autovalidateMode: submitted ? AutovalidateMode.always : AutovalidateMode.disabled,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Yangi Ombor Yaratish',
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _warehouseNameCtrl,
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Ombor nomi majburiy!' : null,
                    decoration: const InputDecoration(
                      labelText: 'Ombor Nomi *',
                      prefixIcon: Icon(Icons.warehouse_outlined),
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (_branches.isNotEmpty)
                    DropdownButtonFormField<String>(
                      value: selectedBranchId,
                      style: TextStyle(color: theme.colorScheme.onSurface, fontSize: 14, fontWeight: FontWeight.w500),
                      dropdownColor: theme.colorScheme.surface,
                      iconEnabledColor: theme.colorScheme.onSurface,
                      decoration: const InputDecoration(
                        labelText: 'Filial',
                        border: OutlineInputBorder(),
                      ),
                      items: _branches.map((b) => DropdownMenuItem<String>(
                        value: b['id'] as String,
                        child: Text(b['name'] ?? 'Filial', style: TextStyle(color: theme.colorScheme.onSurface)),
                      )).toList(),
                      onChanged: (val) => setModalState(() => selectedBranchId = val),
                    ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.add_business),
                    label: Text('Saqlash', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    onPressed: () async {
                      setModalState(() => submitted = true);
                      if (!formKey.currentState!.validate()) {
                        return;
                      }

                      final name = _warehouseNameCtrl.text.trim();

                      if (selectedBranchId == null && _branches.isNotEmpty) {
                        selectedBranchId = _branches.first['id'] as String?;
                      }

                      try {
                        final payload = <String, dynamic>{
                          'name': name,
                          'isDefault': _warehouses.isEmpty,
                        };
                        if (selectedBranchId != null && selectedBranchId!.isNotEmpty) {
                          payload['branchId'] = selectedBranchId;
                        }

                        final res = await _apiService.post('/warehouses', payload);

                        if (res.statusCode == 200 || res.statusCode == 201) {
                          if (mounted) {
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Yangi ombor muvaffaqiyatli yaratildi!')),
                            );
                            _loadData();
                          }
                        }
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Xatolik: ${ApiService.parseError(e)}')),
                          );
                        }
                      }
                    },
                  ),
                ],
              ),
            ),
          );
        },
      ),
  );
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
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadData),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddWarehouseDialog,
        icon: const Icon(Icons.add_business),
        label: Text('Ombor Qo\'shish', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Quick Actions (Kirim & Chiqim)
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            icon: const Icon(Icons.add_shopping_cart, color: Colors.white, size: 20),
                            label: Text('Kirim Qilish', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            onPressed: () async {
                              await Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const InventoryReceiveView()),
                              );
                              _loadData();
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton.icon(
                            icon: const Icon(Icons.remove_shopping_cart_outlined, color: Colors.white, size: 20),
                            label: Text('Chiqim Qilish', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            onPressed: () async {
                              await Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const InventoryAdjustView()),
                              );
                              _loadData();
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Warehouses list header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Mavjud Omborlar (${_warehouses.length})',
                          style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        TextButton.icon(
                          onPressed: _showAddWarehouseDialog,
                          icon: const Icon(Icons.add, size: 18),
                          label: const Text('Qo\'shish'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    _warehouses.isEmpty
                        ? Card(
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  const Icon(Icons.info_outline, color: Colors.orange),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      'Hali ombor mavjud emas. "+ Ombor Qo\'shish" tugmasini bosing!',
                                      style: GoogleFonts.outfit(),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : SizedBox(
                            height: 100,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: _warehouses.length,
                              itemBuilder: (ctx, idx) {
                                final wh = _warehouses[idx];
                                final isDef = wh['isDefault'] == true;
                                return Card(
                                  margin: const EdgeInsets.only(right: 12),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  color: isDef ? theme.colorScheme.primaryContainer : theme.colorScheme.surfaceContainerHigh,
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Row(
                                          children: [
                                            Icon(
                                              Icons.warehouse,
                                              color: isDef ? theme.colorScheme.onPrimaryContainer : theme.colorScheme.primary,
                                              size: 20,
                                            ),
                                            const SizedBox(width: 8),
                                            Text(
                                              wh['name'] ?? 'Ombor',
                                              style: GoogleFonts.outfit(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 15,
                                                color: isDef ? theme.colorScheme.onPrimaryContainer : theme.colorScheme.onSurface,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          isDef ? 'Asosiy Ombor' : 'Ombor',
                                          style: GoogleFonts.outfit(
                                            fontSize: 12,
                                            color: isDef ? theme.colorScheme.onPrimaryContainer.withOpacity(0.8) : Colors.grey,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                    const SizedBox(height: 24),

                    // Batches list header
                    Text(
                      'Ombordagi Mahsulot Partiyalari',
                      style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    _batches.isEmpty
                        ? Center(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 40),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.warehouse_outlined, size: 56, color: theme.colorScheme.outline),
                                  const SizedBox(height: 12),
                                  Text(
                                    'Omborda hali mahsulot partiyalari mavjud emas',
                                    style: GoogleFonts.outfit(fontSize: 15, color: Colors.grey),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: _batches.length,
                            itemBuilder: (context, idx) {
                              final b = _batches[idx];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: theme.colorScheme.secondaryContainer,
                                    child: Icon(Icons.layers, color: theme.colorScheme.onSecondaryContainer, size: 20),
                                  ),
                                  title: Text(
                                    b['productName'] ?? b['product']?['name'] ?? 'Mahsulot nomi noma\'lum',
                                    style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
                                  ),
                                  subtitle: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Partiya #: ${b['batchNumber'] ?? 'Noma\'lum'}', style: GoogleFonts.outfit(fontSize: 12)),
                                      Text('Ombor: ${b['warehouseName'] ?? b['warehouse']?['name'] ?? 'Asosiy Ombor'}', style: GoogleFonts.outfit(fontSize: 12)),
                                    ],
                                  ),
                                  trailing: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(
                                        '${(double.tryParse(b['remainingQty']?.toString() ?? '0') ?? 0).toStringAsFixed(0)} dona',
                                        style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 14),
                                      ),
                                      if (b['expiresAt'] != null)
                                        Text(
                                          'Muddati: ${b['expiresAt'].toString().split('T')[0]}',
                                          style: GoogleFonts.outfit(
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
                  ],
                ),
              ),
            ),
    );
  }
}
