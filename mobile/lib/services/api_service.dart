import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final Dio dio = Dio(BaseOptions(
    baseUrl: 'https://erp-backend-r067.onrender.com/api/v1',
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
    sendTimeout: const Duration(seconds: 30),
  ));

  String? _token;
  String? _companyId;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _companyId = prefs.getString('company_id');

    final savedHost = prefs.getString('api_host');
    if (savedHost != null && savedHost.isNotEmpty) {
      dio.options.baseUrl = savedHost;
    } else {
      dio.options.baseUrl = 'https://erp-backend-r067.onrender.com/api/v1';
    }

    dio.interceptors.clear();
    dio.interceptors.add(InterceptorsWrapper(
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
          options.headers['Idempotency-Key'] = 'm_${time}_${options.path.hashCode.abs()}';
        }
        return handler.next(options);
      },
      onError: (e, handler) async {
        if (e.response?.statusCode == 401) {
          await clearSession();
        }
        return handler.next(e);
      },
    ));
  }

  Future<void> updateHost(String host) async {
    String input = host.trim();
    if (input.isEmpty) {
      dio.options.baseUrl = 'https://erp-backend-r067.onrender.com/api/v1';
      return;
    }

    String formattedUrl = input;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      if (formattedUrl.contains('onrender.com') || formattedUrl.contains('koyeb.app') || formattedUrl.contains('vercel.app')) {
        formattedUrl = 'https://$formattedUrl';
      } else {
        final hostWithPort = formattedUrl.contains(':') ? formattedUrl : '$formattedUrl:3000';
        formattedUrl = 'http://$hostWithPort';
      }
    }

    if (!formattedUrl.endsWith('/api/v1')) {
      formattedUrl = '$formattedUrl/api/v1';
    }

    dio.options.baseUrl = formattedUrl;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_host', formattedUrl);
  }

  String get host {
    final uri = Uri.parse(dio.options.baseUrl);
    return uri.host;
  }

  bool get isAuthenticated => _token != null && _token!.isNotEmpty;
  String? get companyId => _companyId;

  Future<String?> login(String email, String password) async {
    try {
      final res = await dio.post('/auth/login', data: {
        'email': email.trim().toLowerCase(),
        'password': password,
        'deviceInfo': {
          'deviceId': 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          'name': 'Flutter Mobile',
          'platform': 'android',
          'osVersion': 'android-14'
        }
      });

      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = res.data;
        _token = data['accessToken'];
        final company = data['companies']?[0];
        _companyId = company?['id'];

        final prefs = await SharedPreferences.getInstance();
        if (_token != null) await prefs.setString('auth_token', _token!);
        if (_companyId != null) await prefs.setString('company_id', _companyId!);
        if (data['user'] != null) await prefs.setString('user_details', jsonEncode(data['user']));

        return null;
      }
      return 'Server javobi: ${res.statusCode}';
    } on DioException catch (e) {
      return parseError(e);
    } catch (e) {
      return 'Xatolik: ${e.toString()}';
    }
  }

  Future<void> clearSession() async {
    _token = null;
    _companyId = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
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
      if (res?.statusCode == 401) {
        return 'Sessiya muddati tugadi. Iltimos, qaytadan tizimga kiring.';
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
      if (res?.data != null && res!.data is Map) {
        final rawMsg = res.data['message'] ?? res.data['error']?['message'] ?? res.data['error'];
        if (rawMsg != null) {
          if (rawMsg is List) return rawMsg.join(', ');
          return rawMsg.toString();
        }
      }
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout) {
        return 'Server bilan aloqa vaqti tugadi (Timeout).';
      }
      if (e.type == DioExceptionType.connectionError) {
        return 'Internet aloqasi mavjud emas yoki server vaqtincha javob bermayapti.';
      }
      return 'Server xatosi (HTTP ${res?.statusCode ?? 'Noma\'lum'})';
    }
    return e.toString();
  }
}
