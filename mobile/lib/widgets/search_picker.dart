import 'package:flutter/material.dart';
import '../services/api_service.dart';

/// Generic search-and-pick dialog. Fetches `GET endpoint?q=<query>` and expects
/// a JSON body of shape `{ "data": [...] }`. Returns the selected item map, or
/// null if the user cancelled. If [items] is provided, searches that static
/// list locally instead of hitting the network.
Future<Map<String, dynamic>?> showSearchPicker({
  required BuildContext context,
  required String title,
  String? endpoint,
  List<dynamic>? items,
  required String Function(Map<String, dynamic>) titleBuilder,
  String Function(Map<String, dynamic>)? subtitleBuilder,
}) {
  final apiService = ApiService();
  return showDialog<Map<String, dynamic>>(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setDialogState) {
        List<dynamic> results = items ?? [];
        bool loading = false;

        Future<void> search(String q) async {
          if (endpoint == null) {
            setDialogState(() {
              results = (items ?? [])
                  .where((e) => titleBuilder(e).toLowerCase().contains(q.toLowerCase()))
                  .toList();
            });
            return;
          }
          setDialogState(() => loading = true);
          try {
            final res = await apiService.get('$endpoint?q=$q');
            setDialogState(() {
              results = res.data['data'] ?? [];
              loading = false;
            });
          } catch (_) {
            setDialogState(() => loading = false);
          }
        }

        return AlertDialog(
          title: Text(title),
          content: SizedBox(
            width: double.maxFinite,
            height: 360,
            child: Column(
              children: [
                TextField(
                  autofocus: true,
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.search),
                    hintText: 'Qidirish...',
                  ),
                  onChanged: search,
                ),
                const SizedBox(height: 8),
                if (loading) const LinearProgressIndicator(),
                Expanded(
                  child: results.isEmpty
                      ? const Center(child: Text('Natija topilmadi'))
                      : ListView.builder(
                          itemCount: results.length,
                          itemBuilder: (context, idx) {
                            final item = Map<String, dynamic>.from(results[idx]);
                            return ListTile(
                              title: Text(titleBuilder(item)),
                              subtitle: subtitleBuilder != null ? Text(subtitleBuilder(item)) : null,
                              onTap: () => Navigator.of(ctx).pop(item),
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(), child: const Text('Bekor qilish')),
          ],
        );
      },
    ),
  );
}
