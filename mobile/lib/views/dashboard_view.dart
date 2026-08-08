import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/sync_service.dart';
import 'pos_view.dart';
import 'products_view.dart';
import 'inventory_view.dart';
import 'inventory_receive_view.dart';
import 'customers_view.dart';
import 'reports_view.dart';
import 'suppliers_view.dart';
import 'expenses_view.dart';
import 'sales_history_view.dart';
import 'returns_view.dart';
import 'users_view.dart';
import 'currency_view.dart';
import 'settings_view.dart';
import 'login_view.dart';

class DashboardView extends StatefulWidget {
  const DashboardView({super.key});

  @override
  State<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<DashboardView> {
  final _apiService = ApiService();
  final _syncService = SyncService();

  bool _loading = true;
  int _pendingSyncCount = 0;
  Map<String, dynamic> _stats = {
    'todaySales': 0.0,
    'weeklySales': 0.0,
    'netProfit': 0.0,
    'customerDebt': 0.0,
  };

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _loading = true);
    final pending = await _syncService.getPendingSalesCount();
    setState(() => _pendingSyncCount = pending);

    try {
      final res = await _apiService.get('/analytics/dashboard/enterprise');
      if (res.statusCode == 200) {
        setState(() {
          _stats = res.data ?? {};
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _handleSync() async {
    final success = await _syncService.syncPendingSales();
    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Offline sotuvlar sinxronizatsiya qilindi!')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Sinxronizatsiyada ba\'zi xatoliklar yuz berdi')),
        );
      }
      _loadDashboardData();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Dashboard',
          style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
        ),
        actions: [
          if (_pendingSyncCount > 0)
            IconButton(
              icon: Badge(
                label: Text('$_pendingSyncCount'),
                child: const Icon(Icons.sync_problem),
              ),
              onPressed: _handleSync,
            )
          else
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _loadDashboardData,
            ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            UserAccountsDrawerHeader(
              currentAccountPicture: CircleAvatar(
                backgroundColor: theme.colorScheme.primaryContainer,
                child: Icon(Icons.person, color: theme.colorScheme.onPrimaryContainer),
              ),
              accountName: Text('ERP Manager', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
              accountEmail: const Text('admin@erp.uz'),
            ),
            ListTile(
              leading: const Icon(Icons.dashboard_outlined),
              title: Text('Dashboard', style: GoogleFonts.outfit()),
              selected: true,
              onTap: () => Navigator.of(context).pop(),
            ),

            // --- SOTUV ---
            Padding(
              padding: const EdgeInsets.only(left: 16, top: 12, bottom: 2),
              child: Text('SOTUV', style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey)),
            ),
            ListTile(
              leading: const Icon(Icons.point_of_sale_outlined),
              title: Text('Kassa (POS)', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PosView()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.history_outlined),
              title: Text('Sotuvlar Tarixi', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SalesHistoryView()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.assignment_return_outlined),
              title: Text('Vozvratlar (Qaytarish)', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ReturnsView()));
              },
            ),

            // --- OMBOR ---
            Padding(
              padding: const EdgeInsets.only(left: 16, top: 12, bottom: 2),
              child: Text('OMBOR', style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey)),
            ),
            ListTile(
              leading: const Icon(Icons.inventory_2_outlined),
              title: Text('Mahsulotlar', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProductsView()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.add_shopping_cart),
              title: Text('Mahsulot Kirim Qilish', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const InventoryReceiveView()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.warehouse_outlined),
              title: Text('Ombor (Stock)', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const InventoryView()));
              },
            ),

            // --- MOLIYA ---
            Padding(
              padding: const EdgeInsets.only(left: 16, top: 12, bottom: 2),
              child: Text('MOLIYA', style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey)),
            ),
            ListTile(
              leading: const Icon(Icons.receipt_long_outlined),
              title: Text('Xarajatlar', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ExpensesView()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.currency_exchange),
              title: Text('Valyuta Kurslari', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CurrencyView()));
              },
            ),

            // --- HAMKORLAR ---
            Padding(
              padding: const EdgeInsets.only(left: 16, top: 12, bottom: 2),
              child: Text('HAMKORLAR', style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey)),
            ),
            ListTile(
              leading: const Icon(Icons.people_alt_outlined),
              title: Text('Mijozlar', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CustomersView()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.store_outlined),
              title: Text('Ta\'minotchilar', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SuppliersView()));
              },
            ),

            // --- TIZIM ---
            Padding(
              padding: const EdgeInsets.only(left: 16, top: 12, bottom: 2),
              child: Text('TIZIM VA HISOBOT', style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey)),
            ),
            ListTile(
              leading: const Icon(Icons.description_outlined),
              title: Text('Hisobotlar', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ReportsView()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.badge_outlined),
              title: Text('Xodimlar va Boshqaruv', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const UsersView()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings_outlined),
              title: Text('Sozlamalar', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsView()));
              },
            ),

            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: Text('Chiqish', style: GoogleFonts.outfit(color: Colors.red)),
              onTap: () async {
                await _apiService.clearSession();
                if (context.mounted) {
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(builder: (_) => const LoginView()),
                  );
                }
              },
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadDashboardData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Offline Alert
                    if (_pendingSyncCount > 0)
                      Card(
                        color: theme.colorScheme.secondaryContainer,
                        margin: const EdgeInsets.only(bottom: 16),
                        child: ListTile(
                          leading: const Icon(Icons.wifi_off_outlined, color: Colors.orange),
                          title: const Text('Oflayn tranzaksiyalar mavjud'),
                          subtitle: Text('$_pendingSyncCount ta sotuv zaxirada kutilmoqda.'),
                          trailing: ElevatedButton(
                            onPressed: _handleSync,
                            child: const Text('Sinxronlash'),
                          ),
                        ),
                      ),

                    // Grid stats
                    GridView.count(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      children: [
                        _buildStatCard(
                          context,
                          'Bugungi Sotuv',
                          '${_stats['todaySales'] ?? 0.0} UZS',
                          Icons.trending_up,
                          Colors.blue,
                        ),
                        _buildStatCard(
                          context,
                          'Haftalik Sotuv',
                          '${_stats['weeklySales'] ?? 0.0} UZS',
                          Icons.calendar_view_week,
                          Colors.green,
                        ),
                        _buildStatCard(
                          context,
                          'Sof Foyda',
                          '${_stats['netProfit'] ?? 0.0} UZS',
                          Icons.attach_money,
                          Colors.purple,
                        ),
                        _buildStatCard(
                          context,
                          'Mijozlar Qarzi',
                          '${_stats['customerDebt'] ?? 0.0} UZS',
                          Icons.assignment_late,
                          Colors.red,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Sales Chart Card
                    Card(
                      elevation: 2,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Sotuvlar Grafigi',
                              style: GoogleFonts.outfit(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 24),
                            SizedBox(
                              height: 200,
                              child: LineChart(
                                LineChartData(
                                  gridData: const FlGridData(show: false),
                                  titlesData: const FlTitlesData(
                                    leftTitles: AxisTitles(
                                      sideTitles: SideTitles(showTitles: false),
                                    ),
                                    topTitles: AxisTitles(
                                      sideTitles: SideTitles(showTitles: false),
                                    ),
                                  ),
                                  borderData: FlBorderData(show: false),
                                  lineBarsData: [
                                    LineChartBarData(
                                      spots: const [
                                        FlSpot(0, 3),
                                        FlSpot(1, 4),
                                        FlSpot(2, 2.5),
                                        FlSpot(3, 5),
                                        FlSpot(4, 3.8),
                                        FlSpot(5, 6),
                                      ],
                                      isCurved: true,
                                      color: theme.colorScheme.primary,
                                      barWidth: 4,
                                      belowBarData: BarAreaData(
                                        show: true,
                                        color: theme.colorScheme.primary.withOpacity(0.15),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatCard(
    BuildContext context,
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    final theme = Theme.of(context);
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            CircleAvatar(
              backgroundColor: color.withOpacity(0.15),
              child: Icon(icon, color: color),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.outfit(
                    fontSize: 14,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 4),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    value,
                    style: GoogleFonts.outfit(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
