import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/printer_service.dart';
import '../services/sync_service.dart';

class PosView extends StatefulWidget {
  const PosView({super.key});

  @override
  State<PosView> createState() => _PosViewState();
}

class _PosViewState extends State<PosView> {
  final _apiService = ApiService();
  final _syncService = SyncService();
  final _printer = PrinterService();
  final _searchController = TextEditingController();
  final _searchFocus = FocusNode();

  // Search is debounced, and each request carries a sequence number so a
  // slow response for an older query can never overwrite newer results.
  Timer? _searchDebounce;
  int _searchSeq = 0;

  // True while a checkout request is in flight. Each tap mints its own
  // Idempotency-Key, so without this guard a double tap records two sales.
  bool _checkingOut = false;

  List<dynamic> _searchResults = [];
  final List<Map<String, dynamic>> _cart = [];

  // Checkout Options
  String _paymentType = 'CASH'; // CASH, CARD, TRANSFER, DEBT, MIXED
  Map<String, dynamic>? _selectedCustomer;
  List<dynamic> _customers = [];
  final _paidNowController = TextEditingController();

  // Display/settlement currency for this sale. Line items are always priced
  // and sent to the backend in UZS (`unitPriceUzs` is the only field the
  // API accepts) — switching to USD only changes what's shown on screen and
  // which amountPaid* field carries the payment, exactly like the desktop
  // POS's currency toggle.
  String _currency = 'UZS'; // UZS or USD
  // The company's active rate from the server (GET /currency/rate) — the
  // same rate the backend converts USD payments with. There is deliberately
  // no hardcoded fallback: USD stays disabled until this has loaded.
  double _exchangeRate = 0;
  bool get _rateLoaded => _exchangeRate > 0;

  @override
  void initState() {
    super.initState();
    _loadCustomers();
    _loadExchangeRate();
  }

  Future<void> _loadExchangeRate() async {
    try {
      final res = await _apiService.get('/currency/rate');
      if (res.statusCode == 200 && res.data is Map) {
        final rate = double.tryParse(
          (res.data['rate'] ?? res.data['rateUzs'])?.toString() ?? '',
        );
        if (rate != null && rate > 0 && mounted) {
          setState(() => _exchangeRate = rate);
        }
      }
    } catch (_) {
      // No active rate (or no currency.view permission): USD checkout stays
      // blocked with a message instead of guessing a rate.
    }
  }

  void _showRateMissing() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Valyuta kursi yuklanmadi. USD da sotish uchun avval faol kursni o\'rnating yoki internetni tekshiring.',
        ),
      ),
    );
  }

  /// USD amount that is never less than [amountUzs] at the server's rate:
  /// rounded UP to the cent (the backend tolerates at most half a cent short).
  String _usdCeil(double amountUzs) {
    final cents = ((amountUzs / _exchangeRate) * 100 - 1e-6).ceil();
    return (cents / 100).toStringAsFixed(2);
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchFocus.dispose();
    _searchController.dispose();
    _paidNowController.dispose();
    super.dispose();
  }

  Future<void> _loadCustomers() async {
    try {
      final res = await _apiService.get('/customers?limit=100');
      if (res.statusCode == 200 && mounted) {
        final raw = res.data;
        setState(() {
          if (raw is Map && raw.containsKey('data')) {
            _customers = raw['data'] is List ? raw['data'] : [];
          } else if (raw is List) {
            _customers = raw;
          }
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Mijozlar ro\'yxati yuklanmadi: ${ApiService.parseError(e)}',
          ),
        ),
      );
    }
  }

  void _onSearchChanged(String q) {
    _searchDebounce?.cancel();
    final query = q.trim();
    if (query.isEmpty) {
      _searchSeq++; // drop any response still in flight
      setState(() => _searchResults = []);
      return;
    }
    _searchDebounce = Timer(
      const Duration(milliseconds: 300),
      () => _searchProducts(query),
    );
  }

  Future<void> _searchProducts(String q) async {
    final seq = ++_searchSeq;
    bool isStale() => !mounted || seq != _searchSeq;
    try {
      final res = await _apiService.get(
        '/pos/products?q=${Uri.encodeComponent(q)}',
      );
      if (isStale()) return;
      if (res.statusCode == 200) {
        final raw = res.data;
        final list = raw is Map && raw.containsKey('data')
            ? (raw['data'] is List ? raw['data'] : [])
            : (raw is List ? raw : []);
        setState(() => _searchResults = list);
        return;
      }
    } catch (_) {
      // Fall through to the /products fallback below before reporting an error.
    }
    if (isStale()) return;

    try {
      final fb = await _apiService.get(
        '/products?q=${Uri.encodeComponent(q)}&limit=20',
      );
      if (isStale()) return;
      if (fb.statusCode == 200) {
        final raw = fb.data;
        final list = raw is Map && raw.containsKey('data')
            ? (raw['data'] is List ? raw['data'] : [])
            : (raw is List ? raw : []);
        setState(() => _searchResults = list);
      }
    } catch (e) {
      if (!mounted || seq != _searchSeq) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Qidiruvda xatolik: ${ApiService.parseError(e)}'),
        ),
      );
    }
  }

  void _addToCart(dynamic product) {
    setState(() {
      final existingIndex = _cart.indexWhere(
        (item) => item['product']['id'] == product['id'],
      );
      if (existingIndex >= 0) {
        _cart[existingIndex]['quantity'] += 1.0;
      } else {
        final rawPrice =
            product['salePriceUzs'] ??
            product['priceUzs'] ??
            product['salePrice'] ??
            '0';
        final price = double.tryParse(rawPrice.toString()) ?? 0.0;
        _cart.add({'product': product, 'quantity': 1.0, 'salePrice': price});
      }
      _searchResults = [];
      _searchController.clear();
    });
  }

  double get _totalAmount {
    return _cart.fold(
      0.0,
      (sum, item) => sum + (item['quantity'] * item['salePrice']),
    );
  }

  String _formatCurrency(double amount) {
    final str = amount.abs().toStringAsFixed(0);
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) {
        buffer.write(' ');
      }
      buffer.write(str[i]);
    }
    return '${buffer.toString()} UZS';
  }

  /// Shows a UZS amount converted into the currently selected display
  /// currency. The underlying value stays UZS everywhere else (cart state,
  /// the checkout payload's line items) — only this presentation layer
  /// converts, same as the desktop POS's currency toggle.
  String _formatDisplay(double amountUzs) {
    if (_currency == 'USD') {
      final usd = _exchangeRate > 0 ? amountUzs / _exchangeRate : 0.0;
      return '\$${usd.toStringAsFixed(2)}';
    }
    return _formatCurrency(amountUzs);
  }

  Future<void> _handleCheckout() async {
    if (_checkingOut || _cart.isEmpty) return;
    setState(() => _checkingOut = true);
    try {
      await _submitCheckout();
    } finally {
      if (mounted) setState(() => _checkingOut = false);
    }
  }

  Future<void> _submitCheckout() async {
    if (_currency == 'USD' && !_rateLoaded) {
      _showRateMissing();
      return;
    }

    if ((_paymentType == 'DEBT' || _paymentType == 'MIXED') &&
        _selectedCustomer == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _paymentType == 'MIXED'
                ? 'Aralash to\'lov uchun mijozni tanlash majburiy!'
                : 'Nasiya sotuv uchun mijozni tanlash majburiy!',
          ),
        ),
      );
      return;
    }

    // `paidNow` is UZS-denominated (matches `_totalAmount`) regardless of
    // display currency — the "paid now" field is typed in `_currency` and
    // converted here so the rest of the checkout math stays in one unit.
    double? paidNow;
    double? typedPaidNow;
    if (_paymentType == 'MIXED') {
      final typed = double.tryParse(_paidNowController.text.trim());
      typedPaidNow = typed;
      paidNow = typed != null && _currency == 'USD'
          ? typed * _exchangeRate
          : typed;
      if (paidNow == null || paidNow <= 0 || paidNow >= _totalAmount) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Aralash to\'lovda naqd qism 0 dan katta va jami summadan kam bo\'lishi kerak!',
            ),
          ),
        );
        return;
      }
    }

    // Check if any items are sold below cost
    bool belowCost = false;
    for (final item in _cart) {
      final cost = double.parse(
        item['product']['purchasePriceUzs']?.toString() ?? '0.0',
      );
      if (item['salePrice'] < cost) {
        belowCost = true;
        break;
      }
    }

    if (belowCost) {
      final proceed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Diqqat!'),
          content: const Text(
            'Mahsulot tannarxidan past narxda sotilyapti. Davom etasizmi?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Yo\'q'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Ha'),
            ),
          ],
        ),
      );
      if (proceed != true) return;
    }

    // Backend SalePaymentType supports only CASH / CREDIT / MIXED.
    // "Nasiya (Qarz)" is fully unpaid credit; "Aralash" is part-cash/part-credit;
    // cash/card/transfer (no split) are paid in full now.
    final bool isCredit = _paymentType == 'DEBT';
    final bool isMixed = _paymentType == 'MIXED';
    final String backendPaymentType = isCredit
        ? 'CREDIT'
        : (isMixed ? 'MIXED' : 'CASH');
    // Always UZS-denominated — `paidNow` was already converted above.
    final double amountPaidUzsValue = isCredit
        ? 0.0
        : isMixed
        ? paidNow!
        : _totalAmount;
    // The customer physically paid in `_currency`, so that's the field the
    // backend should record the payment against (it sums both fields as
    // UZS-equivalent internally — see sales.service.ts).
    final bool payingInUsd = _currency == 'USD' && !isCredit;

    final salePayload = {
      'originalCurrency': _currency,
      'paymentType': backendPaymentType,
      // Full USD cash is rounded UP to the cent so it never lands short of
      // the UZS total at the server's rate; a MIXED part-payment sends
      // exactly what the cashier typed.
      if (payingInUsd)
        'amountPaidUsd': isMixed
            ? typedPaidNow!.toStringAsFixed(4)
            : _usdCeil(amountPaidUzsValue)
      else
        'amountPaidUzs': amountPaidUzsValue.toStringAsFixed(4),
      if (_selectedCustomer != null) 'customerId': _selectedCustomer!['id'],
      'lineItems': _cart
          .map(
            (item) => {
              'productId': item['product']['id'],
              'quantity': item['quantity'].toStringAsFixed(4),
              'unitPriceUzs': item['salePrice'].toStringAsFixed(4),
            },
          )
          .toList(),
    };

    // Snapshot the cart for the receipt before it's cleared on success.
    final receiptItems = _cart
        .map(
          (item) => ReceiptItem(
            name: (item['product']['name'] ?? '').toString(),
            quantity: (item['quantity'] as num).toDouble(),
            unit: (item['product']['unitOfMeasure'] ?? 'dona').toString(),
            unitPrice: (item['salePrice'] as num).toDouble(),
            total:
                (item['quantity'] as num).toDouble() *
                (item['salePrice'] as num).toDouble(),
          ),
        )
        .toList();
    final receiptTotal = _totalAmount;
    final receiptCustomer = _selectedCustomer?['name']?.toString();
    final receiptPaymentLabel = isCredit
        ? 'Nasiya (Qarz)'
        : isMixed
        ? 'Aralash (naqd ${_formatCurrency(paidNow!)}, qarz ${_formatCurrency(_totalAmount - paidNow)})'
        : _paymentType == 'CARD'
        ? 'Karta'
        : _paymentType == 'TRANSFER'
        ? 'O\'tkazma'
        : 'Naqd';

    // One key per sale: if this attempt times out after the server already
    // recorded it, the offline retry must send the same key so the backend
    // returns the existing sale instead of creating a duplicate.
    final idempotencyKey = ApiService.newIdempotencyKey();

    try {
      final res = await _apiService.post(
        '/sales',
        salePayload,
        idempotencyKey: idempotencyKey,
      );
      if (res.statusCode == 200 || res.statusCode == 201) {
        // The sale response calls it `number`; `saleNumber` is kept as a
        // fallback for older backends.
        final saleNumber =
            (res.data is Map
                    ? (res.data['number'] ?? res.data['saleNumber'])
                    : null)
                ?.toString() ??
            DateTime.now().millisecondsSinceEpoch.toString();
        _successCheckout(
          saleNumber: saleNumber,
          items: receiptItems,
          total: receiptTotal,
          customerName: receiptCustomer,
          paymentLabel: receiptPaymentLabel,
        );
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Server xatosi: ${res.statusCode}'),
              backgroundColor: Colors.red.shade700,
            ),
          );
        }
      }
    } catch (e) {
      if (e is DioException &&
          (e.type == DioExceptionType.connectionError ||
              e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.sendTimeout ||
              e.type == DioExceptionType.receiveTimeout)) {
        await _queueOffline(salePayload, idempotencyKey);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Xatolik: ${ApiService.parseError(e)}'),
              backgroundColor: Colors.red.shade700,
            ),
          );
        }
      }
    }
  }

  void _successCheckout({
    required String saleNumber,
    required List<ReceiptItem> items,
    required double total,
    String? customerName,
    required String paymentLabel,
  }) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Xarid muvaffaqiyatli yakunlandi!'),
        backgroundColor: Colors.green,
        action: SnackBarAction(
          label: 'Chek chiqarish',
          textColor: Colors.white,
          onPressed: () => _printReceipt(
            saleNumber: saleNumber,
            items: items,
            total: total,
            customerName: customerName,
            paymentLabel: paymentLabel,
          ),
        ),
      ),
    );
    setState(() {
      _cart.clear();
      _selectedCustomer = null;
      _paymentType = 'CASH';
      _currency = 'UZS';
      _paidNowController.clear();
    });
  }

  Future<void> _printReceipt({
    required String saleNumber,
    required List<ReceiptItem> items,
    required double total,
    String? customerName,
    required String paymentLabel,
  }) async {
    final date = DateTime.now();
    bool printedOnPaper = false;
    if (_printer.hasSavedPrinter) {
      try {
        printedOnPaper = await _printer.printReceipt(
          companyName: 'ERP',
          saleNumber: saleNumber,
          date: date,
          items: items,
          totalUzs: total,
          customerName: customerName,
          paymentLabel: paymentLabel,
        );
      } catch (_) {
        printedOnPaper = false;
      }
    }
    if (printedOnPaper) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Chek chiqarildi'), backgroundColor: Colors.green),
      );
      return;
    }

    // No paired Bluetooth printer (or it failed) — fall back to sharing the
    // receipt as text so it can still be saved, sent, or printed via the OS
    // share sheet instead of silently offering nothing.
    try {
      final text = _printer.buildReceiptText(
        companyName: 'ERP',
        saleNumber: saleNumber,
        date: date,
        items: items,
        totalUzs: total,
        customerName: customerName,
        paymentLabel: paymentLabel,
      );
      await _printer.shareReceiptText(text, subject: 'Chek #$saleNumber');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Chek chiqmadi: ${e.toString()}'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _queueOffline(
    Map<String, dynamic> salePayload,
    String idempotencyKey,
  ) async {
    await _syncService.queueOfflineSale(salePayload, idempotencyKey);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Internet aloqasi yo\'q. Sotuv offline saqlandi!'),
        backgroundColor: Colors.orange,
      ),
    );
    setState(() {
      _cart.clear();
      _selectedCustomer = null;
      _paymentType = 'CASH';
      _currency = 'UZS';
      _paidNowController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Kassa POS',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
        ),
      ),
      body: Column(
        children: [
          // Search & Scanner
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    focusNode: _searchFocus,
                    decoration: const InputDecoration(
                      labelText: 'Mahsulot qidirish...',
                      prefixIcon: Icon(Icons.search),
                      border: OutlineInputBorder(),
                    ),
                    onChanged: _onSearchChanged,
                  ),
                ),
                const SizedBox(width: 8),
                // No camera scanner is bundled: this focuses the search
                // field so a USB/Bluetooth barcode scanner (which types the
                // code like a keyboard) fills it directly.
                IconButton.filled(
                  icon: const Icon(Icons.qr_code_scanner),
                  tooltip: 'Shtrix-kod skaneri',
                  onPressed: () {
                    _searchController.clear();
                    _onSearchChanged('');
                    _searchFocus.requestFocus();
                  },
                ),
              ],
            ),
          ),

          // Search results dropdown
          if (_searchResults.isNotEmpty)
            Container(
              constraints: const BoxConstraints(maxHeight: 200),
              color: theme.colorScheme.surfaceContainerHighest,
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: _searchResults.length,
                itemBuilder: (context, idx) {
                  final p = _searchResults[idx];
                  final rawStk = p['stock'] ?? p['totalStock'] ?? '0';
                  final stkNum = (rawStk is num)
                      ? rawStk.toDouble()
                      : (double.tryParse(rawStk.toString()) ?? 0.0);
                  return ListTile(
                    title: Text(p['name'] ?? ''),
                    subtitle: Text(
                      '${_formatDisplay(double.tryParse(p['salePriceUzs']?.toString() ?? '0') ?? 0)} | Qoldiq: ${stkNum.toStringAsFixed(0)} ${p['unitOfMeasure'] ?? 'dona'} | SKU: ${p['sku']}',
                    ),
                    trailing: Icon(
                      stkNum > 0 ? Icons.add_circle : Icons.add_circle_outline,
                      color: stkNum > 0 ? Colors.green : Colors.grey,
                    ),
                    onTap: () => _addToCart(p),
                  );
                },
              ),
            ),

          // Cart List
          Expanded(
            child: _cart.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.shopping_cart_outlined,
                          size: 60,
                          color: theme.colorScheme.outline,
                        ),
                        const SizedBox(height: 12),
                        const Text('Savat bo\'sh'),
                      ],
                    ),
                  )
                : ListView.builder(
                    itemCount: _cart.length,
                    itemBuilder: (context, idx) {
                      final item = _cart[idx];
                      final p = item['product'];
                      return Card(
                        margin: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 4,
                        ),
                        child: ListTile(
                          title: Text(
                            p['name'] ?? '',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('SKU: ${p['sku']}'),
                              Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(
                                      Icons.remove_circle_outline,
                                    ),
                                    onPressed: () {
                                      setState(() {
                                        if (item['quantity'] > 1) {
                                          item['quantity'] -= 1;
                                        } else {
                                          _cart.removeAt(idx);
                                        }
                                      });
                                    },
                                  ),
                                  Text(
                                    '${item['quantity']}',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.add_circle_outline),
                                    onPressed: () {
                                      setState(() => item['quantity'] += 1);
                                    },
                                  ),
                                ],
                              ),
                            ],
                          ),
                          trailing: SizedBox(
                            width: 110,
                            child: TextFormField(
                              // Re-keyed on currency so Flutter rebuilds the
                              // field (and its initialValue) fresh when the
                              // toggle changes, instead of keeping stale text.
                              key: ValueKey(
                                '${item['product']['id']}-$_currency',
                              ),
                              initialValue: _currency == 'USD'
                                  ? (item['salePrice'] / _exchangeRate)
                                        .toStringAsFixed(2)
                                  : '${item['salePrice']}',
                              keyboardType: TextInputType.number,
                              decoration: InputDecoration(
                                suffixText: _currency,
                                isDense: true,
                              ),
                              onChanged: (val) {
                                final typed = double.tryParse(val) ?? 0.0;
                                setState(() {
                                  item['salePrice'] = _currency == 'USD'
                                      ? typed * _exchangeRate
                                      : typed;
                                });
                              },
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),

          // Checkout Panel
          if (_cart.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerLow,
                border: Border(
                  top: BorderSide(color: theme.colorScheme.outlineVariant),
                ),
              ),
              child: Column(
                children: [
                  // Currency toggle — display only; line items are always
                  // sent to the backend in UZS (see `_handleCheckout`).
                  Align(
                    alignment: Alignment.centerRight,
                    child: SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(value: 'UZS', label: Text('UZS')),
                        ButtonSegment(value: 'USD', label: Text('USD')),
                      ],
                      selected: {_currency},
                      onSelectionChanged: (sel) {
                        if (sel.first == 'USD' && !_rateLoaded) {
                          _showRateMissing();
                          _loadExchangeRate();
                          return;
                        }
                        setState(() {
                          _currency = sel.first;
                          _paidNowController.clear();
                        });
                      },
                    ),
                  ),
                  const SizedBox(height: 8),
                  // Payment Options Row
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _paymentType,
                          style: TextStyle(
                            color: theme.colorScheme.onSurface,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                          dropdownColor: theme.colorScheme.surface,
                          iconEnabledColor: theme.colorScheme.onSurface,
                          decoration: const InputDecoration(
                            labelText: 'To\'lov turi',
                            isDense: true,
                            border: OutlineInputBorder(),
                          ),
                          items: [
                            DropdownMenuItem(
                              value: 'CASH',
                              child: Text(
                                'Naqd',
                                style: TextStyle(
                                  color: theme.colorScheme.onSurface,
                                ),
                              ),
                            ),
                            DropdownMenuItem(
                              value: 'CARD',
                              child: Text(
                                'Karta',
                                style: TextStyle(
                                  color: theme.colorScheme.onSurface,
                                ),
                              ),
                            ),
                            DropdownMenuItem(
                              value: 'TRANSFER',
                              child: Text(
                                'O\'tkazma',
                                style: TextStyle(
                                  color: theme.colorScheme.onSurface,
                                ),
                              ),
                            ),
                            DropdownMenuItem(
                              value: 'DEBT',
                              child: Text(
                                'Nasiya (Qarz)',
                                style: TextStyle(
                                  color: theme.colorScheme.onSurface,
                                ),
                              ),
                            ),
                            DropdownMenuItem(
                              value: 'MIXED',
                              child: Text(
                                'Aralash (qisman)',
                                style: TextStyle(
                                  color: theme.colorScheme.onSurface,
                                ),
                              ),
                            ),
                          ],
                          onChanged: (val) {
                            if (val != null) {
                              setState(() {
                                _paymentType = val;
                                if (val == 'MIXED' &&
                                    _paidNowController.text.trim().isEmpty) {
                                  final halfUzs = _totalAmount / 2;
                                  _paidNowController.text = _currency == 'USD'
                                      ? (halfUzs / _exchangeRate)
                                            .toStringAsFixed(2)
                                      : halfUzs.toStringAsFixed(0);
                                }
                              });
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: DropdownButtonFormField<Map<String, dynamic>>(
                          value: _selectedCustomer,
                          isExpanded: true,
                          style: TextStyle(
                            color: theme.colorScheme.onSurface,
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                          dropdownColor: theme.colorScheme.surface,
                          iconEnabledColor: theme.colorScheme.onSurface,
                          decoration: InputDecoration(
                            labelText:
                                (_paymentType == 'DEBT' ||
                                    _paymentType == 'MIXED')
                                ? 'Mijoz *'
                                : 'Mijoz (ixtiyoriy)',
                            isDense: true,
                            border: const OutlineInputBorder(),
                          ),
                          items: [
                            DropdownMenuItem(
                              value: null,
                              child: Text(
                                'Mijozsiz sotuv',
                                style: TextStyle(
                                  color: theme.colorScheme.onSurface,
                                ),
                              ),
                            ),
                            ..._customers.map(
                              (c) => DropdownMenuItem(
                                value: c as Map<String, dynamic>,
                                child: Text(
                                  c['name'] ?? '',
                                  style: TextStyle(
                                    color: theme.colorScheme.onSurface,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                          ],
                          onChanged: (val) {
                            setState(() => _selectedCustomer = val);
                          },
                        ),
                      ),
                    ],
                  ),
                  if (_paymentType == 'MIXED') ...[
                    const SizedBox(height: 12),
                    TextField(
                      controller: _paidNowController,
                      keyboardType: TextInputType.number,
                      onChanged: (_) => setState(() {}),
                      decoration: InputDecoration(
                        labelText: 'Hozir to\'lanadigan (naqd) summa',
                        suffixText: _currency,
                        helperText: () {
                          final typed =
                              double.tryParse(_paidNowController.text.trim()) ??
                              0.0;
                          final typedUzs = _currency == 'USD'
                              ? typed * _exchangeRate
                              : typed;
                          return 'Qolgani mijoz qarziga yoziladi: '
                              '${_formatDisplay((_totalAmount - typedUzs).clamp(0, _totalAmount))}';
                        }(),
                        border: const OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Jami summa:',
                            style: TextStyle(fontSize: 12),
                          ),
                          Text(
                            _formatDisplay(_totalAmount),
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                      ElevatedButton.icon(
                        onPressed: _checkingOut ? null : _handleCheckout,
                        icon: _checkingOut
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.check),
                        label: const Text('To\'lov qilish'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 14,
                          ),
                          backgroundColor: theme.colorScheme.primary,
                          foregroundColor: theme.colorScheme.onPrimary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
