import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class SyncService {
  static final SyncService _instance = SyncService._internal();
  factory SyncService() => _instance;
  SyncService._internal();

  final ApiService _apiService = ApiService();

  Future<void> queueOfflineSale(Map<String, dynamic> sale) async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> queue = prefs.getStringList('offline_sales_queue') ?? [];
    final withKey = {...sale, '_idempotencyKey': sale['_idempotencyKey'] ?? newIdempotencyKey()};
    queue.add(jsonEncode(withKey));
    await prefs.setStringList('offline_sales_queue', queue);
  }

  Future<int> getPendingSalesCount() async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> queue = prefs.getStringList('offline_sales_queue') ?? [];
    return queue.length;
  }

  Future<bool> syncPendingSales() async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> queue = prefs.getStringList('offline_sales_queue') ?? [];
    if (queue.isEmpty) return true;

    final List<String> failedQueue = [];
    bool allSuccess = true;

    for (final saleStr in queue) {
      try {
        final saleData = Map<String, dynamic>.from(jsonDecode(saleStr));
        final idempotencyKey = saleData.remove('_idempotencyKey') as String?;
        final res = await _apiService.postIdempotent('/sales', saleData, idempotencyKey: idempotencyKey);
        if (res.statusCode != 200 && res.statusCode != 201) {
          failedQueue.add(saleStr);
          allSuccess = false;
        }
      } catch (e) {
        failedQueue.add(saleStr);
        allSuccess = false;
      }
    }

    await prefs.setStringList('offline_sales_queue', failedQueue);
    return allSuccess;
  }
}
