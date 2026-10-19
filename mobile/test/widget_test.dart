import 'dart:convert';

import 'package:erp_mobile/services/api_service.dart';
import 'package:erp_mobile/services/sync_service.dart';
import 'package:erp_mobile/views/product_search_field.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

// The default Flutter template's "counter" smoke test was replaced: this app
// has no counter screen. These cover the offline queue and picker helpers.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('SyncService queue', () {
    setUp(() async {
      SharedPreferences.setMockInitialValues({
        'auth_token': 't',
        'company_id': 'company-a',
        'user_id': 'user-1',
        'offline_sales_queue': [
          // Legacy entry (bare payload, no key, no owner).
          jsonEncode({'paymentType': 'CASH', 'lineItems': []}),
          jsonEncode({
            'idempotencyKey': 'k-other',
            'payload': {'lineItems': []},
            'userId': 'user-2',
            'companyId': 'company-b',
          }),
          jsonEncode({
            'idempotencyKey': 'k-failed',
            'payload': {
              'lineItems': [
                {'quantity': '2.0000', 'unitPriceUzs': '1500.5000'},
              ],
            },
            'userId': 'user-1',
            'companyId': 'company-a',
            'failed': true,
            'lastError': 'Insufficient stock',
            'lastStatus': 422,
          }),
        ],
      });
      await ApiService().init();
    });

    test('legacy entries get one stable key', () async {
      final first = await SyncService().getPendingSales();
      final second = await SyncService().getPendingSales();
      expect(first.length, 3);
      expect(first[0].idempotencyKey, second[0].idempotencyKey);
      expect(first[0].ownedByCurrentSession, isTrue);
    });

    test('entries of another user/company are kept but not owned', () async {
      final sales = await SyncService().getPendingSales();
      final other = sales.firstWhere((s) => s.idempotencyKey == 'k-other');
      expect(other.ownedByCurrentSession, isFalse);
    });

    test('failed sales are exposed and can be discarded', () async {
      final failed = await SyncService().getFailedSales();
      expect(failed.map((s) => s.idempotencyKey), ['k-failed']);
      expect(failed.single.lastStatus, 422);
      expect(failed.single.totalUzs, closeTo(3001, 0.0001));

      await SyncService().discardSale('k-failed');
      expect(await SyncService().getFailedSales(), isEmpty);
      expect(await SyncService().getPendingSalesCount(), 2);
    });

    test('markForRetry clears the refused flag', () async {
      await SyncService().markForRetry('k-failed');
      expect(await SyncService().getFailedSales(), isEmpty);
      expect(await SyncService().getPendingSalesCount(), 3);
    });
  });

  test('clearSession removes cached GET responses', () async {
    SharedPreferences.setMockInitialValues({
      'auth_token': 't',
      'company_id': 'company-a',
      'cache_company-a_/products?limit=100': '[]',
      'offline_sales_queue': <String>[],
      'device_id': '3b241101-e2bb-4255-8caf-4136c566a962',
    });
    await ApiService().init();
    await ApiService().clearSession();
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getKeys().where((k) => k.startsWith('cache_')), isEmpty);
    expect(prefs.getString('auth_token'), isNull);
    // Device id and the offline queue survive a logout.
    expect(prefs.getString('device_id'), isNotNull);
    expect(prefs.getStringList('offline_sales_queue'), isNotNull);
  });

  test('ProductSearchField.withSelected keeps the selected instance', () {
    final selected = <String, dynamic>{'id': 'p1', 'name': 'A'};
    final fresh = [
      {'id': 'p2'},
      {'id': 'p1', 'name': 'A (fresh copy)'},
    ];
    final merged = ProductSearchField.withSelected(fresh, selected);
    expect(merged.length, 2);
    expect(identical(merged[1], selected), isTrue);

    final missing = ProductSearchField.withSelected([{'id': 'p3'}], selected);
    expect(identical(missing.first, selected), isTrue);
    expect(missing.length, 2);
  });
}
