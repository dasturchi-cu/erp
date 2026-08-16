import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final Dio dio = Dio(BaseOptions(
    baseUrl: 'https://erp-backend-r067.onrender.com/api/v1',
    connectTimeout: const Duration(seconds: 45),
    receiveTimeout: const Duration(seconds: 45),
    sendTimeout: const Duration(seconds: 45),
  ));

  String? _token;
  String? _companyId;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _companyId = prefs.getString('company_id');

    dio.options.baseUrl = 'https://erp-backend-r067.onrender.com/api/v1';

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_token != null) {
          options.headers['Authorization'] = 'Bearer $_token';
        }
        if (_companyId != null) {
          options.headers['X-Company-Id'] = _companyId;
        }
        return handler.next(options);
      },
      onError: (e, handler) async {
        if (e.response?.statusCode == 401) {
          // Token expired or invalid - clear session
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

  bool get isAuthenticated => _token != null;
  String? get companyId => _companyId;

  Future<String?> login(String email, String password) async {
    try {
      final res = await dio.post('/auth/login', data: {
        'email': email,
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
        await prefs.setString('auth_token', _token!);
        if (_companyId != null) {
          await prefs.setString('company_id', _companyId!);
        }

        await prefs.setString('user_details', jsonEncode(data['user']));
        return null; // null means success
      }
      return 'Server javobi: ${res.statusCode}';
    } on DioException catch (e) {
      final serverMsg = e.response?.data?['message'] ?? e.response?.data?['error']?['message'] ?? e.message ?? e.toString();
      return 'Xatolik: $serverMsg';
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

  // Generic HTTP wrappers with offline cache fallback
  Future<Response> get(String path) async {
    try {
      final response = await dio.get(path);
      // Cache response for offline fallback
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('cache_$path', jsonEncode(response.data));
      return response;
    } catch (e) {
      // Load from cache if offline
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString('cache_$path');
      if (cached != null) {
        return Response(
          requestOptions: RequestOptions(path: path),
          data: jsonDecode(cached),
          statusCode: 200,
        );
      }
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
      if (res?.data != null && res!.data is Map) {
        final msg = res.data['message'];
        if (msg != null) {
          if (msg is List) return msg.join(', ');
          return msg.toString();
        }
      }
      if (e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.receiveTimeout) {
        return 'Server bilan aloqa vaqti tugadi';
      }
      if (e.type == DioExceptionType.connectionError) {
        return 'Internet aloqasi mavjud emas';
      }
    }
    return e.toString();
  }
}
