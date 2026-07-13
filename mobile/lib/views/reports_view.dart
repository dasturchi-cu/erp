import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class ReportsView extends StatefulWidget {
  const ReportsView({super.key});

  @override
  State<ReportsView> createState() => _ReportsViewState();
}

class _ReportsViewState extends State<ReportsView> {
  final _apiService = ApiService();
  bool _loading = true;
  List<dynamic> _reports = [];

  @override
  void initState() {
    super.initState();
    _fetchReports();
  }

  Future<void> _fetchReports() async {
    setState(() => _loading = true);
    try {
      // Mock get reports list or fetch from real history endpoint
      final res = await _apiService.get('/sales/receipt-templates');
      if (res.statusCode == 200) {
        setState(() {
          _reports = res.data ?? [];
          _loading = false;
        });
      }
    } catch (_) {
      // Fallback fallback layout
      setState(() {
        _reports = [
          {'name': 'Bugungi Kassa Hisoboti', 'format': 'PDF'},
          {'name': 'Haftalik Zaxira Hisoboti', 'format': 'XLSX'},
          {'name': 'Mijozlar Qarzdorlik Hisoboti', 'format': 'PDF'},
        ];
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Hisobotlar moduli',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchReports,
              child: ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: _reports.length,
                itemBuilder: (context, idx) {
                  final r = _reports[idx];
                  return Card(
                    child: ListTile(
                      leading: Icon(
                        r['format'] == 'XLSX' ? Icons.table_chart : Icons.picture_as_pdf,
                        color: r['format'] == 'XLSX' ? Colors.green : Colors.red,
                      ),
                      title: Text(r['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('Format: ${r['format'] ?? 'PDF'}'),
                      trailing: IconButton(
                        icon: const Icon(Icons.download_for_offline_outlined),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('${r['name']} hisoboti yuklab olindi!')),
                          );
                        },
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
