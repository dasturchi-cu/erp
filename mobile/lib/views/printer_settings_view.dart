import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/printer_service.dart';

class PrinterSettingsView extends StatefulWidget {
  const PrinterSettingsView({super.key});

  @override
  State<PrinterSettingsView> createState() => _PrinterSettingsViewState();
}

class _PrinterSettingsViewState extends State<PrinterSettingsView> {
  final _printer = PrinterService();
  bool _loading = true;
  bool _bluetoothOn = false;
  bool _connecting = false;
  List<PrinterDevice> _devices = [];

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    setState(() => _loading = true);
    try {
      _bluetoothOn = await _printer.isBluetoothEnabled();
      if (_bluetoothOn) {
        _devices = await _printer.pairedDevices();
      } else {
        _devices = [];
      }
    } catch (_) {
      _bluetoothOn = false;
      _devices = [];
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _connect(PrinterDevice device) async {
    setState(() => _connecting = true);
    final ok = await _printer.connect(device.macAddress, name: device.name);
    if (mounted) {
      setState(() => _connecting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(ok ? '${device.name} ga ulandi' : 'Ulanib bo\'lmadi'),
          backgroundColor: ok ? Colors.green : Colors.red,
        ),
      );
    }
  }

  Future<void> _forget() async {
    await _printer.forget();
    if (mounted) setState(() {});
  }

  Future<void> _testPrint() async {
    final ok = await _printer.printReceipt(
      companyName: 'ERP',
      saleNumber: 'TEST-0001',
      date: DateTime.now(),
      items: [
        ReceiptItem(name: 'Test mahsulot', quantity: 1, unit: 'dona', unitPrice: 10000, total: 10000),
      ],
      totalUzs: 10000,
      paymentLabel: 'Naqd',
    );
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(ok ? 'Test chek yuborildi' : 'Chek chiqmadi. Printerga ulanganini tekshiring'),
          backgroundColor: ok ? Colors.green : Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Chek printer', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _refresh),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (!_bluetoothOn)
                  Card(
                    color: theme.colorScheme.errorContainer,
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Icon(Icons.bluetooth_disabled, color: theme.colorScheme.onErrorContainer),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Bluetooth o\'chirilgan. Telefon sozlamalaridan yoqing va printerni juftlashtiring.',
                              style: TextStyle(color: theme.colorScheme.onErrorContainer),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                if (_printer.hasSavedPrinter)
                  Card(
                    color: theme.colorScheme.primaryContainer,
                    child: ListTile(
                      leading: const Icon(Icons.print),
                      title: Text(_printer.savedName ?? 'Saqlangan printer', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
                      subtitle: Text(_printer.savedMac ?? ''),
                      trailing: IconButton(
                        icon: const Icon(Icons.link_off),
                        tooltip: 'Ulanishni unutish',
                        onPressed: _forget,
                      ),
                    ),
                  ),
                const SizedBox(height: 12),
                Text('Juftlashtirilgan qurilmalar', style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 8),
                if (_bluetoothOn && _devices.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: Text(
                        'Juftlashtirilgan qurilma topilmadi.\nAvval telefon Bluetooth sozlamalaridan printerni juftlashtiring.',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.outfit(color: Colors.grey),
                      ),
                    ),
                  ),
                ..._devices.map((d) => Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: const Icon(Icons.bluetooth),
                        title: Text(d.name.isEmpty ? 'Noma\'lum qurilma' : d.name),
                        subtitle: Text(d.macAddress),
                        trailing: _connecting
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                            : ElevatedButton(
                                onPressed: () => _connect(d),
                                child: const Text('Ulanish'),
                              ),
                      ),
                    )),
                const SizedBox(height: 16),
                if (_printer.hasSavedPrinter)
                  OutlinedButton.icon(
                    onPressed: _testPrint,
                    icon: const Icon(Icons.print_outlined),
                    label: const Text('Test chek chiqarish'),
                  ),
              ],
            ),
    );
  }
}
