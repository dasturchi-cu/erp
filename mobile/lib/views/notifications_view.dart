import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class NotificationsView extends StatefulWidget {
  const NotificationsView({super.key});

  @override
  State<NotificationsView> createState() => _NotificationsViewState();
}

class _NotificationsViewState extends State<NotificationsView> {
  final _api = ApiService();
  bool _loading = true;
  List<dynamic> _notifications = [];
  bool _unreadOnly = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final query = _unreadOnly ? '?read=false&limit=100' : '?limit=100';
      final res = await _api.get('/notifications$query');
      final raw = res.data;
      if (mounted) {
        setState(() {
          _notifications = raw is Map && raw['data'] is List ? raw['data'] as List : (raw is List ? raw : []);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Yuklanmadi: ${ApiService.parseError(e)}')),
        );
      }
    }
  }

  Future<void> _markAllRead() async {
    try {
      await _api.post('/notifications/mark-all-read', {});
      _load();
    } catch (_) {}
  }

  Future<void> _toggleRead(Map<String, dynamic> n) async {
    final isRead = n['read'] == true;
    try {
      await _api.patch('/notifications/${n['id']}/${isRead ? 'unread' : 'read'}', {});
      setState(() => n['read'] = !isRead);
    } catch (_) {}
  }

  Future<void> _delete(Map<String, dynamic> n) async {
    try {
      await _api.delete('/notifications/${n['id']}');
      if (mounted) setState(() => _notifications.remove(n));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('O\'chirib bo\'lmadi: ${ApiService.parseError(e)}')),
        );
      }
    }
  }

  IconData _iconFor(String? type) {
    switch (type) {
      case 'warning':
        return Icons.warning_amber_rounded;
      case 'error':
        return Icons.error_outline;
      case 'success':
        return Icons.check_circle_outline;
      default:
        return Icons.info_outline;
    }
  }

  Color _colorFor(String? type) {
    switch (type) {
      case 'warning':
        return Colors.orange;
      case 'error':
        return Colors.red;
      case 'success':
        return Colors.green;
      default:
        return Colors.blue;
    }
  }

  String _timeAgo(String? iso) {
    if (iso == null) return '';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'hozirgina';
    if (diff.inMinutes < 60) return '${diff.inMinutes} daqiqa oldin';
    if (diff.inHours < 24) return '${diff.inHours} soat oldin';
    return '${diff.inDays} kun oldin';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text('Bildirishnomalar', style: GoogleFonts.outfit(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(
            icon: Icon(_unreadOnly ? Icons.filter_alt : Icons.filter_alt_outlined),
            tooltip: 'Faqat o\'qilmaganlar',
            onPressed: () {
              setState(() => _unreadOnly = !_unreadOnly);
              _load();
            },
          ),
          IconButton(
            icon: const Icon(Icons.done_all),
            tooltip: 'Hammasini o\'qilgan deb belgilash',
            onPressed: _markAllRead,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: _notifications.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.notifications_none, size: 64, color: theme.colorScheme.outline),
                          const SizedBox(height: 12),
                          Text('Bildirishnomalar yo\'q', style: GoogleFonts.outfit(fontSize: 16)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: _notifications.length,
                      itemBuilder: (ctx, i) {
                        final n = _notifications[i] as Map<String, dynamic>;
                        final isRead = n['read'] == true;
                        return Dismissible(
                          key: ValueKey(n['id']),
                          direction: DismissDirection.endToStart,
                          background: Container(
                            color: Colors.red,
                            alignment: Alignment.centerRight,
                            padding: const EdgeInsets.only(right: 20),
                            child: const Icon(Icons.delete_outline, color: Colors.white),
                          ),
                          confirmDismiss: (_) async => true,
                          onDismissed: (_) => _delete(n),
                          child: ListTile(
                            tileColor: isRead ? null : theme.colorScheme.primaryContainer.withValues(alpha: 0.25),
                            leading: CircleAvatar(
                              backgroundColor: _colorFor(n['type'] as String?).withValues(alpha: 0.15),
                              child: Icon(_iconFor(n['type'] as String?), color: _colorFor(n['type'] as String?)),
                            ),
                            title: Text(
                              (n['title'] ?? '').toString(),
                              style: GoogleFonts.outfit(fontWeight: isRead ? FontWeight.normal : FontWeight.bold),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text((n['body'] ?? '').toString(), style: GoogleFonts.outfit(fontSize: 13)),
                                const SizedBox(height: 2),
                                Text(_timeAgo(n['createdAt'] as String?), style: GoogleFonts.outfit(fontSize: 11, color: theme.colorScheme.onSurfaceVariant)),
                              ],
                            ),
                            isThreeLine: true,
                            trailing: IconButton(
                              icon: Icon(isRead ? Icons.mark_email_read_outlined : Icons.mark_email_unread, size: 20),
                              onPressed: () => _toggleRead(n),
                            ),
                            onTap: () => _toggleRead(n),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
