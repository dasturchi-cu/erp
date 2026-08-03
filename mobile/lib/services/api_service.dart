import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final Dio dio = Dio(BaseOptions(
    baseUrl: 'https://erp-backend-r067.onrender.com/api/v1',
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 15),
  ));

  String? _token;
  String? _companyId;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _companyId = prefs.getString('company_id');

    final customHost = prefs.getString('api_host');
    if (customHost != null && customHost.isNotEmpty) {
      if (customHost.startsWith('http://') || customHost.startsWith('https://')) {
        dio.options.baseUrl = customHost.endsWith('/api/v1') ? customHost : '$customHost/api/v1';
      } else {
        final hostWithPort = customHost.contains(':') ? customHost : '$customHost:3000';
        dio.options.baseUrl = 'http://$hostWithPort/api/v1';
      }
    }

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
    final hostWithPort = host.contains(':') ? host : '$host:3000';
    dio.options.baseUrl = 'http://$hostWithPort/api/v1';
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('api_host', host);
  }

  String get host {
    final uri = Uri.parse(dio.options.baseUrl);
    return uri.host;
  }

  bool get isAuthenticated => _token != null;
  String? get companyId => _companyId;

  Future<bool> login(String email, String password) async {
    try {
      final res = await dio.post('/auth/login', data: {
        'email': email,
        'password': password,
        'deviceInfo': {
          'deviceId': 'mobile-client',
          'name': 'Flutter Mobile',
          'platform': 'android',
          'appVersion': '1.0.0'
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

        // Cache user details offline
        await prefs.setString('user_details', jsonEncode(data['user']));
        return true;
      }
      return false;
    } catch (e) {
      return false;
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
}
