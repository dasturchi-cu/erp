import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class InventoryAdjustView extends StatefulWidget {
  final Map<String, dynamic>? initialProduct;

  const InventoryAdjustView({super.key, this.initialProduct});

  @override
  State<InventoryAdjustView> createState() => _InventoryAdjustViewState();
}

class _InventoryAdjustViewState extends State<InventoryAdjustView> {
  final _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();
  bool _submitted = false;
  bool _loading = true;
  bool _submitting = false;

  List<dynamic> _products = [];
  List<dynamic> _warehouses = [];

  Map<String, dynamic>? _selectedProduct;
  Map<String, dynamic>? _selectedWarehouse;

  // 'OUT' = Chiqim / Kamaytirish (spisanie, brak, kamomad), 'IN' = Kirim / Ko'paytirish (ortiqcha)
  String _adjustType = 'OUT';

  final _quantityController = TextEditingController();
  final _reasonController = TextEditingController(text: 'Yaroqsiz / Buzilgan mahsulot');

  final List<String> _quickReasonsOut = [
    'Yaroqsiz / Buzilgan mahsulot',
    'Inventarizatsiya kamomadi',
    'Muddati o\'tgan mahsulot',
    'Ichki foydalanish / Namuna',
    'Boshqa sabab',
  ];

  final List<String> _quickReasonsIn = [
    'Inventarizatsiya ortiqchasi',
    'Qayta hisoblashdagi farq',
    'Topilgan mahsulot',
    'Boshqa sabab',
  ];

  @override
  void initState() {
    super.initState();
    _loadDependencies();
  }

  @override
  void dispose() {
    _quantityController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _loadDependencies() async {
    setState(() => _loading = true);
    try {
      final pRes = await _apiService.get('/products?limit=100');
      final wRes = await _apiService.get('/warehouses');

      if (mounted) {
        final pList = pRes.data is Map && pRes.data.containsKey('data')
            ? pRes.data['data']
            : (pRes.data is List ? pRes.data : []);
        final wList = wRes.data is Map && wRes.data.containsKey('data')
            ? wRes.data['data']
            : (wRes.data is List ? wRes.data : []);

        setState(() {
          _products = pList is List ? pList : [];
          _warehouses = wList is List ? wList : [];

          if (_warehouses.isNotEmpty) {
            _selectedWarehouse = _warehouses.first as Map<String, dynamic>;
          }

          if (widget.initialProduct != null) {
            final match = _products.firstWhere(
              (p) => p['id'] == widget.initialProduct!['id'],
              orElse: () => widget.initialProduct,
            );
            _selectedProduct = match as Map<String, dynamic>?;
          } else if (_products.isNotEmpty) {
            _selectedProduct = _products.first as Map<String, dynamic>;
          }

          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  double _getProductStock(Map<String, dynamic>? p) {
    if (p == null) return 0.0;
    final val = p['stock'] ?? p['totalStock'] ?? 0;
    return double.tryParse(val.toString()) ?? 0.0;
  }

  Future<void> _handleAdjust() async {
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
        const SnackBar(content: Text('Iltimos, omborni tanlang!')),
      );
      return;
    }

    final qtyRaw = _quantityController.text.trim();
    final qtyNum = double.tryParse(qtyRaw);
    if (qtyNum == null || qtyNum <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Miqdor musbat son bo\'lishi kerak!')),
      );
      return;
    }

    final currentStock = _getProductStock(_selectedProduct);
    if (_adjustType == 'OUT' && qtyNum > currentStock) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Colors.red,
          content: Text('Chiqim miqdori ($qtyNum) mavjud qoldiqdan ($currentStock) oshib ketolmaydi!'),
        ),
      );
      return;
    }

    final reason = _reasonController.text.trim();
    if (reason.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Iltimos, tuzatish sababini kiriting!')),
      );
      return;
    }

    final delta = _adjustType == 'OUT' ? -qtyNum : qtyNum;
    final deltaStr = delta.toStringAsFixed(0);

    setState(() => _submitting = true);

    try {
      final res = await _apiService.post('/inventory/adjust', {
        'productId': _selectedProduct!['id'],
        'warehouseId': _selectedWarehouse!['id'],
        'quantityDelta': deltaStr,
        'reason': reason,
      });

      if (res.statusCode == 200 || res.statusCode == 201) {
        if (mounted) {
          final isOut = _adjustType == 'OUT';
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: isOut ? Colors.orange : Colors.green,
              content: Text(
                isOut
                    ? 'Mahsulot muvaffaqiyatli chiqim (kamaytirish) qilindi!'
                    : 'Mahsulot muvaffaqiyatli qoldiqqa qo\'shildi!',
              ),
            ),
          );
          _quantityController.clear();
          await _loadDependencies();
          setState(() => _submitting = false);
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
    final isOut = _adjustType == 'OUT';
    final currentStock = _getProductStock(_selectedProduct);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Mahsulot Chiqim / Tuzatish',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : GestureDetector(
              onTap: () => FocusScope.of(context).unfocus(),
              child: SingleChildScrollView(
                padding: EdgeInsets.only(
                  left: 16.0,
                  right: 16.0,
                  top: 16.0,
                  bottom: MediaQuery.of(context).viewInsets.bottom + 40.0,
                ),
                child: Form(
                  key: _formKey,
                  autovalidateMode: _submitted ? AutovalidateMode.always : AutovalidateMode.disabled,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Operation Type Switcher (Chiqim vs Kirim)
                      Container(
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.all(4),
                        child: Row(
                          children: [
                            Expanded(
                              child: InkWell(
                                onTap: () {
                                  setState(() {
                                    _adjustType = 'OUT';
                                    _reasonController.text = _quickReasonsOut.first;
                                  });
                                },
                                borderRadius: BorderRadius.circular(10),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  decoration: BoxDecoration(
                                    color: isOut ? Colors.red : Colors.transparent,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.remove_circle_outline, color: isOut ? Colors.white : Colors.grey, size: 18),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Chiqim (Kamaytirish)',
                                        style: GoogleFonts.outfit(
                                          fontWeight: FontWeight.bold,
                                          color: isOut ? Colors.white : theme.colorScheme.onSurface,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            Expanded(
                              child: InkWell(
                                onTap: () {
                                  setState(() {
                                    _adjustType = 'IN';
                                    _reasonController.text = _quickReasonsIn.first;
                                  });
                                },
                                borderRadius: BorderRadius.circular(10),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  decoration: BoxDecoration(
                                    color: !isOut ? Colors.green : Colors.transparent,
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.add_circle_outline, color: !isOut ? Colors.white : Colors.grey, size: 18),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Kirim (Qo\'shish)',
                                        style: GoogleFonts.outfit(
                                          fontWeight: FontWeight.bold,
                                          color: !isOut ? Colors.white : theme.colorScheme.onSurface,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Card with Form fields
                      Card(
                        elevation: 1,
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // Product Picker
                              DropdownButtonFormField<Map<String, dynamic>>(
                                value: _selectedProduct,
                                isExpanded: true,
                                validator: (v) => v == null ? 'Mahsulot tanlanishi majburiy!' : null,
                                decoration: const InputDecoration(
                                  labelText: 'Mahsulot *',
                                  prefixIcon: Icon(Icons.inventory_2_outlined),
                                  border: OutlineInputBorder(),
                                ),
                                items: _products.map((p) {
                                  final stockVal = _getProductStock(p as Map<String, dynamic>);
                                  return DropdownMenuItem(
                                    value: p,
                                    child: Text(
                                      '${p['name']} (Qoldiq: $stockVal ${p['unitOfMeasure'] ?? 'dona'})',
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  );
                                }).toList(),
                                onChanged: (val) => setState(() => _selectedProduct = val),
                              ),
                              const SizedBox(height: 12),

                              // Current Stock Info Banner
                              if (_selectedProduct != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: currentStock > 0 ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: currentStock > 0 ? Colors.green.withOpacity(0.3) : Colors.red.withOpacity(0.3),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        currentStock > 0 ? Icons.check_circle_outline : Icons.warning_amber_rounded,
                                        color: currentStock > 0 ? Colors.green : Colors.red,
                                        size: 18,
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        'Mavjud jami qoldiq: ',
                                        style: GoogleFonts.outfit(fontSize: 13),
                                      ),
                                      Text(
                                        '$currentStock ${_selectedProduct!['unitOfMeasure'] ?? 'dona'}',
                                        style: GoogleFonts.outfit(
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold,
                                          color: currentStock > 0 ? Colors.green : Colors.red,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              const SizedBox(height: 12),

                              // Warehouse Picker
                              DropdownButtonFormField<Map<String, dynamic>>(
                                value: _selectedWarehouse,
                                isExpanded: true,
                                validator: (v) => v == null ? 'Ombor tanlanishi majburiy!' : null,
                                decoration: const InputDecoration(
                                  labelText: 'Ombor *',
                                  prefixIcon: Icon(Icons.warehouse_outlined),
                                  border: OutlineInputBorder(),
                                ),
                                items: _warehouses.map((w) {
                                  return DropdownMenuItem(
                                    value: w as Map<String, dynamic>,
                                    child: Text(w['name'] ?? 'Ombor', overflow: TextOverflow.ellipsis),
                                  );
                                }).toList(),
                                onChanged: (val) => setState(() => _selectedWarehouse = val),
                              ),
                              const SizedBox(height: 14),

                              // Quantity Input
                              TextFormField(
                                controller: _quantityController,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty) return 'Miqdor majburiy!';
                                  final n = double.tryParse(v.trim());
                                  if (n == null || n <= 0) return 'Musbat raqam kiriting!';
                                  if (isOut && n > currentStock) {
                                    return 'Qoldiqdan ($currentStock) ko\'p chiqim qilib bo\'lmaydi!';
                                  }
                                  return null;
                                },
                                decoration: InputDecoration(
                                  labelText: isOut ? 'Chiqim Miqdori *' : 'Qo\'shiladigan Miqdor *',
                                  prefixIcon: Icon(isOut ? Icons.remove_circle : Icons.add_circle, color: isOut ? Colors.red : Colors.green),
                                  border: const OutlineInputBorder(),
                                  helperText: isOut ? 'Ombordagi zaxiradan ayirib tashlanadi' : 'Ombordagi zaxiraga qo\'shiladi',
                                ),
                              ),
                              const SizedBox(height: 14),

                              // Quick Reason Selection Chips
                              Text(
                                'Sabab / Izoh:',
                                style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 13),
                              ),
                              const SizedBox(height: 6),
                              Wrap(
                                spacing: 6,
                                runSpacing: 6,
                                children: (isOut ? _quickReasonsOut : _quickReasonsIn).map((r) {
                                  final isSelected = _reasonController.text == r;
                                  return ChoiceChip(
                                    label: Text(r, style: TextStyle(fontSize: 12, color: isSelected ? Colors.white : theme.colorScheme.onSurface)),
                                    selected: isSelected,
                                    selectedColor: isOut ? Colors.red : Colors.green,
                                    onSelected: (selected) {
                                      if (selected) {
                                        setState(() => _reasonController.text = r);
                                      }
                                    },
                                  );
                                }).toList(),
                              ),
                              const SizedBox(height: 10),

                              // Custom Reason Input
                              TextFormField(
                                controller: _reasonController,
                                validator: (v) => (v == null || v.trim().isEmpty) ? 'Sabab kiritilishi shart!' : null,
                                decoration: const InputDecoration(
                                  labelText: 'Tafsilot / Izoh *',
                                  prefixIcon: Icon(Icons.notes_outlined),
                                  border: OutlineInputBorder(),
                                ),
                              ),
                              const SizedBox(height: 20),

                              // Submit Button
                              ElevatedButton.icon(
                                icon: _submitting
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                                      )
                                    : Icon(isOut ? Icons.output : Icons.input),
                                label: Text(
                                  _submitting
                                      ? 'Saqlanmoqda...'
                                      : (isOut ? 'Chiqimni Saqlash' : 'Kirimni Saqlash'),
                                  style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  backgroundColor: isOut ? Colors.red : Colors.green,
                                  foregroundColor: Colors.white,
                                ),
                                onPressed: _submitting ? null : _handleAdjust,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}
