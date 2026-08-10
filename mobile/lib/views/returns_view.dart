import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class ReturnsView extends StatefulWidget {
  const ReturnsView({super.key});

  @override
  State<ReturnsView> createState() => _ReturnsViewState();
}

class _ReturnsViewState extends State<ReturnsView> {
  final _api = ApiService();
  bool _loading = true;
  List<dynamic> _returns = [];
  List<dynamic> _products = [];

  final _reasonCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController(text: '1');
  Map<String, dynamic>? _selectedProduct;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _reasonCtrl.dispose();
    _qtyCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get('/sales/returns');
      final pRes = await _api.get('/products?limit=100');
      if (mounted) {
        setState(() {
          final raw = res.data;
          _returns = raw is Map && raw.containsKey('data') ? raw['data'] : (raw is List ? raw : []);
          _products = pRes.data['data'] ?? pRes.data ?? [];
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showCreateReturnDialog() {
    _reasonCtrl.clear();
    _qtyCtrl.text = '1';
    _selectedProduct = _products.isNotEmpty ? _products.first : null;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Vozvrat (Tovarni Qaytarish)', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              DropdownButtonFormField<Map<String, dynamic>>(
                value: _selectedProduct,
                isExpanded: true,
                decoration: const InputDecoration(
                  labelText: 'Qaytarilayotgan Mahsulot *',
                  border: OutlineInputBorder(),
                ),
                items: _products.map((p) => DropdownMenuItem(
                  value: p as Map<String, dynamic>,
                  child: Text(p['name'] ?? '', overflow: TextOverflow.ellipsis),
                )).toList(),
                onChanged: (val) => setModalState(() => _selectedProduct = val),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _qtyCtrl,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Soni (Miqdori) *',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _reasonCtrl,
                decoration: const InputDecoration(
                  labelText: 'Qaytarish Sababi (Brak, yaroqsiz...) *',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () async {
                  if (_selectedProduct == null || _reasonCtrl.text.trim().isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Mahsulot va sabab majburiy!')),
                    );
                    return;
                  }
                  try {
                    final res = await _api.post('/sales/returns', {
                      'reason': _reasonCtrl.text.trim(),
                      'lineItems': [
                        {
                          'productId': _selectedProduct!['id'],
                          'quantity': _qtyCtrl.text.trim(),
                        }
                      ]
                    });
                    if (res.statusCode == 200 || res.statusCode == 201) {
                      if (mounted) {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Vozvrat muvaffaqiyatli saqlandi!')),
                        );
                        _load();
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
                style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                child: Text('Vozvrat Yaratish', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
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
        title: Text('Vozvratlar (Qaytarish)', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateReturnDialog,
        icon: const Icon(Icons.assignment_return),
        label: Text('Vozvrat Yaratish', style: GoogleFonts.outfit()),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _returns.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.assignment_return_outlined, size: 64, color: theme.colorScheme.outline),
                          const SizedBox(height: 12),
                          Text('Vozvratlar topilmadi', style: GoogleFonts.outfit(fontSize: 16)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _returns.length,
                      itemBuilder: (ctx, i) {
                        final r = _returns[i];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: Colors.orange.withOpacity(0.15),
                              child: const Icon(Icons.assignment_return, color: Colors.orange),
                            ),
                            title: Text(r['reason'] ?? 'Vozvrat', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                            subtitle: Text('Status: ${r['status'] ?? 'PENDING'}'),
                            trailing: Text(
                              '${r['totalRefundUzs'] ?? '0'} UZS',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red),
                            ),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
