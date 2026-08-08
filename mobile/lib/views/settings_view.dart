import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class SettingsView extends StatefulWidget {
  const SettingsView({super.key});

  @override
  State<SettingsView> createState() => _SettingsViewState();
}

class _SettingsViewState extends State<SettingsView> {
  final _api = ApiService();
  Map<String, dynamic> _user = {};
  bool _loading = true;

  final _oldPassCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  bool _obscureOld = true;
  bool _obscureNew = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _oldPassCtrl.dispose();
    _newPassCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get('/auth/me');
      if (mounted) {
        setState(() {
          _user = res.data ?? {};
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _changePassword() async {
    if (_oldPassCtrl.text.isEmpty || _newPassCtrl.text.isEmpty) return;
    try {
      await _api.post('/auth/change-password', {
        'oldPassword': _oldPassCtrl.text,
        'newPassword': _newPassCtrl.text,
      });
      _oldPassCtrl.clear();
      _newPassCtrl.clear();
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Parol muvaffaqiyatli o\'zgartirildi!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Xatolik: ${e.toString()}')),
      );
    }
  }

  void _showChangePasswordDialog() {
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: Text('Parol O\'zgartirish', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _oldPassCtrl,
                obscureText: _obscureOld,
                decoration: InputDecoration(
                  labelText: 'Eski parol',
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: Icon(_obscureOld ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setDialogState(() => _obscureOld = !_obscureOld),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _newPassCtrl,
                obscureText: _obscureNew,
                decoration: InputDecoration(
                  labelText: 'Yangi parol',
                  border: const OutlineInputBorder(),
                  suffixIcon: IconButton(
                    icon: Icon(_obscureNew ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setDialogState(() => _obscureNew = !_obscureNew),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Bekor')),
            ElevatedButton(onPressed: _changePassword, child: const Text('O\'zgartirish')),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final firstName = _user['firstName'] ?? '';
    final lastName = _user['lastName'] ?? '';
    final email = _user['email'] ?? '';
    final role = _user['role']?['name'] ?? _user['roleName'] ?? '';

    return Scaffold(
      appBar: AppBar(
        title: Text('Sozlamalar', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              children: [
                // Profile Card
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [theme.colorScheme.primary, theme.colorScheme.secondary],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 32,
                        backgroundColor: Colors.white24,
                        child: Text(
                          firstName.isNotEmpty ? firstName[0].toUpperCase() : 'U',
                          style: const TextStyle(fontSize: 28, color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '$firstName $lastName',
                              style: GoogleFonts.outfit(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                            ),
                            Text(email, style: GoogleFonts.outfit(color: Colors.white70, fontSize: 13)),
                            if (role.isNotEmpty)
                              Container(
                                margin: const EdgeInsets.only(top: 6),
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                decoration: BoxDecoration(
                                  color: Colors.white24,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(role, style: GoogleFonts.outfit(color: Colors.white, fontSize: 12)),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Settings options
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text('Hisob', style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.primary,
                  )),
                ),
                const SizedBox(height: 8),
                Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.lock_outlined),
                        title: Text('Parol O\'zgartirish', style: GoogleFonts.outfit()),
                        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                        onTap: _showChangePasswordDialog,
                      ),
                      const Divider(height: 1, indent: 56),
                      ListTile(
                        leading: const Icon(Icons.refresh_outlined),
                        title: Text('Ma\'lumotlarni Yangilash', style: GoogleFonts.outfit()),
                        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                        onTap: _loadProfile,
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text('Ilova haqida', style: GoogleFonts.outfit(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.primary,
                  )),
                ),
                const SizedBox(height: 8),
                Card(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.info_outlined),
                        title: Text('Versiya', style: GoogleFonts.outfit()),
                        trailing: Text('1.0.0', style: GoogleFonts.outfit(color: theme.colorScheme.onSurfaceVariant)),
                      ),
                      const Divider(height: 1, indent: 56),
                      ListTile(
                        leading: const Icon(Icons.cloud_outlined),
                        title: Text('Server', style: GoogleFonts.outfit()),
                        trailing: Text('Render Cloud', style: GoogleFonts.outfit(
                          color: Colors.green,
                          fontSize: 13,
                        )),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
    );
  }
}
