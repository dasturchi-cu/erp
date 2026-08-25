import 'package:flutter/material.dart';
import 'services/api_service.dart';
import 'theme/app_theme.dart';
import 'views/login_view.dart';
import 'views/dashboard_view.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final apiService = ApiService();
  try {
    await apiService.init().timeout(const Duration(seconds: 50));
  } catch (e) {
    // Timeout or initialization fallback so splash screen never hangs
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final apiService = ApiService();

    return MaterialApp(
      title: 'ERP Mobile',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.system,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      home: apiService.isAuthenticated ? const DashboardView() : const LoginView(),
    );
  }
}
