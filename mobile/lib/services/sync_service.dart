import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

/// One offline-queued sale as shown in the sync UI.
class PendingSale {
  final String idempotencyKey;
  final Map<String, dynamic> payload;
  final String? userId;
  final String? companyId;
  final String? queuedAt;

  /// Set when the server refused the sale for a business reason (validation,
  /// stock, price…). Such a sale is not retried automatically — retrying the
  /// same payload would only fail the same way — until the user retries or
  /// discards it.
  final String? lastError;
  final int? lastStatus;
  final bool failed;

  /// False when the sale was queued under another user or company. It is
  /// kept (never posted under the current session) and only shown.
  final bool ownedByCurrentSession;

  PendingSale({
    required this.idempotencyKey,
    required this.payload,
    required this.userId,
    required this.companyId,
    required this.queuedAt,
    required this.lastError,
    required this.lastStatus,
    required this.failed,
    required this.ownedByCurrentSession,
  });

  double get totalUzs {
    final items = payload['lineItems'];
    if (items is! List) return 0;
    double sum = 0;
    for (final item in items) {
      if (item is! Map) continue;
      final qty = double.tryParse(item['quantity']?.toString() ?? '') ?? 0;
      final price = double.tryParse(item['unitPriceUzs']?.toString() ?? '') ?? 0;
      sum += qty * price;
    }
    return sum;
  }
}

class SyncResult {
  final int synced;
  final int failed;
  final int remaining;
  SyncResult({
    required this.synced,
    required this.failed,
    required this.remaining,
  });

  bool get allSuccess => failed == 0 && remaining == 0;
}

class SyncService {
  static final SyncService _instance = SyncService._internal();
  factory SyncService() => _instance;
  SyncService._internal();

  final ApiService _apiService = ApiService();

  static const _queueKey = 'offline_sales_queue';

  // The sync currently running, if any. A second caller (double tap, a
  // dashboard refresh) joins it instead of posting the same entries twice.
  static Future<SyncResult>? _inFlight;

  /// Queues a sale as `{idempotencyKey, payload, userId, companyId}`. The key
  /// is the one the failed online attempt used and is sent unchanged on every
  /// sync retry, so a sale that actually reached the server is never recorded
  /// twice. The owner fields keep it from ever being posted under a
  /// different login.
  Future<void> queueOfflineSale(
    Map<String, dynamic> sale,
    String idempotencyKey,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> queue = prefs.getStringList(_queueKey) ?? [];
    queue.add(
      jsonEncode({
        'idempotencyKey': idempotencyKey,
        'payload': sale,
        'userId': _apiService.userId,
        'companyId': _apiService.companyId,
        'queuedAt': DateTime.now().toUtc().toIso8601String(),
      }),
    );
    await prefs.setStringList(_queueKey, queue);
  }

  /// Every queued sale, including ones that belong to another session or
  /// that the server refused.
  Future<List<PendingSale>> getPendingSales() async {
    final stored = await _loadQueue();
    final result = <PendingSale>[];
    for (final entryStr in stored) {
      final entry = _decode(entryStr);
      if (entry == null) continue;
      result.add(
        PendingSale(
          idempotencyKey: entry['idempotencyKey'] as String,
          payload: entry['payload'] is Map
              ? Map<String, dynamic>.from(entry['payload'] as Map)
              : <String, dynamic>{},
          userId: entry['userId']?.toString(),
          companyId: entry['companyId']?.toString(),
          queuedAt: entry['queuedAt']?.toString(),
          lastError: entry['lastError']?.toString(),
          lastStatus: (entry['lastStatus'] as num?)?.toInt(),
          failed: entry['failed'] == true,
          ownedByCurrentSession: _isOwnedByCurrentSession(entry),
        ),
      );
    }
    return result;
  }

  /// Sales the server refused — they need the user's attention.
  Future<List<PendingSale>> getFailedSales() async {
    final all = await getPendingSales();
    return all.where((s) => s.failed).toList();
  }

  Future<int> getPendingSalesCount() async {
    final prefs = await SharedPreferences.getInstance();
    final List<String> queue = prefs.getStringList(_queueKey) ?? [];
    return queue.length;
  }

  /// Removes one queued sale for good (the user decided not to send it).
  Future<void> discardSale(String idempotencyKey) async {
    final prefs = await SharedPreferences.getInstance();
    final stored = await _loadQueue();
    final kept = stored.where((entryStr) {
      final entry = _decode(entryStr);
      return entry == null || entry['idempotencyKey'] != idempotencyKey;
    }).toList();
    await prefs.setStringList(_queueKey, kept);
  }

  /// Clears the "refused" mark so the next sync sends the sale again (e.g.
  /// after the stock or price problem was fixed on the server).
  Future<void> markForRetry(String idempotencyKey) async {
    await _updateEntries({
      idempotencyKey: (entry) {
        entry.remove('failed');
        return entry;
      },
    }, const {});
  }

  /// Posts every queued sale that belongs to the current session and is not
  /// marked as refused. Concurrent callers share one run.
  Future<SyncResult> syncPendingSales() {
    final running = _inFlight;
    if (running != null) return running;
    final future = _runSync().whenComplete(() => _inFlight = null);
    _inFlight = future;
    return future;
  }

  Future<SyncResult> _runSync() async {
    final normalized = await _loadQueue();
    if (normalized.isEmpty) {
      return SyncResult(synced: 0, failed: 0, remaining: 0);
    }

    final succeeded = <String>{};
    final updates = <String, Map<String, dynamic> Function(Map<String, dynamic>)>{};
    int failedCount = 0;

    for (final entryStr in normalized) {
      final entry = _decode(entryStr);
      if (entry == null) continue;
      if (!_isOwnedByCurrentSession(entry)) continue;
      if (entry['failed'] == true) {
        failedCount++;
        continue;
      }
      final key = entry['idempotencyKey'] as String;
      try {
        final res = await _apiService.post(
          '/sales',
          entry['payload'],
          idempotencyKey: key,
        );
        if (res.statusCode == 200 || res.statusCode == 201) {
          succeeded.add(key);
        }
      } on DioException catch (e) {
        final status = e.response?.statusCode;
        if (_isPermanentFailure(e)) {
          failedCount++;
          final message = ApiService.parseError(e);
          updates[key] = (stored) {
            stored['failed'] = true;
            stored['lastError'] = message;
            stored['lastStatus'] = status;
            stored['failedAt'] = DateTime.now().toUtc().toIso8601String();
            return stored;
          };
        } else if (status == 401) {
          // Session ended (the interceptor already handled logout) — stop;
          // the remaining entries stay queued for the owner's next login.
          break;
        }
        // Network errors, timeouts, 5xx, 429, IDEMPOTENCY_IN_PROGRESS: keep
        // the entry untouched and retry on the next sync.
      } catch (_) {
        // Unknown error — keep it for the next attempt.
      }
    }

    // Re-read the queue: sales may have been queued while this sync was
    // posting. Only drop what was actually accepted, and only update what
    // was refused — everything else (including newly queued sales) stays.
    final remaining = await _updateEntries(updates, succeeded);
    return SyncResult(
      synced: succeeded.length,
      failed: failedCount,
      remaining: remaining,
    );
  }

  /// Applies [updates] (by idempotency key) to the currently stored queue
  /// and removes the keys in [remove]. Returns how many entries are left.
  Future<int> _updateEntries(
    Map<String, Map<String, dynamic> Function(Map<String, dynamic>)> updates,
    Set<String> remove,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    final current = await _loadQueue();
    final next = <String>[];
    for (final entryStr in current) {
      final entry = _decode(entryStr);
      if (entry == null) {
        next.add(entryStr);
        continue;
      }
      final key = entry['idempotencyKey'] as String;
      if (remove.contains(key)) continue;
      final update = updates[key];
      next.add(update == null ? entryStr : jsonEncode(update(entry)));
    }
    await prefs.setStringList(_queueKey, next);
    return next.length;
  }

  /// A 4xx the server will answer the same way every time (validation,
  /// missing product/customer, stock/price rule, permission). Retrying it
  /// silently forever would just hide a lost sale.
  bool _isPermanentFailure(DioException e) {
    final status = e.response?.statusCode;
    if (status == null) return false;
    if (status == 409) {
      final data = e.response?.data;
      final code = data is Map && data['error'] is Map
          ? data['error']['code']?.toString()
          : null;
      if (code == 'IDEMPOTENCY_IN_PROGRESS') return false;
      return true;
    }
    return status == 400 || status == 403 || status == 404 || status == 422;
  }

  bool _isOwnedByCurrentSession(Map<String, dynamic> entry) {
    final userId = entry['userId']?.toString();
    final companyId = entry['companyId']?.toString();
    // Entries from app versions that did not record an owner are treated as
    // the current session's (they could only have come from this device).
    if (userId == null && companyId == null) return true;
    if (companyId != null && companyId != _apiService.companyId) return false;
    if (userId != null &&
        _apiService.userId != null &&
        userId != _apiService.userId) {
      return false;
    }
    return true;
  }

  /// Reads the stored queue. Entries queued by older app versions are the
  /// bare sale payload with no key: each gets a key, persisted right away, so
  /// every later read (and every sync retry) sees the same key instead of a
  /// freshly minted one.
  Future<List<String>> _loadQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getStringList(_queueKey) ?? [];
    final normalized = stored.map(_normalizeEntry).toList();
    bool changed = false;
    for (int i = 0; i < stored.length; i++) {
      if (stored[i] != normalized[i]) {
        changed = true;
        break;
      }
    }
    if (changed) await prefs.setStringList(_queueKey, normalized);
    return normalized;
  }

  Map<String, dynamic>? _decode(String entryStr) {
    try {
      final decoded = jsonDecode(entryStr);
      if (decoded is Map<String, dynamic> &&
          decoded['idempotencyKey'] is String) {
        return decoded;
      }
    } catch (_) {}
    return null;
  }

  String _normalizeEntry(String entryStr) {
    try {
      final decoded = jsonDecode(entryStr);
      if (decoded is Map<String, dynamic> &&
          decoded['idempotencyKey'] is String &&
          decoded.containsKey('payload')) {
        return entryStr;
      }
      return jsonEncode({
        'idempotencyKey': ApiService.newIdempotencyKey(),
        'payload': decoded,
      });
    } catch (_) {
      return entryStr;
    }
  }
}
