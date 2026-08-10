import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class ProductsView extends StatefulWidget {
  const ProductsView({super.key});

  @override
  State<ProductsView> createState() => _ProductsViewState();
}

class _ProductsViewState extends State<ProductsView> {
  final _apiService = ApiService();
  bool _loading = true;
  List<dynamic> _products = [];
  List<dynamic> _categories = [];
  List<dynamic> _warehouses = [];
  String _searchQuery = '';
  String? _selectedCategoryId;
  String? _selectedWarehouseId;
  String _selectedUnit = 'dona';

  static const List<String> _units = ['dona', 'kg', 'litr', 'metr', 'quti', 'to\'plam'];

  // Add Product form controllers
  final _skuController = TextEditingController();
  final _nameController = TextEditingController();
  final _barcodeController = TextEditingController();
  final _purchasePriceController = TextEditingController();
  final _salePriceController = TextEditingController();
  final _wholesalePriceController = TextEditingController();
  final _stockController = TextEditingController();
  final _minStockController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchProducts();
    _fetchCategories();
    _fetchWarehouses();
  }

  @override
  void dispose() {
    _skuController.dispose();
    _nameController.dispose();
    _barcodeController.dispose();
    _purchasePriceController.dispose();
    _salePriceController.dispose();
    _wholesalePriceController.dispose();
    _stockController.dispose();
    _minStockController.dispose();
    super.dispose();
  }

  Future<void> _fetchWarehouses() async {
    try {
      final res = await _apiService.get('/warehouses');
      final raw = res.data;
      final list = raw is Map && raw['data'] is List ? raw['data'] as List : (raw is List ? raw : []);
      if (mounted) {
        setState(() {
          _warehouses = list;
          if (_warehouses.isNotEmpty && _selectedWarehouseId == null) {
            final def = _warehouses.firstWhere(
              (w) => w is Map && (w['isDefault'] == true),
              orElse: () => _warehouses.first,
            );
            _selectedWarehouseId = def is Map ? def['id']?.toString() : null;
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchCategories() async {
    try {
      final res = await _apiService.get('/categories');
      if (res.statusCode == 200) {
        final raw = res.data;
        if (mounted) {
          setState(() {
            if (raw is Map && raw.containsKey('data')) {
              _categories = raw['data'] is List ? raw['data'] : [];
            } else if (raw is List) {
              _categories = raw;
            }
            final valid = _categories.where((c) => c is Map && c['id'] != null).toList();
            if (valid.isNotEmpty && _selectedCategoryId == null) {
              _selectedCategoryId = valid.first['id'].toString();
            }
          });
        }
      }
    } catch (_) {}
  }

  Future<void> _fetchProducts() async {
    setState(() => _loading = true);
    try {
      final res = await _apiService.get('/products?limit=100&q=$_searchQuery');
      if (res.statusCode == 200) {
        if (mounted) {
          setState(() {
            final raw = res.data;
            _products = raw is Map && raw.containsKey('data') ? (raw['data'] is List ? raw['data'] : []) : (raw is List ? raw : []);
            _loading = false;
          });
        }
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<String?> _getOrCreateCategoryId() async {
    final valid = _categories.where((c) => c is Map && c['id'] != null).toList();
    if (_selectedCategoryId != null && _selectedCategoryId!.isNotEmpty) {
      final exists = valid.any((c) => c['id'].toString() == _selectedCategoryId);
      if (exists) return _selectedCategoryId;
    }
    if (valid.isNotEmpty) {
      return valid.first['id'].toString();
    }
    // Auto-create a default category if none exists
    try {
      final res = await _apiService.post('/categories', {'name': 'Umumiy'});
      if (res.data != null && res.data['id'] != null) {
        final newId = res.data['id'].toString();
        await _fetchCategories();
        return newId;
      }
    } catch (_) {}
    return null;
  }

  void _showAddProductDialog() {
    _skuController.text = 'PRD-${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}';
    _nameController.clear();
    _barcodeController.clear();
    _purchasePriceController.clear();
    _salePriceController.clear();
    _wholesalePriceController.clear();
    _stockController.clear();
    _minStockController.clear();
    _selectedUnit = 'dona';

    final validCats = _categories.where((c) => c is Map && c['id'] != null).toList();
    if (validCats.isNotEmpty) {
      _selectedCategoryId = validCats.first['id'].toString();
    }
    if (_warehouses.isEmpty) {
      _fetchWarehouses();
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final validCategories = _categories.where((c) => c is Map && c['id'] != null).toList();
          String? currentCategoryVal = _selectedCategoryId;
          if (validCategories.isNotEmpty) {
            final hasMatch = validCategories.any((c) => c['id'].toString() == currentCategoryVal);
            if (!hasMatch) {
              currentCategoryVal = validCategories.first['id'].toString();
            }
          } else {
            currentCategoryVal = null;
          }

          return Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Yangi Mahsulot Qo\'shish',
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _skuController,
                          decoration: const InputDecoration(
                            labelText: 'SKU kodi *',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _barcodeController,
                          decoration: const InputDecoration(
                            labelText: 'Barkod (ixtiyoriy)',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Mahsulot Nomi *',
                      prefixIcon: Icon(Icons.inventory_2_outlined),
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (validCategories.isNotEmpty)
                    DropdownButtonFormField<String>(
                      value: currentCategoryVal,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        labelText: 'Kategoriya *',
                        border: OutlineInputBorder(),
                      ),
                      items: validCategories.map((cat) => DropdownMenuItem<String>(
                        value: cat['id'].toString(),
                        child: Text((cat['name'] ?? 'Kategoriya').toString(), overflow: TextOverflow.ellipsis),
                      )).toList(),
                      onChanged: (val) {
                        setModalState(() => _selectedCategoryId = val);
                      },
                    ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _purchasePriceController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Tannarx (UZS) *',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _salePriceController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Sotish Narxi (UZS) *',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedUnit,
                          isExpanded: true,
                          decoration: const InputDecoration(
                            labelText: 'O\'lchov birligi',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          items: _units.map((u) => DropdownMenuItem(value: u, child: Text(u))).toList(),
                          onChanged: (val) => setModalState(() => _selectedUnit = val ?? 'dona'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _wholesalePriceController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Ulgurji narx (ixtiyoriy)',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _stockController,
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            labelText: 'Boshlang\'ich qoldiq ($_selectedUnit)',
                            hintText: 'Nechta dona',
                            border: const OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _minStockController,
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(
                            labelText: 'Min. qoldiq (ogohlantirish)',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (_warehouses.isNotEmpty)
                    DropdownButtonFormField<String>(
                      value: _warehouses.any((w) => w is Map && w['id']?.toString() == _selectedWarehouseId)
                          ? _selectedWarehouseId
                          : null,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        labelText: 'Ombor (qoldiq kiritilsa majburiy)',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      items: _warehouses
                          .whereType<Map>()
                          .map((w) => DropdownMenuItem(
                                value: w['id'].toString(),
                                child: Text((w['name'] ?? 'Ombor').toString(), overflow: TextOverflow.ellipsis),
                              ))
                          .toList(),
                      onChanged: (val) => setModalState(() => _selectedWarehouseId = val),
                    ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () async {
                      final sku = _skuController.text.trim();
                      final name = _nameController.text.trim();
                      final purchaseRaw = _purchasePriceController.text.trim();
                      final saleRaw = _salePriceController.text.trim();

                      if (sku.isEmpty || name.isEmpty || purchaseRaw.isEmpty || saleRaw.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Barcha majburiy kataklarni to\'ldiring!')),
                        );
                        return;
                      }

                      final purchaseNum = double.tryParse(purchaseRaw);
                      final saleNum = double.tryParse(saleRaw);
                      if (purchaseNum == null || saleNum == null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Narxlar faqat raqam shaklida bo\'lishi kerak!')),
                        );
                        return;
                      }

                      final categoryId = await _getOrCreateCategoryId();
                      if (categoryId == null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Kategoriya aniqlanmadi. Avval kategoriya yarating!')),
                        );
                        return;
                      }

                      final stockRaw = _stockController.text.trim();
                      final stockNum = stockRaw.isEmpty ? 0.0 : (double.tryParse(stockRaw) ?? 0.0);
                      if (stockNum > 0 && (_selectedWarehouseId == null || _selectedWarehouseId!.isEmpty)) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Qoldiq kiritilganda omborni tanlang!')),
                        );
                        return;
                      }

                      final wholesaleRaw = _wholesalePriceController.text.trim();
                      final minStockRaw = _minStockController.text.trim();

                      try {
                        final res = await _apiService.post('/products', {
                          'sku': sku,
                          'name': name,
                          'categoryId': categoryId,
                          if (_barcodeController.text.trim().isNotEmpty)
                            'barcode': _barcodeController.text.trim(),
                          'unitOfMeasure': _selectedUnit,
                          'purchasePriceUzs': purchaseNum.toStringAsFixed(0),
                          'salePriceUzs': saleNum.toStringAsFixed(0),
                          if (wholesaleRaw.isNotEmpty && double.tryParse(wholesaleRaw) != null)
                            'wholesalePriceUzs': double.parse(wholesaleRaw).toStringAsFixed(0),
                          if (minStockRaw.isNotEmpty && double.tryParse(minStockRaw) != null)
                            'minStockLevel': double.parse(minStockRaw).toStringAsFixed(0),
                          if (stockNum > 0) 'initialStock': stockNum.toStringAsFixed(0),
                          if (stockNum > 0 && _selectedWarehouseId != null)
                            'initialWarehouseId': _selectedWarehouseId,
                        });

                        if (res.statusCode == 200 || res.statusCode == 201) {
                          if (mounted) {
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Mahsulot yaratildi!')),
                            );
                            _fetchProducts();
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
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text(
                      'Saqlash',
                      style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Mahsulotlar Katalogi',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchProducts,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddProductDialog,
        icon: const Icon(Icons.add),
        label: Text('Mahsulot Qo\'shish', style: GoogleFonts.outfit()),
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Katalogdan qidirish...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
              onChanged: (val) {
                _searchQuery = val;
                _fetchProducts();
              },
            ),
          ),
          // Product List
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _products.isEmpty
                    ? Center(
                        child: Text(
                          'Mahsulotlar topilmadi',
                          style: GoogleFonts.outfit(fontSize: 16, color: Colors.grey),
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _fetchProducts,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _products.length,
                          itemBuilder: (context, index) {
                            final p = _products[index];
                            final sku = p['sku'] ?? 'N/A';
                            final name = p['name'] ?? 'Nomi yo\'q';
                            final salePrice = p['salePriceUzs'] ?? 0;
                            final stock = p['totalStock'] ?? 0;

                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: theme.colorScheme.primaryContainer,
                                  child: Icon(
                                    Icons.inventory_2,
                                    color: theme.colorScheme.onPrimaryContainer,
                                    size: 20,
                                  ),
                                ),
                                title: Text(
                                  name,
                                  style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
                                ),
                                subtitle: Text(
                                  'SKU: $sku | Qoldiq: $stock ${p['unitOfMeasure'] ?? 'dona'}',
                                  style: GoogleFonts.outfit(fontSize: 12),
                                ),
                                trailing: Text(
                                  '${_formatNumber(salePrice)} so\'m',
                                  style: GoogleFonts.outfit(
                                    fontWeight: FontWeight.bold,
                                    color: theme.colorScheme.primary,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
