import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';

const kProductUnits = [
  {'value': 'pcs', 'label': 'Dona'},
  {'value': 'box', 'label': 'Karobka'},
  {'value': 'kg', 'label': 'Kg'},
  {'value': 'm', 'label': 'Metr'},
  {'value': 'l', 'label': 'Litr'},
  {'value': 'bag', 'label': 'Qop'},
  {'value': 'pack', 'label': 'Pachka'},
  {'value': 'roll', 'label': 'Rulon'},
  {'value': 'set', 'label': 'Komplekt'},
];

class ProductFormView extends StatefulWidget {
  final Map<String, dynamic>? product;

  const ProductFormView({super.key, this.product});

  @override
  State<ProductFormView> createState() => _ProductFormViewState();
}

class _ProductFormViewState extends State<ProductFormView> {
  final _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();

  bool get _isEdit => widget.product != null;

  final _nameCtrl = TextEditingController();
  final _skuCtrl = TextEditingController();
  final _barcodeCtrl = TextEditingController();
  final _unitsPerBoxCtrl = TextEditingController(text: '1');
  final _minStockCtrl = TextEditingController(text: '0');
  final _purchasePriceCtrl = TextEditingController();
  final _salePriceCtrl = TextEditingController();
  final _wholesalePriceCtrl = TextEditingController();
  final _recommendedPriceCtrl = TextEditingController();
  final _minPriceCtrl = TextEditingController();
  final _initialStockCtrl = TextEditingController();

  String _unitOfMeasure = 'pcs';
  String? _categoryId;
  List<dynamic> _categories = [];
  bool _loadingCategories = true;
  bool _saving = false;
  bool _deleting = false;

  String? _imageUrl;
  File? _pickedImage;
  bool _uploadingImage = false;

  @override
  void initState() {
    super.initState();
    _loadCategories();
    final p = widget.product;
    if (p != null) {
      _nameCtrl.text = p['name'] ?? '';
      _skuCtrl.text = p['sku'] ?? '';
      _barcodeCtrl.text = p['barcode'] ?? '';
      _unitOfMeasure = p['unitOfMeasure'] ?? 'pcs';
      _unitsPerBoxCtrl.text = '${p['unitsPerBox'] ?? 1}';
      _minStockCtrl.text = '${p['minStockLevel'] ?? 0}';
      _purchasePriceCtrl.text = '${p['purchasePriceUzs'] ?? ''}';
      _salePriceCtrl.text = '${p['salePriceUzs'] ?? ''}';
      _wholesalePriceCtrl.text = '${p['wholesalePriceUzs'] ?? ''}';
      _recommendedPriceCtrl.text = '${p['recommendedPriceUzs'] ?? ''}';
      _minPriceCtrl.text = '${p['minPriceUzs'] ?? ''}';
      _categoryId = p['categoryId'];
      _imageUrl = p['imageUrl'];
    }
  }

  Future<void> _loadCategories() async {
    try {
      final res = await _apiService.get('/categories');
      setState(() {
        _categories = res.data['data'] ?? [];
        _loadingCategories = false;
        if (_categoryId != null && !_categories.any((c) => c['id'] == _categoryId)) {
          _categoryId = null;
        }
      });
    } catch (_) {
      setState(() => _loadingCategories = false);
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (file == null) return;
    setState(() {
      _pickedImage = File(file.path);
      _uploadingImage = true;
    });
    try {
      final res = await _apiService.uploadImage(file.path);
      setState(() {
        _imageUrl = res.data['fileName'];
        _uploadingImage = false;
      });
    } catch (e) {
      setState(() => _uploadingImage = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Rasm yuklashda xatolik yuz berdi')),
        );
      }
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_categoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Kategoriya tanlang')),
      );
      return;
    }

    setState(() => _saving = true);

    final payload = {
      'name': _nameCtrl.text.trim(),
      'categoryId': _categoryId,
      'barcode': _barcodeCtrl.text.trim().isEmpty ? null : _barcodeCtrl.text.trim(),
      'unitOfMeasure': _unitOfMeasure,
      'unitsPerBox': _unitsPerBoxCtrl.text.trim().isEmpty ? '1' : _unitsPerBoxCtrl.text.trim(),
      'minStockLevel': _minStockCtrl.text.trim().isEmpty ? '0' : _minStockCtrl.text.trim(),
      'purchasePriceUzs': _purchasePriceCtrl.text.trim(),
      'salePriceUzs': _salePriceCtrl.text.trim(),
      if (_wholesalePriceCtrl.text.trim().isNotEmpty) 'wholesalePriceUzs': _wholesalePriceCtrl.text.trim(),
      if (_recommendedPriceCtrl.text.trim().isNotEmpty) 'recommendedPriceUzs': _recommendedPriceCtrl.text.trim(),
      if (_minPriceCtrl.text.trim().isNotEmpty) 'minPriceUzs': _minPriceCtrl.text.trim(),
      if (_imageUrl != null) 'imageUrl': _imageUrl,
    };

    try {
      if (_isEdit) {
        await _apiService.patch('/products/${widget.product!['id']}', payload);
      } else {
        await _apiService.post('/products', {
          'sku': _skuCtrl.text.trim(),
          ...payload,
          if (_initialStockCtrl.text.trim().isNotEmpty) 'initialStock': _initialStockCtrl.text.trim(),
        });
      }
      if (mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_isEdit ? 'Mahsulot yangilandi' : 'Mahsulot yaratildi')),
        );
      }
    } catch (e) {
      setState(() => _saving = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xatolik: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Mahsulotni o\'chirish'),
        content: Text('${_nameCtrl.text} o\'chirilsinmi? Bu amalni ortga qaytarib bo\'lmaydi.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Bekor qilish')),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('O\'chirish', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _deleting = true);
    try {
      await _apiService.delete('/products/${widget.product!['id']}');
      if (mounted) {
        Navigator.of(context).pop(true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Mahsulot o\'chirildi')),
        );
      }
    } catch (e) {
      setState(() => _deleting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('O\'chirishda xatolik: ${e.toString()}')),
        );
      }
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _skuCtrl.dispose();
    _barcodeCtrl.dispose();
    _unitsPerBoxCtrl.dispose();
    _minStockCtrl.dispose();
    _purchasePriceCtrl.dispose();
    _salePriceCtrl.dispose();
    _wholesalePriceCtrl.dispose();
    _recommendedPriceCtrl.dispose();
    _minPriceCtrl.dispose();
    _initialStockCtrl.dispose();
    super.dispose();
  }

  String? _requiredValidator(String? v) => (v == null || v.trim().isEmpty) ? 'Majburiy maydon' : null;

  String? _positiveMoneyValidator(String? v) {
    if (v == null || v.trim().isEmpty) return 'Majburiy maydon';
    final n = num.tryParse(v.trim());
    if (n == null || n <= 0) return 'Musbat son kiriting';
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(
          _isEdit ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
        ),
        actions: [
          if (_isEdit)
            IconButton(
              icon: _deleting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.delete_outline),
              onPressed: _deleting ? null : _delete,
            ),
        ],
      ),
      body: _loadingCategories
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Center(
                    child: GestureDetector(
                      onTap: _uploadingImage ? null : _pickImage,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(
                            width: 120,
                            height: 120,
                            decoration: BoxDecoration(
                              color: theme.colorScheme.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(12),
                              image: _pickedImage != null
                                  ? DecorationImage(image: FileImage(_pickedImage!), fit: BoxFit.cover)
                                  : (_imageUrl != null
                                      ? DecorationImage(
                                          image: NetworkImage(
                                            '${_apiService.baseUrl}/products/image/served/medium/$_imageUrl',
                                          ),
                                          fit: BoxFit.cover,
                                        )
                                      : null),
                            ),
                            child: (_pickedImage == null && _imageUrl == null)
                                ? Icon(Icons.add_a_photo_outlined, size: 32, color: theme.colorScheme.outline)
                                : null,
                          ),
                          if (_uploadingImage) const CircularProgressIndicator(),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  Text('Asosiy ma\'lumotlar', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 16)),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _nameCtrl,
                    decoration: const InputDecoration(labelText: 'Nomi', border: OutlineInputBorder()),
                    validator: _requiredValidator,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _skuCtrl,
                    enabled: !_isEdit,
                    decoration: const InputDecoration(labelText: 'SKU', border: OutlineInputBorder()),
                    validator: _requiredValidator,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _categoryId,
                    decoration: const InputDecoration(labelText: 'Kategoriya', border: OutlineInputBorder()),
                    items: _categories
                        .map<DropdownMenuItem<String>>(
                          (c) => DropdownMenuItem(value: c['id'] as String, child: Text(c['name'] ?? '')),
                        )
                        .toList(),
                    onChanged: (v) => setState(() => _categoryId = v),
                    validator: (v) => v == null ? 'Kategoriya tanlang' : null,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _barcodeCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Shtrix-kod',
                      helperText: 'Ixtiyoriy',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _unitOfMeasure,
                    decoration: const InputDecoration(labelText: 'O\'lchov birligi', border: OutlineInputBorder()),
                    items: kProductUnits
                        .map<DropdownMenuItem<String>>(
                          (u) => DropdownMenuItem(value: u['value'], child: Text(u['label']!)),
                        )
                        .toList(),
                    onChanged: (v) => setState(() => _unitOfMeasure = v ?? 'pcs'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _unitsPerBoxCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Karobkada nechta mahsulot',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _minStockCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Minimal qoldiq',
                      helperText: 'Qoldiq shu qiymatdan past bo\'lsa ogohlantirish',
                      border: OutlineInputBorder(),
                    ),
                  ),

                  const SizedBox(height: 24),
                  Text('Narx tizimi (UZS)', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 16)),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _purchasePriceCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Olish narxi', border: OutlineInputBorder()),
                    validator: _positiveMoneyValidator,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _salePriceCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(labelText: 'Sotish narxi', border: OutlineInputBorder()),
                    validator: _positiveMoneyValidator,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _wholesalePriceCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Ulgurji narxi (ixtiyoriy)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _recommendedPriceCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Tavsiya etilgan narx (ixtiyoriy)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _minPriceCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: const InputDecoration(
                      labelText: 'Eng past sotish narxi (ixtiyoriy)',
                      border: OutlineInputBorder(),
                    ),
                  ),

                  if (!_isEdit) ...[
                    const SizedBox(height: 24),
                    Text('Boshlang\'ich zaxira', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 16)),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _initialStockCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Boshlang\'ich zaxira miqdori',
                        helperText: 'Ixtiyoriy — omborga qabul qiladi',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ],

                  const SizedBox(height: 32),
                  FilledButton(
                    onPressed: _saving ? null : _save,
                    style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                    child: _saving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Saqlash'),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
    );
  }
}
