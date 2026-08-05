import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class CategoriesView extends StatefulWidget {
  const CategoriesView({super.key});

  @override
  State<CategoriesView> createState() => _CategoriesViewState();
}

class _CategoriesViewState extends State<CategoriesView> {
  final _apiService = ApiService();
  bool _loading = true;
  List<dynamic> _categories = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _apiService.get('/categories');
      setState(() {
        _categories = res.data['data'] ?? [];
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _showEditor({Map<String, dynamic>? category}) async {
    final controller = TextEditingController(text: category?['name'] ?? '');
    final isEdit = category != null;
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(isEdit ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(labelText: 'Kategoriya nomi', border: OutlineInputBorder()),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Bekor qilish')),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(controller.text.trim()),
            child: const Text('Saqlash'),
          ),
        ],
      ),
    );
    if (result == null || result.isEmpty) return;

    try {
      if (isEdit) {
        await _apiService.patch('/categories/${category['id']}', {'name': result});
      } else {
        await _apiService.post('/categories', {'name': result});
      }
      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(isEdit ? 'Kategoriya yangilandi' : 'Kategoriya qo\'shildi')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xatolik: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _delete(Map<String, dynamic> category) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Kategoriyani o\'chirish'),
        content: Text('"${category['name']}" o\'chirilsinmi?'),
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
    try {
      await _apiService.delete('/categories/${category['id']}');
      await _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('O\'chirishda xatolik: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Kategoriyalar', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showEditor(),
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _categories.isEmpty
              ? const Center(child: Text('Hech qanday kategoriya topilmadi'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    itemCount: _categories.length,
                    itemBuilder: (context, idx) {
                      final c = _categories[idx];
                      return ListTile(
                        leading: Icon(Icons.category_outlined, color: theme.colorScheme.primary),
                        title: Text(c['name'] ?? ''),
                        subtitle: Text('Mahsulotlar: ${c['productCount'] ?? 0}'),
                        onTap: () => _showEditor(category: c),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.red),
                          onPressed: () => _delete(c),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
