import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class InventoryReceiveView extends StatefulWidget {
  const InventoryReceiveView({super.key});

  @override
  State<InventoryReceiveView> createState() => _InventoryReceiveViewState();
}

class _InventoryReceiveViewState extends State<InventoryReceiveView> {
  final _apiService = ApiService();
  bool _loading = true;

  List<dynamic> _products = [];
  List<dynamic> _warehouses = [];
  List<dynamic> _suppliers = [];
  List<dynamic> _branches = [];

  Map<String, dynamic>? _selectedProduct;
  Map<String, dynamic>? _selectedWarehouse;
  Map<String, dynamic>? _selectedSupplier;
  String _paymentType = 'CASH'; // CASH = naqd, CREDIT = nasiya (qarzga)

  final _quantityController = TextEditingController();
  final _costController = TextEditingController();

  // Add Warehouse dialog controller
  final _newWarehouseNameCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadDependencies();
  }

  @override
  void dispose() {
    _quantityController.dispose();
    _costController.dispose();
    _newWarehouseNameCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadDependencies() async {
    setState(() => _loading = true);
    try {
      final pRes = await _apiService.get('/products?limit=100');
      final wRes = await _apiService.get('/warehouses');
      final sRes = await _apiService.get('/suppliers?limit=100');
      final bRes = await _apiService.get('/branches');

      if (mounted) {
        final pList = pRes.data is Map && pRes.data.containsKey('data') ? pRes.data['data'] : (pRes.data is List ? pRes.data : []);
        var wList = wRes.data is Map && wRes.data.containsKey('data') ? wRes.data['data'] : (wRes.data is List ? wRes.data : []);
        final sList = sRes.data is Map && sRes.data.containsKey('data') ? sRes.data['data'] : (sRes.data is List ? sRes.data : []);
        final bList = bRes.data is Map && bRes.data.containsKey('data') ? bRes.data['data'] : (bRes.data is List ? bRes.data : []);

        // Auto-create default warehouse if none exists
        if (wList.isEmpty && bList.isNotEmpty) {
          try {
            final defaultWh = await _apiService.post('/warehouses', {
              'name': 'Asosiy Ombor',
              'branchId': bList.first['id'],
              'isDefault': true,
            });
            if (defaultWh.statusCode == 200 || defaultWh.statusCode == 201) {
              wList = [defaultWh.data];
            }
          } catch (_) {}
        }

        setState(() {
          _products = pList is List ? pList : [];
          _warehouses = wList is List ? wList : [];
          _suppliers = sList is List ? sList : [];
          _branches = bList is List ? bList : [];

          if (_warehouses.isNotEmpty) {
            _selectedWarehouse = _warehouses.first as Map<String, dynamic>;
          }
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _createWarehouseOnTheFly() async {
    if (_branches.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Kompaniyada filiallar topilmadi.')),
      );
      return;
    }

    _newWarehouseNameCtrl.text = 'Yangi Ombor';
    String selectedBranchId = _branches.first['id'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Yangi Ombor Yaratish',
                style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _newWarehouseNameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Ombor Nomi *',
                  prefixIcon: Icon(Icons.warehouse_outlined),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              if (_branches.length > 1)
                DropdownButtonFormField<String>(
                  value: selectedBranchId,
                  decoration: const InputDecoration(
                    labelText: 'Filial *',
                    border: OutlineInputBorder(),
                  ),
                  items: _branches.map((b) => DropdownMenuItem<String>(
                    value: b['id'] as String,
                    child: Text(b['name'] ?? 'Filial'),
                  )).toList(),
                  onChanged: (val) {
                    if (val != null) setModalState(() => selectedBranchId = val);
                  },
                ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                icon: const Icon(Icons.add_business),
                label: Text('Omborni Saqlash', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () async {
                  final name = _newWarehouseNameCtrl.text.trim();
                  if (name.isEmpty) return;

                  try {
                    final res = await _apiService.post('/warehouses', {
                      'name': name,
                      'branchId': selectedBranchId,
                      'isDefault': _warehouses.isEmpty,
                    });

                    if (res.statusCode == 200 || res.statusCode == 201) {
                      if (mounted) {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Ombor muvaffaqiyatli yaratildi!')),
                        );
                        _loadDependencies();
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
      ),
    );
  }

  Future<void> _handleReceive() async {
    if (_selectedProduct == null || _selectedWarehouse == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mahsulot va Ombor tanlanishi majburiy!')),
      );
      return;
    }

    if (_selectedSupplier == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ta\'minotchi tanlanishi majburiy!')),
      );
      return;
    }

    final qty = _quantityController.text.trim();
    final cost = _costController.text.trim();

    if (qty.isEmpty || cost.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Miqdor va Kelish Narxi kiritilishi kerak!')),
      );
      return;
    }

    try {
      final res = await _apiService.post('/inventory/receive', {
        'productId': _selectedProduct!['id'],
        'warehouseId': _selectedWarehouse!['id'],
        'quantity': qty,
        'unitCostUzs': cost,
        'supplierId': _selectedSupplier!['id'],
        'paymentType': _paymentType,
      });

      if (res.statusCode == 200 || res.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Mahsulot omborga muvaffaqiyatli kirim qilindi!')),
          );
          _quantityController.clear();
          _costController.clear();
          setState(() {
            _selectedProduct = null;
            _selectedSupplier = null;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xatolik: ${ApiService.parseError(e)}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Mahsulot Kirim Qilish',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadDependencies),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: EdgeInsets.only(
                left: 16.0,
                right: 16.0,
                top: 16.0,
                bottom: MediaQuery.of(context).viewInsets.bottom + 32.0,
              ),
              child: Card(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Kirim Ma\'lumotlari',
                            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                          TextButton.icon(
                            onPressed: _createWarehouseOnTheFly,
                            icon: const Icon(Icons.add_business, size: 18),
                            label: Text('+ Ombor', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // Product Picker
                      DropdownButtonFormField<Map<String, dynamic>>(
                        value: _selectedProduct,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          labelText: 'Mahsulot *',
                          prefixIcon: Icon(Icons.inventory_2_outlined),
                          border: OutlineInputBorder(),
                        ),
                        items: _products.map((p) => DropdownMenuItem(
                          value: p as Map<String, dynamic>,
                          child: Text('${p['name']} (SKU: ${p['sku']})', overflow: TextOverflow.ellipsis),
                        )).toList(),
                        onChanged: (val) {
                          setState(() {
                            _selectedProduct = val;
                            if (val != null && val['purchasePriceUzs'] != null) {
                              _costController.text = val['purchasePriceUzs'].toString();
                            }
                          });
                        },
                      ),
                      const SizedBox(height: 12),
                      // Warehouse Picker
                      DropdownButtonFormField<Map<String, dynamic>>(
                        value: _selectedWarehouse,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          labelText: 'Qaysi Omborgacha? *',
                          prefixIcon: Icon(Icons.warehouse_outlined),
                          border: OutlineInputBorder(),
                        ),
                        items: _warehouses.map((w) => DropdownMenuItem(
                          value: w as Map<String, dynamic>,
                          child: Text(w['name'] ?? 'Ombor', overflow: TextOverflow.ellipsis),
                        )).toList(),
                        onChanged: (val) => setState(() => _selectedWarehouse = val),
                      ),
                      const SizedBox(height: 12),
                      // Supplier Picker (required by backend)
                      DropdownButtonFormField<Map<String, dynamic>>(
                        value: _selectedSupplier,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          labelText: 'Ta\'minotchi *',
                          prefixIcon: Icon(Icons.store_outlined),
                          border: OutlineInputBorder(),
                        ),
                        items: _suppliers
                            .map((s) => DropdownMenuItem(
                                  value: s as Map<String, dynamic>,
                                  child: Text(s['name'] ?? '', overflow: TextOverflow.ellipsis),
                                ))
                            .toList(),
                        onChanged: (val) => setState(() => _selectedSupplier = val),
                      ),
                      const SizedBox(height: 12),
                      // Payment type (required by backend): naqd yoki nasiya
                      DropdownButtonFormField<String>(
                        value: _paymentType,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          labelText: 'To\'lov turi *',
                          prefixIcon: Icon(Icons.payments_outlined),
                          border: OutlineInputBorder(),
                        ),
                        items: const [
                          DropdownMenuItem(value: 'CASH', child: Text('Naqd (darhol to\'landi)')),
                          DropdownMenuItem(value: 'CREDIT', child: Text('Nasiya (ta\'minotchiga qarz)')),
                        ],
                        onChanged: (val) => setState(() => _paymentType = val ?? 'CASH'),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _quantityController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'Kirim Miqdori *',
                                border: OutlineInputBorder(),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: TextField(
                              controller: _costController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'Tannarx (UZS) *',
                                border: OutlineInputBorder(),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add_shopping_cart),
                        label: Text('Kirimni Saqlash', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          backgroundColor: theme.colorScheme.primary,
                          foregroundColor: theme.colorScheme.onPrimary,
                        ),
                        onPressed: _handleReceive,
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}
