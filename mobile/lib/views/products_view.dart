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
  String _searchQuery = '';
  String? _selectedCategoryId;

  // Add Product form controllers
  final _skuController = TextEditingController();
  final _nameController = TextEditingController();
  final _barcodeController = TextEditingController();
  final _unitController = TextEditingController(text: 'dona');
  final _purchasePriceController = TextEditingController();
  final _salePriceController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchProducts();
    _fetchCategories();
  }

  @override
  void dispose() {
    _skuController.dispose();
    _nameController.dispose();
    _barcodeController.dispose();
    _unitController.dispose();
    _purchasePriceController.dispose();
    _salePriceController.dispose();
    super.dispose();
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
            if (_categories.isNotEmpty && _selectedCategoryId == null) {
              _selectedCategoryId = _categories.first['id'] as String?;
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
    if (_selectedCategoryId != null && _selectedCategoryId!.isNotEmpty) {
      return _selectedCategoryId;
    }
    if (_categories.isNotEmpty && _categories.first['id'] != null) {
      return _categories.first['id'] as String;
    }
    // Create a default category if none exists in company
    try {
      final res = await _apiService.post('/categories', {'name': 'Umumiy'});
      if (res.data != null && res.data['id'] != null) {
        final newId = res.data['id'] as String;
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
    if (_categories.isNotEmpty) {
      _selectedCategoryId = _categories.first['id'] as String?;
    }

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
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
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
              if (_categories.isNotEmpty)
                DropdownButtonFormField<String>(
                  value: _selectedCategoryId,
                  decoration: const InputDecoration(
                    labelText: 'Kategoriya *',
                    border: OutlineInputBorder(),
                  ),
                  items: _categories.map((cat) => DropdownMenuItem<String>(
                    value: cat['id'] as String,
                    child: Text(cat['name'] ?? 'Kategoriya'),
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

                  try {
                    final res = await _apiService.post('/products', {
                      'sku': sku,
                      'name': name,
                      'categoryId': categoryId,
                      if (_barcodeController.text.trim().isNotEmpty)
                        'barcode': _barcodeController.text.trim(),
                      'unitOfMeasure': _unitController.text.trim().isNotEmpty ? _unitController.text.trim() : 'dona',
                      'purchasePriceUzs': purchaseNum.toStringAsFixed(0),
                      'salePriceUzs': saleNum.toStringAsFixed(0),
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
