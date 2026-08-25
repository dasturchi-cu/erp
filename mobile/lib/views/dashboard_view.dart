import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../services/sync_service.dart';
import 'pos_view.dart';
import 'products_view.dart';
import 'inventory_view.dart';
import 'inventory_receive_view.dart';
import 'inventory_adjust_view.dart';
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
  String _userName = 'Admin';
  String _userEmail = 'admin@erp.uz';
  String _userRole = 'ADMIN';
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
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString('user_details');
      if (userJson != null) {
        final u = jsonDecode(userJson);
        setState(() {
          _userName = '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.trim();
          if (_userName.isEmpty) _userName = u['name'] ?? 'Foydalanuvchi';
          _userEmail = u['email'] ?? 'admin@erp.uz';
          _userRole = (u['role'] ?? 'ADMIN').toString().toUpperCase();
        });
      }
    } catch (_) {}

    try {
      final res = await _apiService.get('/analytics/dashboard/enterprise');
      if (res.statusCode == 200) {
        setState(() {
          _stats = res.data ?? {};
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        if (e is DioException && e.response?.statusCode == 401) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Sessiya muddati tugadi. Iltimos, qaytadan tizimga kiring.')),
          );
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const LoginView()),
          );
        }
      }
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

  String _formatStatValue(dynamic val) {
    if (val == null) return '0 UZS';
    double amount = 0.0;
    if (val is Map) {
      amount = double.tryParse(val['uzs']?.toString() ?? val['amount']?.toString() ?? '0') ?? 0.0;
    } else if (val is num) {
      amount = val.toDouble();
    } else {
      amount = double.tryParse(val.toString()) ?? 0.0;
    }

    final str = amount.abs().toStringAsFixed(0);
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) {
        buffer.write(' ');
      }
      buffer.write(str[i]);
    }
    return '${amount < 0 ? '-' : ''}${buffer.toString()} UZS';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.colorScheme.surface,
      appBar: AppBar(
        title: Text(
          'ERP Boshqaruv',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20),
        ),
        elevation: 0,
        actions: [
          if (_pendingSyncCount > 0)
            IconButton(
              icon: Badge(
                label: Text('$_pendingSyncCount'),
                child: const Icon(Icons.sync_problem, color: Colors.orange),
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
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [theme.colorScheme.primary, theme.colorScheme.secondary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              currentAccountPicture: const CircleAvatar(
                backgroundColor: Colors.white24,
                child: Icon(Icons.person, color: Colors.white, size: 36),
              ),
              accountName: Text(_userName, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18)),
              accountEmail: Text('$_userEmail • $_userRole', style: GoogleFonts.outfit(color: Colors.white70)),
            ),
            ListTile(
              leading: const Icon(Icons.dashboard_outlined),
              title: Text('Dashboard', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
              selected: true,
              onTap: () => Navigator.of(context).pop(),
            ),

            // --- SOTUV ---
            Padding(
              padding: const EdgeInsets.only(left: 16, top: 12, bottom: 2),
              child: Text('SOTUV', style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w700, color: theme.colorScheme.onSurfaceVariant)),
            ),
            ListTile(
              leading: const Icon(Icons.point_of_sale_outlined, color: Colors.indigo),
              title: Text('Kassa (POS)', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const PosView()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.history_outlined, color: Colors.blue),
              title: Text('Sotuvlar Tarixi', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SalesHistoryView()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.assignment_return_outlined, color: Colors.orange),
              title: Text('Vozvratlar (Qaytarish)', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ReturnsView()));
              },
            ),

            // --- OMBOR ---
            Padding(
              padding: const EdgeInsets.only(left: 16, top: 12, bottom: 2),
              child: Text('OMBOR', style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w700, color: theme.colorScheme.onSurfaceVariant)),
            ),
            ListTile(
              leading: const Icon(Icons.inventory_2_outlined, color: Colors.teal),
              title: Text('Mahsulotlar', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProductsView()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.add_shopping_cart, color: Colors.green),
              title: Text('Mahsulot Kirim Qilish', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const InventoryReceiveView()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.remove_shopping_cart_outlined, color: Colors.red),
              title: Text('Mahsulot Chiqim (Tuzatish)', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const InventoryAdjustView()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.warehouse_outlined, color: Colors.brown),
              title: Text('Ombor (Stock)', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const InventoryView()));
              },
            ),

            // --- MOLIYA ---
            Padding(
              padding: const EdgeInsets.only(left: 16, top: 12, bottom: 2),
              child: Text('MOLIYA', style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w700, color: theme.colorScheme.onSurfaceVariant)),
            ),
            ListTile(
              leading: const Icon(Icons.receipt_long_outlined, color: Colors.red),
              title: Text('Xarajatlar', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ExpensesView()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.currency_exchange, color: Colors.amber),
              title: Text('Valyuta Kurslari', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CurrencyView()));
              },
            ),

            // --- HAMKORLAR ---
            Padding(
              padding: const EdgeInsets.only(left: 16, top: 12, bottom: 2),
              child: Text('HAMKORLAR', style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w700, color: theme.colorScheme.onSurfaceVariant)),
            ),
            ListTile(
              leading: const Icon(Icons.people_alt_outlined, color: Colors.deepPurple),
              title: Text('Mijozlar', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const CustomersView()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.store_outlined, color: Colors.blueGrey),
              title: Text('Ta\'minotchilar', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SuppliersView()));
              },
            ),

            // --- TIZIM ---
            Padding(
              padding: const EdgeInsets.only(left: 16, top: 12, bottom: 2),
              child: Text('TIZIM VA HISOBOT', style: GoogleFonts.outfit(fontSize: 11, fontWeight: FontWeight.w700, color: theme.colorScheme.onSurfaceVariant)),
            ),
            ListTile(
              leading: const Icon(Icons.description_outlined, color: Colors.purple),
              title: Text('Hisobotlar', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ReportsView()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.badge_outlined, color: Colors.indigo),
              title: Text('Xodimlar va Boshqaruv', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const UsersView()));
              },
            ),
            ListTile(
              leading: const Icon(Icons.settings_outlined, color: Colors.grey),
              title: Text('Sozlamalar', style: GoogleFonts.outfit()),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(MaterialPageRoute(builder: (_) => const SettingsView()));
              },
            ),

            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: Text('Chiqish', style: GoogleFonts.outfit(color: Colors.red, fontWeight: FontWeight.w600)),
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
                    // Welcome Banner Card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [theme.colorScheme.primary, theme.colorScheme.tertiary],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: theme.colorScheme.primary.withOpacity(0.2),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          )
                        ],
                      ),
                      child: Row(
                        children: [
                          const CircleAvatar(
                            radius: 26,
                            backgroundColor: Colors.white24,
                            child: Icon(Icons.storefront, color: Colors.white, size: 30),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Xayrli kun! 👋',
                                  style: GoogleFonts.outfit(color: Colors.white70, fontSize: 13),
                                ),
                                Text(
                                  'ERP Enterprise Tizimi',
                                  style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white24,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.circle, color: Colors.greenAccent, size: 8),
                                SizedBox(width: 4),
                                Text('ONLINE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Offline Alert Banner
                    if (_pendingSyncCount > 0)
                      Card(
                        color: Colors.orange.shade50,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                          side: BorderSide(color: Colors.orange.shade300),
                        ),
                        margin: const EdgeInsets.only(bottom: 16),
                        child: ListTile(
                          leading: const Icon(Icons.wifi_off_outlined, color: Colors.orange, size: 28),
                          title: const Text('Oflayn sotuvlar zaxirada', style: TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Text('$_pendingSyncCount ta sotuv internetga ulanishni kutmoqda.'),
                          trailing: ElevatedButton(
                            onPressed: _handleSync,
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
                            child: const Text('Sinxronlash'),
                          ),
                        ),
                      ),

                    // Quick Actions Bar
                    Text(
                      'Tezkor Amallar',
                      style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: theme.colorScheme.onSurface),
                    ),
                    const SizedBox(height: 10),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildQuickActionButton(
                            context,
                            'Kassa POS',
                            Icons.point_of_sale,
                            Colors.indigo,
                            () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PosView())),
                          ),
                          _buildQuickActionButton(
                            context,
                            'Kirim Qilish',
                            Icons.add_shopping_cart,
                            Colors.green,
                            () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InventoryReceiveView())),
                          ),
                          _buildQuickActionButton(
                            context,
                            'Mijozlar',
                            Icons.person_add_alt_1,
                            Colors.deepPurple,
                            () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CustomersView())),
                          ),
                          _buildQuickActionButton(
                            context,
                            'Vozvrat',
                            Icons.assignment_return,
                            Colors.orange,
                            () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ReturnsView())),
                          ),
                          _buildQuickActionButton(
                            context,
                            'Xarajat',
                            Icons.receipt_long,
                            Colors.red,
                            () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ExpensesView())),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Grid stats
                    Text(
                      'Moliyaviy Ko\'rsatkichlar',
                      style: GoogleFonts.outfit(fontSize: 15, fontWeight: FontWeight.bold, color: theme.colorScheme.onSurface),
                    ),
                    const SizedBox(height: 10),
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
                          _formatStatValue(_stats['todaySales']),
                          Icons.trending_up,
                          const Color(0xFF2563EB),
                          isDark ? const Color(0xFF1E293B) : const Color(0xFFEFF6FF),
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SalesHistoryView())),
                        ),
                        _buildStatCard(
                          context,
                          'Haftalik Sotuv',
                          _formatStatValue(_stats['weeklySales']),
                          Icons.calendar_view_week,
                          const Color(0xFF059669),
                          isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5),
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportsView())),
                        ),
                        _buildStatCard(
                          context,
                          'Sof Foyda',
                          _formatStatValue(_stats['netProfit']),
                          Icons.attach_money,
                          const Color(0xFF7C3AED),
                          isDark ? const Color(0xFF3B0764) : const Color(0xFFF5F3FF),
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ReportsView())),
                        ),
                        _buildStatCard(
                          context,
                          'Mijozlar Qarzi',
                          _formatStatValue(_stats['customerDebt']),
                          Icons.assignment_late,
                          const Color(0xFFDC2626),
                          isDark ? const Color(0xFF450A0A) : const Color(0xFFFEF2F2),
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CustomersView())),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Sales Chart Card
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Sotuvlar Dinamikasi',
                                  style: GoogleFonts.outfit(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: theme.colorScheme.primaryContainer,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text('Haftalik', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: theme.colorScheme.onPrimaryContainer)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),
                            SizedBox(
                              height: 180,
                              child: LineChart(
                                LineChartData(
                                  gridData: const FlGridData(show: false),
                                  titlesData: const FlTitlesData(
                                    leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                    topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                                    rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
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
                                      isStrokeCapRound: true,
                                      dotData: const FlDotData(show: true),
                                      belowBarData: BarAreaData(
                                        show: true,
                                        color: theme.colorScheme.primary.withOpacity(0.12),
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

  Widget _buildQuickActionButton(
    BuildContext context,
    String label,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: Material(
        color: theme.colorScheme.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(12),
        elevation: 1,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 14,
                  backgroundColor: color.withOpacity(0.15),
                  child: Icon(icon, color: color, size: 16),
                ),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ],
            ),
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
    Color accentColor,
    Color bgColor, {
    VoidCallback? onTap,
  }) {
    final theme = Theme.of(context);
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(14.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: bgColor,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(icon, color: accentColor, size: 22),
                  ),
                  Icon(Icons.arrow_forward_ios, size: 12, color: theme.colorScheme.onSurfaceVariant),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      color: theme.colorScheme.onSurfaceVariant,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      value,
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
