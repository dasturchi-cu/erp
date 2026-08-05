import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'inventory_adjust_view.dart';
import 'inventory_receive_view.dart';
import 'inventory_transfer_view.dart';
import 'warehouses_view.dart';

class InventoryView extends StatefulWidget {
  const InventoryView({super.key});

  @override
  State<InventoryView> createState() => _InventoryViewState();
}

class _InventoryViewState extends State<InventoryView> with SingleTickerProviderStateMixin {
  final _apiService = ApiService();
  late TabController _tabController;

  bool _loadingBatches = true;
  List<dynamic> _batches = [];

  bool _loadingMovements = true;
  List<dynamic> _movements = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchBatches();
    _fetchMovements();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchBatches() async {
    setState(() => _loadingBatches = true);
    try {
      final res = await _apiService.get('/inventory/batches');
      if (res.statusCode == 200) {
        setState(() {
          _batches = res.data['data'] ?? [];
          _loadingBatches = false;
        });
      }
    } catch (_) {
      setState(() => _loadingBatches = false);
    }
  }

  Future<void> _fetchMovements() async {
    setState(() => _loadingMovements = true);
    try {
      final res = await _apiService.get('/inventory/movements');
      if (res.statusCode == 200) {
        setState(() {
          _movements = res.data['data'] ?? [];
          _loadingMovements = false;
        });
      }
    } catch (_) {
      setState(() => _loadingMovements = false);
    }
  }

  Future<void> _refreshAll() async {
    await Future.wait([_fetchBatches(), _fetchMovements()]);
  }

  Future<void> _openAction(Widget view) async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => view),
    );
    if (changed == true) {
      _refreshAll();
    }
  }

  void _showActionSheet() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.add_box_outlined),
              title: const Text('Tovar qabul qilish'),
              onTap: () {
                Navigator.of(ctx).pop();
                _openAction(const InventoryReceiveView());
              },
            ),
            ListTile(
              leading: const Icon(Icons.swap_horiz),
              title: const Text('Omborlar orasida ko\'chirish'),
              onTap: () {
                Navigator.of(ctx).pop();
                _openAction(const InventoryTransferView());
              },
            ),
            ListTile(
              leading: const Icon(Icons.tune),
              title: const Text('Inventarizatsiya (qoldiqni tuzatish)'),
              onTap: () {
                Navigator.of(ctx).pop();
                _openAction(const InventoryAdjustView());
              },
            ),
          ],
        ),
      ),
    );
  }

  String _movementTypeLabel(String? type) {
    switch (type) {
      case 'RECEIVE':
        return 'Qabul qilish';
      case 'ADJUST':
        return 'Tuzatish';
      case 'TRANSFER_IN':
        return 'Kirim (ko\'chirish)';
      case 'TRANSFER_OUT':
        return 'Chiqim (ko\'chirish)';
      case 'SALE':
        return 'Sotuv';
      case 'RETURN':
        return 'Qaytarish';
      default:
        return type ?? '-';
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
        actions: [
          IconButton(
            icon: const Icon(Icons.warehouse_outlined),
            tooltip: 'Omborlar',
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const WarehousesView()),
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Partiyalar'),
            Tab(text: 'Harakatlar'),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showActionSheet,
        child: const Icon(Icons.add),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _loadingBatches
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
                      onRefresh: _fetchBatches,
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
          _loadingMovements
              ? const Center(child: CircularProgressIndicator())
              : _movements.isEmpty
                  ? const Center(child: Text('Harakatlar mavjud emas'))
                  : RefreshIndicator(
                      onRefresh: _fetchMovements,
                      child: ListView.builder(
                        itemCount: _movements.length,
                        itemBuilder: (context, idx) {
                          final m = _movements[idx];
                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            child: ListTile(
                              leading: Icon(Icons.sync_alt, color: theme.colorScheme.primary),
                              title: Text(m['productName'] ?? ''),
                              subtitle: Text('${_movementTypeLabel(m['type'])} • ${m['warehouseName'] ?? ''}'),
                              trailing: Text(
                                '${m['quantity']}',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
        ],
      ),
    );
  }
}
