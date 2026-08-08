import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class CurrencyView extends StatefulWidget {
  const CurrencyView({super.key});

  @override
  State<CurrencyView> createState() => _CurrencyViewState();
}

class _CurrencyViewState extends State<CurrencyView> {
  final _api = ApiService();
  bool _loading = true;

  Map<String, dynamic> _currentRate = {};
  List<dynamic> _history = [];

  final _newRateCtrl = TextEditingController();
  final _calcAmountCtrl = TextEditingController(text: '100');
  double _convertedResult = 0.0;
  String _calcDirection = 'USD_TO_UZS';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _newRateCtrl.dispose();
    _calcAmountCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get('/currency/rate');
      final histRes = await _api.get('/currency/rates?limit=20');

      if (mounted) {
        setState(() {
          _currentRate = res.data ?? {};
          final rawHist = histRes.data;
          _history = rawHist is Map && rawHist.containsKey('data') ? rawHist['data'] : (rawHist is List ? rawHist : []);

          final rateVal = _currentRate['rateUzs'] ?? _currentRate['rate'] ?? 12800;
          _newRateCtrl.text = rateVal.toString();
          _calculateConversion();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _calculateConversion() {
    final rate = double.tryParse(_newRateCtrl.text) ?? 12800.0;
    final amt = double.tryParse(_calcAmountCtrl.text) ?? 0.0;
    setState(() {
      if (_calcDirection == 'USD_TO_UZS') {
        _convertedResult = amt * rate;
      } else {
        _convertedResult = rate > 0 ? amt / rate : 0.0;
      }
    });
  }

  Future<void> _updateExchangeRate() async {
    final rateStr = _newRateCtrl.text.trim();
    if (rateStr.isEmpty) return;

    try {
      final res = await _api.post('/currency/rates', {
        'rateUzs': rateStr,
        'effectiveAt': DateTime.now().toIso8601String(),
      });

      if (res.statusCode == 200 || res.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Dollar kursi muvaffaqiyatli o\'zgartirildi!')),
          );
          _load();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Xatolik: ${e.toString()}')),
        );
      }
    }
  }

  String _formatNumber(double n) {
    final str = n.abs().toStringAsFixed(n % 1 == 0 ? 0 : 2);
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0 && str[i] != '.') {
        buffer.write(' ');
      }
      buffer.write(str[i]);
    }
    return buffer.toString();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final rateUzs = double.tryParse(_currentRate['rateUzs']?.toString() ?? '12800') ?? 12800.0;

    return Scaffold(
      appBar: AppBar(
        title: Text('Valyuta Kurslari', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Current Rate Card
                  Card(
                    color: theme.colorScheme.primaryContainer,
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.attach_money, color: Colors.green, size: 32),
                              Text(' 1 USD = ', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold)),
                              Text('${_formatNumber(rateUzs)} UZS', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: theme.colorScheme.primary)),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: _newRateCtrl,
                                  keyboardType: TextInputType.number,
                                  decoration: const InputDecoration(
                                    labelText: 'Yangi Kurs (UZS)',
                                    fillColor: Colors.white,
                                    filled: true,
                                    border: OutlineInputBorder(),
                                  ),
                                  onChanged: (_) => _calculateConversion(),
                                ),
                              ),
                              const SizedBox(width: 12),
                              ElevatedButton(
                                onPressed: _updateExchangeRate,
                                style: ElevatedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                                  backgroundColor: theme.colorScheme.primary,
                                  foregroundColor: theme.colorScheme.onPrimary,
                                ),
                                child: const Text('O\'zgartirish'),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),
                  // Currency Calculator
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Valyuta Kalkulyatori', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: _calcAmountCtrl,
                                  keyboardType: TextInputType.number,
                                  decoration: InputDecoration(
                                    labelText: _calcDirection == 'USD_TO_UZS' ? 'Summa (\$)' : 'Summa (so\'m)',
                                    border: const OutlineInputBorder(),
                                  ),
                                  onChanged: (_) => _calculateConversion(),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.swap_horiz, size: 32),
                                onPressed: () {
                                  setState(() {
                                    _calcDirection = _calcDirection == 'USD_TO_UZS' ? 'UZS_TO_USD' : 'USD_TO_UZS';
                                    _calculateConversion();
                                  });
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: theme.colorScheme.surfaceContainerHighest,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Natija:', style: TextStyle(fontSize: 14)),
                                Text(
                                  '${_formatNumber(_convertedResult)} ${_calcDirection == 'USD_TO_UZS' ? 'UZS' : 'USD'}',
                                  style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: theme.colorScheme.primary),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),
                  // History
                  Text('Kurslar Tarixi', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  _history.isEmpty
                      ? const Card(child: Padding(padding: EdgeInsets.all(16), child: Center(child: Text('Tarix bo\'sh'))))
                      : ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _history.length,
                          itemBuilder: (ctx, i) {
                            final item = _history[i];
                            final rate = double.tryParse(item['rateUzs']?.toString() ?? '0') ?? 0.0;
                            final date = item['createdAt'] ?? item['effectiveAt'];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 6),
                              child: ListTile(
                                leading: const Icon(Icons.history, color: Colors.blue),
                                title: Text('1 USD = ${_formatNumber(rate)} UZS', style: const TextStyle(fontWeight: FontWeight.bold)),
                                subtitle: Text(date != null ? date.toString().split('T')[0] : ''),
                              ),
                            );
                          },
                        ),
                ],
              ),
            ),
    );
  }
}
