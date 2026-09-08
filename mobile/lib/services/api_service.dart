import 'dart:async';
import 'dart:convert';
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
  bool _isRefreshing = false;
  final List<Completer<void>> _refreshWaiters = [];

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _refreshToken = prefs.getString('refresh_token');
    _companyId = prefs.getString('company_id');

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
          if (options.method.toUpperCase() == 'POST' ||
              options.method.toUpperCase() == 'PUT' ||
              options.method.toUpperCase() == 'PATCH') {
            final time = DateTime.now().microsecondsSinceEpoch;
            options.headers['Idempotency-Key'] =
                'm_${time}_${options.path.hashCode.abs()}';
          }
          return handler.next(options);
        },
        onError: (e, handler) async {
          final isAuthPath =
              e.requestOptions.path.contains('/auth/login') ||
              e.requestOptions.path.contains('/auth/refresh') ||
              e.requestOptions.path.contains('/auth/logout');

          if (e.response?.statusCode != 401 || isAuthPath) {
            return handler.next(e);
          }

          // A refresh is already in flight (triggered by a concurrent request):
          // wait for it instead of failing/logging out immediately, then retry
          // this request with whatever token the refresh produced.
          if (_isRefreshing) {
            final waiter = Completer<void>();
            _refreshWaiters.add(waiter);
            try {
              await waiter.future;
              final opts = e.requestOptions;
              opts.headers['Authorization'] = 'Bearer $_token';
              final cloneReq = await dio.fetch(opts);
              return handler.resolve(cloneReq);
            } catch (_) {
              return handler.next(e);
            }
          }

          if (_refreshToken != null && _refreshToken!.isNotEmpty) {
            _isRefreshing = true;
            try {
              final refreshDio = Dio(BaseOptions(baseUrl: dio.options.baseUrl));
              final res = await refreshDio.post(
                '/auth/refresh',
                data: {'refreshToken': _refreshToken},
              );
              if (res.statusCode == 200 || res.statusCode == 201) {
                _token = res.data['accessToken'];
                _refreshToken = res.data['refreshToken'] ?? _refreshToken;
                final prefs = await SharedPreferences.getInstance();
                if (_token != null)
                  await prefs.setString('auth_token', _token!);
                if (_refreshToken != null)
                  await prefs.setString('refresh_token', _refreshToken!);

                for (final w in _refreshWaiters) {
                  if (!w.isCompleted) w.complete();
                }
                _refreshWaiters.clear();

                final opts = e.requestOptions;
                opts.headers['Authorization'] = 'Bearer $_token';
                final cloneReq = await dio.fetch(opts);
                return handler.resolve(cloneReq);
              }
            } catch (_) {
              // Refresh failed
            } finally {
              _isRefreshing = false;
            }
          }

          for (final w in _refreshWaiters) {
            if (!w.isCompleted) w.completeError('refresh-failed');
          }
          _refreshWaiters.clear();

          await clearSession();
          NavigationService.redirectToLogin();
          return handler.next(e);
        },
      ),
    );
  }

  String get host {
    final uri = Uri.parse(dio.options.baseUrl);
    return uri.host;
  }

  bool get isAuthenticated => _token != null && _token!.isNotEmpty;
  String? get companyId => _companyId;

  Future<String?> login(String email, String password) async {
    try {
      final res = await dio.post(
        '/auth/login',
        data: {
          'email': email.trim().toLowerCase(),
          'password': password,
          'deviceInfo': {
            'deviceId': '550e8400-e29b-41d4-a716-446655440000',
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

  Future<void> clearSession() async {
    _token = null;
    _refreshToken = null;
    _companyId = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('refresh_token');
    await prefs.remove('company_id');
    await prefs.remove('user_details');
  }

  Future<Response> get(String path) async {
    try {
      final response = await dio.get(path);
      // Clean caching
      try {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('cache_$path', jsonEncode(response.data));
      } catch (_) {}
      return response;
    } catch (e) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final cached = prefs.getString('cache_$path');
        if (cached != null) {
          return Response(
            requestOptions: RequestOptions(path: path),
            data: jsonDecode(cached),
            statusCode: 200,
          );
        }
      } catch (_) {}
      rethrow;
    }
  }

  Future<Response> post(String path, dynamic data) async {
    return dio.post(path, data: data);
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
