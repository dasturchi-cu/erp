import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

/// Search box for the inventory product pickers. The pickers start with the
/// first page of products; typing here asks the server (`GET /products?q=`)
/// so every product is reachable, not just the first 100.
class ProductSearchField extends StatefulWidget {
  /// Called with the server's matches (or the default first page when the
  /// box is cleared).
  final ValueChanged<List<dynamic>> onResults;

  const ProductSearchField({super.key, required this.onResults});

  /// Returns [products] with [selected] guaranteed to be one of its items
  /// (by identity), so a DropdownButton whose value is [selected] never
  /// asserts after the list is replaced by a search result.
  static List<dynamic> withSelected(
    List<dynamic> products,
    Map<String, dynamic>? selected,
  ) {
    if (selected == null) return products;
    final idx = products.indexWhere(
      (p) => p is Map && p['id'] == selected['id'],
    );
    final result = List<dynamic>.from(products);
    if (idx >= 0) {
      result[idx] = selected;
    } else {
      result.insert(0, selected);
    }
    return result;
  }

  @override
  State<ProductSearchField> createState() => _ProductSearchFieldState();
}

class _ProductSearchFieldState extends State<ProductSearchField> {
  final _api = ApiService();
  final _controller = TextEditingController();
  Timer? _debounce;
  int _seq = 0;
  bool _searching = false;

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    setState(() {}); // show/hide the clear button
    _debounce?.cancel();
    _debounce = Timer(
      const Duration(milliseconds: 300),
      () => _search(value.trim()),
    );
  }

  Future<void> _search(String q) async {
    final seq = ++_seq;
    setState(() => _searching = true);
    try {
      final path = q.isEmpty
          ? '/products?limit=100'
          : '/products?q=${Uri.encodeQueryComponent(q)}&limit=100';
      final res = await _api.get(path);
      if (!mounted || seq != _seq) return;
      final raw = res.data;
      final list = raw is Map && raw['data'] is List
          ? raw['data'] as List
          : (raw is List ? raw : <dynamic>[]);
      widget.onResults(list);
    } catch (e) {
      if (!mounted || seq != _seq) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Qidiruvda xatolik: ${ApiService.parseError(e)}'),
        ),
      );
    } finally {
      if (mounted && seq == _seq) setState(() => _searching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      onChanged: _onChanged,
      textInputAction: TextInputAction.search,
      decoration: InputDecoration(
        labelText: 'Mahsulot qidirish (nomi, SKU yoki shtrix-kod)',
        prefixIcon: const Icon(Icons.search),
        border: const OutlineInputBorder(),
        isDense: true,
        suffixIcon: _searching
            ? const Padding(
                padding: EdgeInsets.all(12),
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              )
            : (_controller.text.isEmpty
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _controller.clear();
                        _onChanged('');
                        setState(() {});
                      },
                    )),
      ),
    );
  }
}
