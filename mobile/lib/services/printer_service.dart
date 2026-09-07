import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:print_bluetooth_thermal/print_bluetooth_thermal.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PrinterDevice {
  final String name;
  final String macAddress;
  PrinterDevice({required this.name, required this.macAddress});
}

class ReceiptItem {
  final String name;
  final double quantity;
  final String unit;
  final double unitPrice;
  final double total;

  ReceiptItem({
    required this.name,
    required this.quantity,
    required this.unit,
    required this.unitPrice,
    required this.total,
  });
}

/// Wraps a 58mm/80mm Bluetooth ESC/POS thermal ("chek") printer: pairing,
/// connecting, and formatting/printing a sale receipt.
class PrinterService {
  static final PrinterService _instance = PrinterService._internal();
  factory PrinterService() => _instance;
  PrinterService._internal();

  String? _savedMac;
  String? _savedName;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _savedMac = prefs.getString('printer_mac');
    _savedName = prefs.getString('printer_name');
  }

  String? get savedMac => _savedMac;
  String? get savedName => _savedName;
  bool get hasSavedPrinter => _savedMac != null && _savedMac!.isNotEmpty;

  Future<bool> isBluetoothEnabled() => PrintBluetoothThermal.bluetoothEnabled;

  Future<List<PrinterDevice>> pairedDevices() async {
    final list = await PrintBluetoothThermal.pairedBluetooths;
    return list
        .map((b) => PrinterDevice(name: b.name, macAddress: b.macAdress))
        .toList();
  }

  Future<bool> get isConnected => PrintBluetoothThermal.connectionStatus;

  Future<bool> connect(String mac, {String? name}) async {
    final ok = await PrintBluetoothThermal.connect(macPrinterAddress: mac);
    if (ok) {
      _savedMac = mac;
      _savedName = name;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('printer_mac', mac);
      if (name != null) await prefs.setString('printer_name', name);
    }
    return ok;
  }

  Future<void> forget() async {
    try {
      await PrintBluetoothThermal.disconnect;
    } catch (_) {}
    _savedMac = null;
    _savedName = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('printer_mac');
    await prefs.remove('printer_name');
  }

  Future<bool> _ensureConnected() async {
    if (await PrintBluetoothThermal.connectionStatus) return true;
    if (_savedMac == null) return false;
    return connect(_savedMac!, name: _savedName);
  }

  /// Returns true if the ticket bytes were sent successfully.
  Future<bool> printReceipt({
    required String companyName,
    required String saleNumber,
    required DateTime date,
    required List<ReceiptItem> items,
    required double totalUzs,
    String? cashierName,
    String? customerName,
    String paymentLabel = 'Naqd',
  }) async {
    if (!await _ensureConnected()) return false;

    final profile = await CapabilityProfile.load();
    final generator = Generator(PaperSize.mm58, profile);
    List<int> bytes = [];

    bytes += generator.reset();
    bytes += generator.text(
      companyName,
      styles: const PosStyles(align: PosAlign.center, bold: true, height: PosTextSize.size2, width: PosTextSize.size2),
    );
    bytes += generator.text('Chek: $saleNumber', styles: const PosStyles(align: PosAlign.center));
    bytes += generator.text(_formatDate(date), styles: const PosStyles(align: PosAlign.center));
    if (cashierName != null && cashierName.isNotEmpty) {
      bytes += generator.text('Kassir: $cashierName', styles: const PosStyles(align: PosAlign.center));
    }
    if (customerName != null && customerName.isNotEmpty) {
      bytes += generator.text('Mijoz: $customerName', styles: const PosStyles(align: PosAlign.center));
    }
    bytes += generator.hr();

    for (final item in items) {
      bytes += generator.text(item.name, styles: const PosStyles(bold: true));
      bytes += generator.row([
        PosColumn(
          text: '${_formatQty(item.quantity)} ${item.unit} x ${_formatMoney(item.unitPrice)}',
          width: 8,
        ),
        PosColumn(
          text: _formatMoney(item.total),
          width: 4,
          styles: const PosStyles(align: PosAlign.right),
        ),
      ]);
    }

    bytes += generator.hr();
    bytes += generator.row([
      PosColumn(text: 'JAMI', width: 6, styles: const PosStyles(bold: true, height: PosTextSize.size2)),
      PosColumn(
        text: '${_formatMoney(totalUzs)} so\'m',
        width: 6,
        styles: const PosStyles(bold: true, align: PosAlign.right, height: PosTextSize.size2),
      ),
    ]);
    bytes += generator.text('To\'lov turi: $paymentLabel', styles: const PosStyles(align: PosAlign.center));
    bytes += generator.feed(1);
    bytes += generator.text('Xaridingiz uchun rahmat!', styles: const PosStyles(align: PosAlign.center));
    bytes += generator.feed(2);
    bytes += generator.cut();

    return PrintBluetoothThermal.writeBytes(bytes);
  }

  String _formatMoney(double amount) {
    final str = amount.abs().round().toString();
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) buffer.write(' ');
      buffer.write(str[i]);
    }
    return buffer.toString();
  }

  String _formatQty(double qty) {
    return qty == qty.roundToDouble() ? qty.toInt().toString() : qty.toStringAsFixed(2);
  }

  String _formatDate(DateTime d) {
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(d.day)}.${two(d.month)}.${d.year} ${two(d.hour)}:${two(d.minute)}';
  }
}
