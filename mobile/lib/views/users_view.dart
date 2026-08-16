import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class UsersView extends StatefulWidget {
  const UsersView({super.key});

  @override
  State<UsersView> createState() => _UsersViewState();
}

class _UsersViewState extends State<UsersView> {
  final _api = ApiService();
  bool _loading = true;
  List<dynamic> _users = [];
  List<dynamic> _roles = [];

  final _emailCtrl = TextEditingController();
  final _firstCtrl = TextEditingController();
  final _lastCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  String? _selectedRoleId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _firstCtrl.dispose();
    _lastCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await _api.get('/admin/users');
      final rRes = await _api.get('/admin/roles');
      if (mounted) {
        final raw = res.data;
        final rRaw = rRes.data;
        setState(() {
          _users = raw is Map && raw.containsKey('data') ? (raw['data'] is List ? raw['data'] : []) : (raw is List ? raw : []);
          _roles = rRaw is Map && rRaw.containsKey('data') ? (rRaw['data'] is List ? rRaw['data'] : []) : (rRaw is List ? rRaw : []);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showAddUserDialog() {
    _emailCtrl.clear();
    _firstCtrl.clear();
    _lastCtrl.clear();
    _passCtrl.text = 'Admin123!';
    _selectedRoleId = _roles.isNotEmpty ? _roles.first['id'] as String? : null;

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
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Yangi Xodim Qo\'shish', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                TextField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email Pochta *',
                    prefixIcon: Icon(Icons.email_outlined),
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _firstCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Ismi *',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _lastCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Familiyasi *',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _passCtrl,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Boshlang\'ich Parol *',
                    prefixIcon: Icon(Icons.lock_outlined),
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                if (_roles.isNotEmpty)
                  DropdownButtonFormField<String>(
                    value: _selectedRoleId,
                    decoration: const InputDecoration(
                      labelText: 'Xodim Roli *',
                      border: OutlineInputBorder(),
                    ),
                    items: _roles.map((r) => DropdownMenuItem<String>(
                      value: r['id'] as String,
                      child: Text(r['name'] ?? 'Rol'),
                    )).toList(),
                    onChanged: (val) => setModalState(() => _selectedRoleId = val),
                  ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () async {
                    final email = _emailCtrl.text.trim();
                    final first = _firstCtrl.text.trim();
                    final last = _lastCtrl.text.trim();
                    final pass = _passCtrl.text.trim();

                    if (email.isEmpty || first.isEmpty || pass.isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Barcha majburiy kataklarni to\'ldiring!')),
                      );
                      return;
                    }
                    try {
                      final res = await _api.post('/admin/users', {
                        'email': email,
                        'firstName': first,
                        'lastName': last,
                        'password': pass,
                        if (_selectedRoleId != null) 'roleId': _selectedRoleId,
                      });
                      if (res.statusCode == 200 || res.statusCode == 201) {
                        if (mounted) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Xodim muvaffaqiyatli qo\'shildi!')),
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
                  child: Text('Xodimni Saqlash', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _toggleUserStatus(Map<String, dynamic> u) {
    final currentStatus = (u['status'] ?? 'ACTIVE').toString().toUpperCase();
    final newStatus = currentStatus == 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    final actionName = newStatus == 'BLOCKED' ? 'bloklash' : 'faollashtirish';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Xodimni $actionName'),
        content: Text('Haqiqatan ham "${u['firstName']} ${u['lastName']}" hisobini $actionName istaysizmi?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Bekor qilish'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: newStatus == 'BLOCKED' ? Colors.red : Colors.green,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                final res = await _api.patch('/admin/users/${u['id']}/status', {
                  'status': newStatus,
                });
                if (res.statusCode == 200 || res.statusCode == 204) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Xodim holati $newStatus ga o\'zgartirildi!')),
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
            child: Text(newStatus == 'BLOCKED' ? 'Bloklash' : 'Faollashtirish'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Xodimlar va Foydalanuvchilar', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddUserDialog,
        icon: const Icon(Icons.person_add_alt_1),
        label: Text('Xodim Qo\'shish', style: GoogleFonts.outfit()),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _users.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.people_outline, size: 64, color: theme.colorScheme.outline),
                          const SizedBox(height: 12),
                          Text('Xodimlar topilmadi', style: GoogleFonts.outfit(fontSize: 16)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _users.length,
                      itemBuilder: (ctx, i) {
                        final u = _users[i];
                        final name = '${u['firstName'] ?? ''} ${u['lastName'] ?? ''}'.trim();
                        final status = (u['status'] ?? 'ACTIVE').toString().toUpperCase();
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: theme.colorScheme.primaryContainer,
                              child: Text(
                                name.isNotEmpty ? name[0].toUpperCase() : 'U',
                                style: TextStyle(color: theme.colorScheme.onPrimaryContainer, fontWeight: FontWeight.bold),
                              ),
                            ),
                            title: Text(name.isNotEmpty ? name : (u['email'] ?? ''), style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                            subtitle: Text(u['email'] ?? ''),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Chip(
                                  label: Text(status, style: const TextStyle(fontSize: 11)),
                                  backgroundColor: status == 'ACTIVE' ? Colors.green.withValues(alpha: 0.15) : Colors.red.withValues(alpha: 0.15),
                                ),
                                const SizedBox(width: 4),
                                PopupMenuButton<String>(
                                  icon: const Icon(Icons.more_vert),
                                  onSelected: (val) {
                                    if (val == 'toggle') {
                                      _toggleUserStatus(u);
                                    }
                                  },
                                  itemBuilder: (ctx) => [
                                    PopupMenuItem(
                                      value: 'toggle',
                                      child: Row(
                                        children: [
                                          Icon(
                                            status == 'ACTIVE' ? Icons.block : Icons.check_circle,
                                            size: 18,
                                            color: status == 'ACTIVE' ? Colors.red : Colors.green,
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            status == 'ACTIVE' ? 'Bloklash' : 'Faollashtirish',
                                            style: TextStyle(color: status == 'ACTIVE' ? Colors.red : Colors.green),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
