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
  bool _submitting = false;
  final _formKey = GlobalKey<FormState>();
  bool _submitted = false;

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
              final wRefresh = await _apiService.get('/warehouses');
              wList = wRefresh.data is Map && wRefresh.data.containsKey('data') ? wRefresh.data['data'] : (wRefresh.data is List ? wRefresh.data : []);
            }
          } catch (_) {}
        }

        setState(() {
          _products = pList;
          _warehouses = wList;
          _suppliers = sList;
          _branches = bList;
          if (_warehouses.isNotEmpty) {
            _selectedWarehouse = _warehouses.first as Map<String, dynamic>;
          }
          if (_suppliers.isNotEmpty) {
            _selectedSupplier = _suppliers.first as Map<String, dynamic>;
          }
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _createWarehouseOnTheFly() async {
    _newWarehouseNameCtrl.text = 'Yangi Ombor';
    String? selectedBranchId = _branches.isNotEmpty ? _branches.first['id'] : null;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final whFormKey = GlobalKey<FormState>();
          bool whSubmitted = false;

          return Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            child: Form(
              key: whFormKey,
              autovalidateMode: whSubmitted ? AutovalidateMode.always : AutovalidateMode.disabled,
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
                    controller: _newWarehouseNameCtrl,
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Ombor nomi majburiy!' : null,
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
                        labelText: 'Filial',
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
                      setModalState(() => whSubmitted = true);
                      if (!whFormKey.currentState!.validate()) {
                        return;
                      }

                      final name = _newWarehouseNameCtrl.text.trim();

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
          );
        },
      ),
    );
  }

  Future<void> _handleReceive() async {
    setState(() => _submitted = true);
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedProduct == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Iltimos, mahsulotni tanlang!')),
      );
      return;
    }

    if (_selectedWarehouse == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Iltimos, qaysi omborga kirim qilishni tanlang!')),
      );
      return;
    }

    if (_selectedSupplier == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Iltimos, ta\'minotchini tanlang!')),
      );
      return;
    }

    final qtyRaw = _quantityController.text.trim();
    final costRaw = _costController.text.trim();

    final qtyNum = double.tryParse(qtyRaw);
    final costNum = double.tryParse(costRaw);

    if (qtyNum == null || qtyNum <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Miqdor musbat son bo\'lishi kerak!')),
      );
      return;
    }

    if (costNum == null || costNum < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tannarx to\'g\'ri kiritilishi kerak!')),
      );
      return;
    }

    setState(() => _submitting = true);

    try {
      final res = await _apiService.post('/inventory/receive', {
        'productId': _selectedProduct!['id'],
        'warehouseId': _selectedWarehouse!['id'],
        'quantity': qtyNum.toStringAsFixed(0),
        'unitCostUzs': costNum.toStringAsFixed(0),
        'supplierId': _selectedSupplier!['id'],
        'paymentType': _paymentType,
      });

      if (res.statusCode == 200 || res.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Colors.green,
              content: Text('Mahsulot omborga muvaffaqiyatli kirim qilindi!'),
            ),
          );
          _quantityController.clear();
          _costController.clear();
          setState(() {
            _selectedProduct = null;
            _submitting = false;
          });
          _loadDependencies();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _submitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red,
            content: Text('Xatolik: ${ApiService.parseError(e)}'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textColor = theme.colorScheme.onSurface;

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
          : GestureDetector(
              onTap: () => FocusScope.of(context).unfocus(),
              child: SingleChildScrollView(
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                padding: EdgeInsets.only(
                  left: 16.0,
                  right: 16.0,
                  top: 16.0,
                  bottom: MediaQuery.of(context).viewInsets.bottom + 48.0,
                ),
                child: Card(
                  elevation: 1,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Form(
                      key: _formKey,
                      autovalidateMode: _submitted ? AutovalidateMode.always : AutovalidateMode.disabled,
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
                            style: TextStyle(color: textColor, fontSize: 14, fontWeight: FontWeight.w500),
                            dropdownColor: theme.colorScheme.surface,
                            iconEnabledColor: textColor,
                            validator: (v) => v == null ? 'Mahsulot tanlanishi majburiy!' : null,
                            decoration: const InputDecoration(
                              labelText: 'Mahsulot *',
                              prefixIcon: Icon(Icons.inventory_2_outlined),
                            ),
                            items: _products.map((p) => DropdownMenuItem(
                              value: p as Map<String, dynamic>,
                              child: Text(
                                '${p['name']} (SKU: ${p['sku']})',
                                style: TextStyle(color: textColor),
                                overflow: TextOverflow.ellipsis,
                              ),
                            )).toList(),
                            onChanged: (val) {
                              setState(() {
                                _selectedProduct = val;
                                if (val != null && val['purchasePriceUzs'] != null) {
                                  final cost = double.tryParse(val['purchasePriceUzs'].toString()) ?? 0;
                                  _costController.text = cost.toStringAsFixed(0);
                                }
                              });
                            },
                          ),
                          const SizedBox(height: 14),
                          // Warehouse Picker
                          DropdownButtonFormField<Map<String, dynamic>>(
                            value: _selectedWarehouse,
                            isExpanded: true,
                            style: TextStyle(color: textColor, fontSize: 14, fontWeight: FontWeight.w500),
                            dropdownColor: theme.colorScheme.surface,
                            iconEnabledColor: textColor,
                            validator: (v) => v == null ? 'Ombor tanlanishi majburiy!' : null,
                            decoration: const InputDecoration(
                              labelText: 'Qaysi Omborgacha? *',
                              prefixIcon: Icon(Icons.warehouse_outlined),
                            ),
                            items: _warehouses.map((w) => DropdownMenuItem(
                              value: w as Map<String, dynamic>,
                              child: Text(
                                w['name'] ?? 'Ombor',
                                style: TextStyle(color: textColor),
                                overflow: TextOverflow.ellipsis,
                              ),
                            )).toList(),
                            onChanged: (val) => setState(() => _selectedWarehouse = val),
                          ),
                          const SizedBox(height: 14),
                          // Supplier Picker (required by backend)
                          DropdownButtonFormField<Map<String, dynamic>>(
                            value: _selectedSupplier,
                            isExpanded: true,
                            style: TextStyle(color: textColor, fontSize: 14, fontWeight: FontWeight.w500),
                            dropdownColor: theme.colorScheme.surface,
                            iconEnabledColor: textColor,
                            validator: (v) => v == null ? 'Ta\'minotchi tanlanishi majburiy!' : null,
                            decoration: const InputDecoration(
                              labelText: 'Ta\'minotchi *',
                              prefixIcon: Icon(Icons.store_outlined),
                            ),
                            items: _suppliers
                                .map((s) => DropdownMenuItem(
                                      value: s as Map<String, dynamic>,
                                      child: Text(
                                        s['name'] ?? '',
                                        style: TextStyle(color: textColor),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ))
                                .toList(),
                            onChanged: (val) => setState(() => _selectedSupplier = val),
                          ),
                          const SizedBox(height: 14),
                          // Payment type (required by backend): naqd yoki nasiya
                          DropdownButtonFormField<String>(
                            value: _paymentType,
                            isExpanded: true,
                            style: TextStyle(color: textColor, fontSize: 14, fontWeight: FontWeight.w500),
                            dropdownColor: theme.colorScheme.surface,
                            iconEnabledColor: textColor,
                            decoration: const InputDecoration(
                              labelText: 'To\'lov turi *',
                              prefixIcon: Icon(Icons.payments_outlined),
                            ),
                            items: [
                              DropdownMenuItem(
                                value: 'CASH',
                                child: Text('Naqd (darhol to\'landi)', style: TextStyle(color: textColor)),
                              ),
                              DropdownMenuItem(
                                value: 'CREDIT',
                                child: Text('Nasiya (ta\'minotchiga qarz)', style: TextStyle(color: textColor)),
                              ),
                            ],
                            onChanged: (val) => setState(() => _paymentType = val ?? 'CASH'),
                          ),
                          const SizedBox(height: 14),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _quantityController,
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  style: TextStyle(color: textColor, fontWeight: FontWeight.bold),
                                  validator: (v) {
                                    if (v == null || v.trim().isEmpty) return 'Miqdor majburiy!';
                                    final n = double.tryParse(v.trim());
                                    if (n == null || n <= 0) return 'Musbat raqam!';
                                    return null;
                                  },
                                  decoration: const InputDecoration(
                                    labelText: 'Kirim Miqdori *',
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: TextFormField(
                                  controller: _costController,
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  style: TextStyle(color: textColor, fontWeight: FontWeight.bold),
                                  validator: (v) {
                                    if (v == null || v.trim().isEmpty) return 'Tannarx majburiy!';
                                    final n = double.tryParse(v.trim());
                                    if (n == null || n < 0) return 'To\'g\'ri narx!';
                                    return null;
                                  },
                                  decoration: const InputDecoration(
                                    labelText: 'Tannarx (UZS) *',
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton.icon(
                            icon: _submitting
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                  )
                                : const Icon(Icons.add_shopping_cart),
                            label: Text(
                              _submitting ? 'Saqlanmoqda...' : 'Kirimni Saqlash',
                              style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              backgroundColor: theme.colorScheme.primary,
                              foregroundColor: Colors.white,
                            ),
                            onPressed: _submitting ? null : _handleReceive,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
    );
  }
}
