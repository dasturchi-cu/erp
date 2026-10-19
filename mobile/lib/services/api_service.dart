import 'dart:convert';
import 'dart:math';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'navigation_service.dart';

// Every device must reach the same backend regardless of network (phone and
// desktop are not guaranteed to share a Wi-Fi/LAN), so this is the only API
// URL the app ever uses — no per-device override, no local/LAN picker. A
// prior version exposed a server-address picker on the login screen; it was
// removed because a stray tap there would silently and persistently point
// the app at a personal dev machine's IP instead of the real backend.
const String defaultApiUrl =
    'https://erp-backend-production-e88a.up.railway.app/api/v1';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final Dio dio = Dio(
    BaseOptions(
      baseUrl: defaultApiUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
    ),
  );

  String? _token;
  String? _refreshToken;
  String? _companyId;
  String? _userId;

  // The one refresh currently in flight, shared by every request that hit a
  // 401 meanwhile. Cleared (in `whenComplete`) before any of them retries, so
  // a retried request can never end up waiting on a refresh that is over.
  Future<_RefreshOutcome>? _refreshFuture;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _refreshToken = prefs.getString('refresh_token');
    _companyId = prefs.getString('company_id');
    _userId = prefs.getString('user_id') ?? _userIdFromDetails(prefs);

    dio.options.baseUrl = defaultApiUrl;

    dio.interceptors.clear();
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (_token != null && _token!.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $_token';
          }
          if (_companyId != null && _companyId!.isNotEmpty) {
            options.headers['X-Company-Id'] = _companyId;
          }
          // Keep a caller-supplied key (e.g. an offline sale's key, reused on
          // every retry) and the key already set on a request replayed after
          // a token refresh — overwriting it would let one sale be recorded
          // twice if the first attempt reached the server.
          if ((options.method.toUpperCase() == 'POST' ||
                  options.method.toUpperCase() == 'PUT' ||
                  options.method.toUpperCase() == 'PATCH') &&
              options.headers['Idempotency-Key'] == null) {
            options.headers['Idempotency-Key'] = newIdempotencyKey();
          }
          return handler.next(options);
        },
        onError: (e, handler) async {
          final opts = e.requestOptions;
          final isAuthPath =
              opts.path.contains('/auth/login') ||
              opts.path.contains('/auth/refresh') ||
              opts.path.contains('/auth/logout');

          // A request that already got one retry after a refresh is passed
          // through as-is: a second 401 means the new token is not accepted
          // for it either, and refreshing again would only loop.
          if (e.response?.statusCode != 401 ||
              isAuthPath ||
              opts.extra['retried'] == true) {
            return handler.next(e);
          }

          // The session was already cleared (e.g. by a concurrent request
          // whose refresh was refused): nothing to refresh, and the redirect
          // to login has already happened.
          if ((_token == null || _token!.isEmpty) &&
              (_refreshToken == null || _refreshToken!.isEmpty)) {
            return handler.next(e);
          }

          // If another request already refreshed the token after this one
          // was sent, just retry with the new token instead of refreshing
          // a second time.
          final sentAuth = opts.headers['Authorization']?.toString();
          final tokenChangedSinceSent =
              _token != null &&
              _token!.isNotEmpty &&
              sentAuth != 'Bearer $_token';

          if (!tokenChangedSinceSent) {
            final outcome = await _refreshTokens();
            if (outcome == _RefreshOutcome.rejected) {
              // The refresh itself was definitively refused — the session is
              // over. Only here (never on network errors or a failed retry)
              // is the local session wiped.
              await clearSession();
              NavigationService.redirectToLogin();
              return handler.next(e);
            }
            if (outcome == _RefreshOutcome.unavailable) {
              // Network/server problem during refresh: keep the session so
              // the user can carry on once the connection is back.
              return handler.next(e);
            }
          }

          opts.extra['retried'] = true;
          opts.headers['Authorization'] = 'Bearer $_token';
          try {
            final retried = await dio.fetch(opts);
            return handler.resolve(retried);
          } on DioException catch (retryError) {
            return handler.next(retryError);
          } catch (_) {
            return handler.next(e);
          }
        },
      ),
    );
  }

  Future<_RefreshOutcome> _refreshTokens() {
    final inFlight = _refreshFuture;
    if (inFlight != null) return inFlight;
    final future = _doRefresh().whenComplete(() => _refreshFuture = null);
    _refreshFuture = future;
    return future;
  }

  Future<_RefreshOutcome> _doRefresh() async {
    if (_refreshToken == null || _refreshToken!.isEmpty) {
      return _RefreshOutcome.rejected;
    }
    try {
      final refreshDio = Dio(
        BaseOptions(
          baseUrl: dio.options.baseUrl,
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
          sendTimeout: const Duration(seconds: 30),
        ),
      );
      final res = await refreshDio.post(
        '/auth/refresh',
        data: {'refreshToken': _refreshToken},
      );
      if ((res.statusCode == 200 || res.statusCode == 201) &&
          res.data is Map &&
          res.data['accessToken'] != null) {
        _token = res.data['accessToken'];
        _refreshToken = res.data['refreshToken'] ?? _refreshToken;
        final prefs = await SharedPreferences.getInstance();
        if (_token != null) await prefs.setString('auth_token', _token!);
        if (_refreshToken != null) {
          await prefs.setString('refresh_token', _refreshToken!);
        }
        return _RefreshOutcome.ok;
      }
      return _RefreshOutcome.unavailable;
    } on DioException catch (err) {
      final status = err.response?.statusCode;
      if (status == 400 || status == 401 || status == 403) {
        return _RefreshOutcome.rejected;
      }
      return _RefreshOutcome.unavailable;
    } catch (_) {
      return _RefreshOutcome.unavailable;
    }
  }

  String? _userIdFromDetails(SharedPreferences prefs) {
    try {
      final raw = prefs.getString('user_details');
      if (raw == null) return null;
      final decoded = jsonDecode(raw);
      return decoded is Map ? decoded['id']?.toString() : null;
    } catch (_) {
      return null;
    }
  }

  /// Stable per-install device id (UUID v4) for the backend's device
  /// registry. Generated once and kept in SharedPreferences, so each phone is
  /// its own device instead of every install sharing one hardcoded id.
  Future<String> deviceId() async {
    final prefs = await SharedPreferences.getInstance();
    final existing = prefs.getString('device_id');
    if (existing != null && uuidV4Pattern.hasMatch(existing)) return existing;
    final id = newUuidV4();
    await prefs.setString('device_id', id);
    return id;
  }

  static final RegExp uuidV4Pattern = RegExp(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
  );

  /// RFC 4122 version-4 UUID from a cryptographically secure RNG.
  static String newUuidV4() {
    final rnd = Random.secure();
    final b = List<int>.generate(16, (_) => rnd.nextInt(256));
    b[6] = (b[6] & 0x0f) | 0x40; // version 4
    b[8] = (b[8] & 0x3f) | 0x80; // RFC 4122 variant
    final hex = b.map((x) => x.toRadixString(16).padLeft(2, '0')).join();
    return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-'
        '${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}';
  }

  String get host {
    final uri = Uri.parse(dio.options.baseUrl);
    return uri.host;
  }

  bool get isAuthenticated => _token != null && _token!.isNotEmpty;
  String? get companyId => _companyId;
  String? get userId => _userId;

  Future<String?> login(String email, String password) async {
    try {
      final res = await dio.post(
        '/auth/login',
        data: {
          'email': email.trim().toLowerCase(),
          'password': password,
          'deviceInfo': {
            'deviceId': await deviceId(),
            'name': 'Flutter Mobile',
            'platform': 'android',
            'osVersion': 'android-14',
          },
        },
      );

      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = res.data;
        _token = data['accessToken'];
        _refreshToken = data['refreshToken'];
        final dynamic currentCo = data['currentCompany'];
        final dynamic firstCo =
            (data['companies'] is List &&
                (data['companies'] as List).isNotEmpty)
            ? data['companies'][0]
            : null;
        final company = currentCo ?? firstCo;
        _companyId = company?['id']?.toString();
        _userId = data['user'] is Map ? data['user']['id']?.toString() : null;

        final prefs = await SharedPreferences.getInstance();
        if (_token != null) await prefs.setString('auth_token', _token!);
        if (_refreshToken != null)
          await prefs.setString('refresh_token', _refreshToken!);
        if (_companyId != null)
          await prefs.setString('company_id', _companyId!);
        if (company != null)
          await prefs.setString('active_company', jsonEncode(company));
        if (data['companies'] != null)
          await prefs.setString(
            'user_companies',
            jsonEncode(data['companies']),
          );
        if (data['user'] != null)
          await prefs.setString('user_details', jsonEncode(data['user']));
        if (_userId != null) await prefs.setString('user_id', _userId!);

        return null;
      }
      return 'Server javobi: ${res.statusCode}';
    } on DioException catch (e) {
      return parseError(e);
    } catch (e) {
      return 'Xatolik: ${e.toString()}';
    }
  }

  Future<bool> switchCompany(String newCompanyId) async {
    try {
      final res = await dio.post(
        '/auth/switch-company',
        data: {'companyId': newCompanyId},
      );
      if (res.statusCode == 200 || res.statusCode == 201) {
        _companyId = newCompanyId;
        if (res.data['accessToken'] != null) _token = res.data['accessToken'];
        if (res.data['refreshToken'] != null)
          _refreshToken = res.data['refreshToken'];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('company_id', newCompanyId);
        if (_token != null) await prefs.setString('auth_token', _token!);
        if (_refreshToken != null)
          await prefs.setString('refresh_token', _refreshToken!);
        if (res.data['activeCompany'] != null) {
          await prefs.setString(
            'active_company',
            jsonEncode(res.data['activeCompany']),
          );
        }
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  /// Ends the session on the server (revokes this device's session) and
  /// then locally. The server call is best-effort: being offline or already
  /// expired must never keep the user from logging out.
  Future<void> logout() async {
    if (isAuthenticated) {
      try {
        await dio.post(
          '/auth/logout',
          options: Options(
            sendTimeout: const Duration(seconds: 10),
            receiveTimeout: const Duration(seconds: 10),
          ),
        );
      } catch (_) {}
    }
    await clearSession();
  }

  Future<void> clearSession() async {
    _token = null;
    _refreshToken = null;
    _companyId = null;
    _userId = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('refresh_token');
    await prefs.remove('company_id');
    await prefs.remove('user_details');
    await prefs.remove('user_id');
    await prefs.remove('active_company');
    await prefs.remove('user_companies');
    // Cached GET responses belong to the previous user/company; never let
    // the next login read them while offline. (The offline sales queue is
    // kept on purpose — its entries carry their owner, see SyncService.)
    for (final key in prefs.getKeys().toList()) {
      if (key.startsWith('cache_')) await prefs.remove(key);
    }
  }

  /// GETs that change on every call (live search, job-status polling) — a
  /// cached copy of them is never a useful offline answer.
  static bool _isUncacheable(String path) {
    return path.startsWith('/pos/products') ||
        path.contains('?q=') ||
        path.contains('&q=') ||
        path.startsWith('/reports/jobs') ||
        path.contains('/unread-count') ||
        path.startsWith('/saas/updates');
  }

  /// True when the server could not be reached at all (as opposed to the
  /// server answering with an error status).
  static bool isOfflineError(Object e) {
    return e is DioException &&
        (e.type == DioExceptionType.connectionError ||
            e.type == DioExceptionType.connectionTimeout ||
            e.type == DioExceptionType.receiveTimeout ||
            e.type == DioExceptionType.sendTimeout);
  }

  Future<Response> get(String path) async {
    final cacheable = !_isUncacheable(path);
    final cacheKey = 'cache_${_companyId ?? 'none'}_$path';
    try {
      final response = await dio.get(path);
      if (cacheable) {
        try {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(cacheKey, jsonEncode(response.data));
        } catch (_) {}
      }
      return response;
    } catch (e) {
      // Only an unreachable server falls back to the cached copy. A real
      // server answer (401/403/404/5xx…) must reach the caller — serving a
      // stale cache for it would hide lost permissions or a logged-out state.
      if (cacheable && isOfflineError(e)) {
        try {
          final prefs = await SharedPreferences.getInstance();
          final cached = prefs.getString(cacheKey);
          if (cached != null) {
            return Response(
              requestOptions: RequestOptions(path: path),
              data: jsonDecode(cached),
              statusCode: 200,
            );
          }
        } catch (_) {}
      }
      rethrow;
    }
  }

  /// Random key for the backend's Idempotency-Key header. Generate one per
  /// logical operation and pass it to [post] for every attempt of it.
  static String newIdempotencyKey() {
    final rnd = Random.secure();
    final bytes = List<int>.generate(16, (_) => rnd.nextInt(256));
    return 'm_${bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join()}';
  }

  Future<Response> post(
    String path,
    dynamic data, {
    String? idempotencyKey,
  }) async {
    return dio.post(
      path,
      data: data,
      options: idempotencyKey == null
          ? null
          : Options(headers: {'Idempotency-Key': idempotencyKey}),
    );
  }

  /// Uploads a local file as multipart/form-data (field name `file`).
  Future<Response> uploadFile(
    String path,
    String filePath, {
    String fieldName = 'file',
  }) async {
    final formData = FormData.fromMap({
      fieldName: await MultipartFile.fromFile(filePath),
    });
    return dio.post(path, data: formData);
  }

  /// Downloads a binary response (e.g. a generated report file) as raw bytes.
  Future<Response<List<int>>> downloadBytes(String path) async {
    return dio.get<List<int>>(
      path,
      options: Options(responseType: ResponseType.bytes),
    );
  }

  Future<Response> patch(String path, dynamic data) async {
    return dio.patch(path, data: data);
  }

  Future<Response> put(String path, dynamic data) async {
    return dio.put(path, data: data);
  }

  Future<Response> delete(String path) async {
    return dio.delete(path);
  }

  static String parseError(dynamic e) {
    if (e is DioException) {
      final res = e.response;
      if (res?.data != null && res!.data is Map) {
        final rawMsg =
            res.data['error']?['message'] ??
            res.data['message'] ??
            res.data['error'];
        if (rawMsg != null) {
          if (rawMsg is List) return rawMsg.join(', ');
          final str = rawMsg.toString();
          if (str.toLowerCase().contains('invalid email or password')) {
            return 'Email yoki parol noto\'g\'ri kiritildi!';
          }
          if (str.toLowerCase().contains('user account is blocked')) {
            return 'Foydalanuvchi hisobi bloklangan!';
          }
          if (str.toLowerCase().contains('device is blocked')) {
            return 'Ushbu qurilma bloklangan!';
          }
          return str;
        }
      }

      if (res?.statusCode == 401) {
        return 'Sessiya muddati tugadi yoki login ma\'lumotlari xato.';
      }
      if (res?.statusCode == 403) {
        return 'Sizda ushbu amalni bajarish uchun yetarli ruxsat yo\'q.';
      }
      if (res?.statusCode == 404) {
        return 'So\'ralgan ma\'lumot yoki manzil topilmadi.';
      }
      if (res?.statusCode == 409) {
        return 'Bunday ma\'lumot allaqachon mavjud.';
      }
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout) {
        return 'Server bilan aloqa vaqti tugadi (Timeout).';
      }
      if (e.type == DioExceptionType.connectionError) {
        return 'Internet aloqasi mavjud emas yoki serverga ulanib bo\'lmadi.';
      }
      return 'Server xatosi (HTTP ${res?.statusCode ?? 'Noma\'lum'})';
    }
    return e.toString();
  }
}

enum _RefreshOutcome { ok, rejected, unavailable }
