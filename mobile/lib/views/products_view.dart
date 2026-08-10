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

  // Form Controllers
  final _skuController = TextEditingController();
  final _nameController = TextEditingController();
  final _barcodeController = TextEditingController();
  final _unitController = TextEditingController(text: 'dona');
  final _purchasePriceController = TextEditingController();
  final _salePriceController = TextEditingController();
  String? _selectedCategoryId;

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
        setState(() {
          if (raw is Map && raw.containsKey('data')) {
            _categories = raw['data'] is List ? raw['data'] : [];
          } else if (raw is List) {
            _categories = raw;
          }
        });
      }
    } catch (_) {}
  }

  Future<void> _fetchProducts() async {
    setState(() => _loading = true);
    try {
      final res = await _apiService.get('/products?limit=100&q=$_searchQuery');
      if (res.statusCode == 200) {
        setState(() {
          _products = res.data['data'] ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showAddProductDialog() {
    _skuController.text = 'SKU-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
    _nameController.clear();
    _barcodeController.clear();
    _purchasePriceController.clear();
    _salePriceController.clear();
    _selectedCategoryId = _categories.isNotEmpty ? _categories.first['id'] : null;

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
                    child: Text(cat['name'] ?? ''),
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
                  final purchase = _purchasePriceController.text.trim();
                  final sale = _salePriceController.text.trim();

                  if (sku.isEmpty || name.isEmpty || purchase.isEmpty || sale.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Barcha majburiy kataklarni to\'ldiring!')),
                    );
                    return;
                  }

                  try {
                    final res = await _apiService.post('/products', {
                      'sku': sku,
                      'name': name,
                      if (_selectedCategoryId != null) 'categoryId': _selectedCategoryId,
                      if (_barcodeController.text.trim().isNotEmpty)
                        'barcode': _barcodeController.text.trim(),
                      'unitOfMeasure': _unitController.text.trim(),
                      'purchasePriceUzs': purchase,
                      'salePriceUzs': sale,
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
                child: Text('Saqlash', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
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
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: TextField(
              decoration: const InputDecoration(
                labelText: 'Katalogdan qidirish...',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (val) {
                setState(() => _searchQuery = val);
                _fetchProducts();
              },
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _products.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.inventory_2_outlined, size: 60, color: theme.colorScheme.outline),
                            const SizedBox(height: 12),
                            const Text('Hech qanday mahsulot topilmadi'),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _fetchProducts,
                        child: ListView.builder(
                          itemCount: _products.length,
                          itemBuilder: (context, idx) {
                            final p = _products[idx];
                            return Card(
                              margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor: theme.colorScheme.primaryContainer,
                                  child: Icon(Icons.inventory_2, color: theme.colorScheme.onPrimaryContainer),
                                ),
                                title: Text(p['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                                subtitle: Text('SKU: ${p['sku']} | Barkod: ${p['barcode'] ?? 'yo\'q'}'),
                                trailing: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      '${p['salePriceUzs']} UZS',
                                      style: TextStyle(
                                        color: theme.colorScheme.primary,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    Text(
                                      'Qoldiq: ${p['stock'] ?? '0'} ${p['unitOfMeasure'] ?? 'dona'}',
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                  ],
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
