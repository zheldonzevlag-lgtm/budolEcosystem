import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/foundation.dart';
import '../utils/js_helper.dart';
import '../utils/timezone_utils.dart';
import 'discovery_service.dart';

import 'package:package_info_plus/package_info_plus.dart';

enum LogType { request, response, error, info }

class ApiLog {
  final LogType type;
  final String url;
  final String? method;
  final int? statusCode;
  final String? requestBody;
  final String? responseBody;
  final String? error;
  final DateTime timestamp;

  ApiLog({
    required this.type,
    required this.url,
    this.method,
    this.statusCode,
    this.requestBody,
    this.responseBody,
    this.error,
  }) : timestamp = DateTime.now();
}

class ApiService extends ChangeNotifier {
  final List<ApiLog> _debugLogs = [];
  List<ApiLog> get debugLogs => List.unmodifiable(_debugLogs);

  void _addLog(ApiLog log) {
    _debugLogs.add(log);
    if (_debugLogs.length > 50) _debugLogs.removeAt(0);
    notifyListeners();
  }

  void clearDebugLogs() {
    _debugLogs.clear();
    notifyListeners();
  }
  static const String _tokenKey = 'budolpay_token';
  static const String _userKey = 'budolpay_user';
  static const String _hostKey = 'budolpay_custom_host';
  static const String _deviceIdKey = 'budolpay_device_id';
  static const String _hasSeenAdsKey = 'budolpay_has_seen_ads';

  String? _customHost;
  String? token;
  Map<String, dynamic>? user;
  Map<String, dynamic>? _systemSettings;
  String? _deviceId;
  bool _hasSeenAds = false;
  String _appVersion = '3.1.69'; // v3.1.69 - Stable Release

  String get appVersion => _appVersion;
  Future<void>? _initFuture;
  Future<void>? _backgroundInitFuture;
  final DiscoveryService _discoveryService = DiscoveryService();
  
  late final FlutterSecureStorage _secureStorage;

  String get host {
    if (kIsWeb) {
      return Uri.base.host;
    }
    if (_customHost != null) {
      return _customHost!;
    }
    return const String.fromEnvironment(
      'API_HOST',
      defaultValue: 'localhost',
    );
  }

  static String _normalizeHost(String rawHost) {
    var value = rawHost.trim();
    if (value.startsWith('http://')) {
      value = value.substring('http://'.length);
    } else if (value.startsWith('https://')) {
      value = value.substring('https://'.length);
    }
    while (value.endsWith('/')) {
      value = value.substring(0, value.length - 1);
    }
    final slashIndex = value.indexOf('/');
    if (slashIndex >= 0) {
      value = value.substring(0, slashIndex);
    }
    return value;
  }

  static String _hostOnly(String rawHost) {
    final normalized = _normalizeHost(rawHost);
    final parts = normalized.split(':');
    if (parts.length >= 2) {
      final last = parts.last;
      final port = int.tryParse(last);
      if (port != null) {
        return parts.sublist(0, parts.length - 1).join(':');
      }
    }
    return normalized;
  }

  static int? _portFromHost(String rawHost) {
    final normalized = _normalizeHost(rawHost);
    final parts = normalized.split(':');
    if (parts.length >= 2) {
      return int.tryParse(parts.last);
    }
    return null;
  }

  static String computeBaseUrlFromHost(String rawHost) {
    final hostOnly = _hostOnly(rawHost);
    final port = _portFromHost(rawHost);
    if (port != null) {
      return 'http://$hostOnly:$port';
    }
    return 'http://$hostOnly:8080';
  }

  static String computeAuthUrlFromHost(String rawHost) {
    final hostOnly = _hostOnly(rawHost);
    return 'http://$hostOnly:8001';
  }

  String get baseUrl {
    const gatewayUrl = String.fromEnvironment('GATEWAY_URL', defaultValue: '');
    if (gatewayUrl.isNotEmpty) return gatewayUrl;
    return computeBaseUrlFromHost(host);
  }
  
  dynamic _safeDecode(http.Response response, {String? context}) {
    final body = response.body.trim();
    if (body.startsWith('<!DOCTYPE html>') || body.startsWith('<html>')) {
      if (kDebugMode) print('ApiService: Expected JSON but received HTML at ${response.request?.url} ($context)');
      throw Exception('Server returned an error page (HTML). Please check if the service is running.');
    }
    try {
      return json.decode(body);
    } catch (e) {
      if (kDebugMode) print('ApiService: JSON Decode Error at ${response.request?.url} ($context): $e');
      throw Exception('Failed to parse server response - Invalid JSON format.');
    }
  }
  
  String get authUrl {
    const overrideAuthUrl = String.fromEnvironment('AUTH_URL', defaultValue: '');
    if (overrideAuthUrl.isNotEmpty) return overrideAuthUrl;
    
    // If we're using a gateway (typically port 8080), use the /auth prefix on the gateway URL
    if (baseUrl.contains(':8080')) {
      return '$baseUrl/auth';
    }
    
    return computeAuthUrlFromHost(host);
  }

  String get deviceId => _deviceId ?? 'unknown_device';
  bool get hasSeenAds => _hasSeenAds;
  Map<String, dynamic>? get currentUser => user;
  Map<String, dynamic>? get systemSettings => _systemSettings;
  bool get isAuthenticated => token != null && user != null && user!['id'] != null;

  ApiService({this.token, this.user}) {
    // Initialize Secure Storage with Web Compatibility
    _secureStorage = const FlutterSecureStorage(
      aOptions: AndroidOptions(),
      webOptions: WebOptions(
        dbName: 'budolpay_secure_db',
        publicKey: 'budolpay_pub',
      ),
    );
    _initFuture = _initialize();
  }

  Future<String?> _readSecure(String key) async {
    try {
      if (kIsWeb && !isWebCryptoSupported()) {
        final prefs = await SharedPreferences.getInstance();
        return prefs.getString('fallback_$key');
      }
      return await _secureStorage.read(key: key);
    } catch (e) {
      if (kDebugMode) print('ApiService: Error reading secure key $key: $e');
      return null;
    }
  }

  Future<void> _writeSecure(String key, String value) async {
    try {
      if (kIsWeb && !isWebCryptoSupported()) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('fallback_$key', value);
        return;
      }
      await _secureStorage.write(key: key, value: value);
    } catch (e) {
      if (kDebugMode) print('ApiService: Error writing secure key $key: $e');
    }
  }

  Future<void> _deleteSecure(String key) async {
    try {
      if (kIsWeb && !isWebCryptoSupported()) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('fallback_$key');
        return;
      }
      await _secureStorage.delete(key: key);
    } catch (e) {
      if (kDebugMode) print('ApiService: Error deleting secure key $key: $e');
    }
  }

  Future<void> init() async {
    await _ensureInitialized();
  }

  Future<void> waitForFullInit() async {
    await _ensureInitialized();
    if (_backgroundInitFuture != null) {
      await _backgroundInitFuture;
    }
  }

  Future<void> _ensureInitialized() async {
    if (_initFuture != null) {
      await _initFuture;
    }
  }

  Future<void> setHasSeenAds(bool value) async {
    _hasSeenAds = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_hasSeenAdsKey, value);
    notifyListeners();
  }

  Future<void> setHost(String rawHost) async {
    final normalizedHost = _normalizeHost(rawHost);
    _customHost = normalizedHost;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_hostKey, normalizedHost);
    notifyListeners();
    if (kDebugMode) print('ApiService: Host manually updated to: $normalizedHost');
  }

  Future<bool> discoverAndSetHost() async {
    final discoveredHost = await _discoveryService.discoverGateway();
    if (discoveredHost != null) {
      await setHost(discoveredHost);
      return true;
    }
    return false;
  }

  Future<void> resetAdsStatus() async {
    _hasSeenAds = false;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_hasSeenAdsKey);
    notifyListeners();
    if (kDebugMode) print('ApiService: Ads status reset to false');
  }

  Future<void> _initialize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      // Load Host
      _customHost = prefs.getString(_hostKey);
      
      if (kDebugMode) {
        print('ApiService: Loaded saved host: $_customHost');
      }

      // Try auto-discovery if no custom host is set
      if (_customHost == null && !kIsWeb) {
        if (kDebugMode) print('ApiService: Attempting auto-discovery...');
        final discoveredHost = await _discoveryService.discoverGateway();
        if (discoveredHost != null) {
          _customHost = discoveredHost;
          if (kDebugMode) print('ApiService: Auto-discovered gateway at $_customHost');
        }
      }
      
      // Load Session from Secure Storage
      token = await _readSecure(_tokenKey);
      final userJson = await _readSecure(_userKey);
      if (userJson != null) {
        try {
          user = json.decode(userJson);
        } catch (e) {
          if (kDebugMode) print('ApiService: Failed to decode user JSON: $e');
        }
      }

      // Load App Version
      try {
        // Use a timeout for PackageInfo as it can hang on some web environments
        final packageInfo = await PackageInfo.fromPlatform().timeout(const Duration(seconds: 2));
        String version = packageInfo.version;
        if (version.startsWith('v') || version.startsWith('V')) {
          version = version.substring(1);
        }
        if (version.startsWith('_')) {
          version = version.substring(1);
        }
        _appVersion = version;
      } catch (e) {
        if (kDebugMode) print('ApiService: Failed to get app version: $e');
      }

      // Load/Init Device ID from Secure Storage
      _deviceId = await _readSecure(_deviceIdKey);
      if (_deviceId == null) {
        final now = TimezoneUtils.getManilaNow();
        _deviceId = 'dev_${now.millisecondsSinceEpoch}_${(1000 + (9999 - 1000) * (now.millisecond / 1000)).toInt()}';
        await _writeSecure(_deviceIdKey, _deviceId!);
      }

      // Load Ads status
      _hasSeenAds = prefs.getBool(_hasSeenAdsKey) ?? false;
      if (kDebugMode) {
        print('ApiService: Initialized. hasSeenAds = $_hasSeenAds');
      }
      if (kDebugMode) print('ApiService: Loaded hasSeenAds: $_hasSeenAds from SharedPreferences');

      // Notify listeners that we've loaded the session from SharedPreferences
      notifyListeners();

      // Non-blocking background initialization for network-dependent tasks
      _backgroundInitFuture = _backgroundInit();
      
      if (kDebugMode) {
        print('ApiService: Basic initialization complete. Host: $host. DeviceId: $deviceId. Authenticated: $isAuthenticated');
      }
    } catch (e) {
      if (kDebugMode) print('ApiService: Critical error during initialization: $e');
    }
  }

  Future<void> _backgroundInit() async {
    // These are network dependent and shouldn't block the app from starting
    await fetchSystemSettings();
    
    if (isAuthenticated) {
      await _fetchUserProfile();
    }
    
    notifyListeners();
  }

  Future<void> _saveSession() async {
    if (token != null) await _writeSecure(_tokenKey, token!);
    if (user != null) await _writeSecure(_userKey, json.encode(user));
  }

  Future<void> _clearSession() async {
    await _deleteSecure(_tokenKey);
    await _deleteSecure(_userKey);
  }

  Future<void> _fetchUserProfile() async {
    if (token == null) return;
    
    // The auth service has /verify at the root and also /api/auth/verify via router
    final url = '$authUrl/verify';
    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = _safeDecode(response, context: 'fetchUserProfile');
        if (data['valid'] == true && data['user'] != null) {
          final newUser = Map<String, dynamic>.from(data['user']);
          
          // Merge with existing user data to preserve fields not returned by /verify
          if (user != null) {
            final mergedUser = Map<String, dynamic>.from(user!);
            mergedUser.addAll(newUser);
            user = mergedUser;
          } else {
            user = newUser;
          }
          
          if (kDebugMode) {
            print('ApiService: Profile fetched. Name: ${user?['firstName']} ${user?['lastName']}');
          }
          
          await _saveSession();
          notifyListeners();
        } else {
          await logout();
        }
      } else if (response.statusCode == 401) {
        await logout();
      }
    } catch (e) {
      if (kDebugMode) print('ApiService: Failed to fetch user profile: $e');
    }
  }

  // --- Auth Methods ---

  Future<Map<String, dynamic>> identifyMobile(String phoneNumber) async {
    final url = '$authUrl/login/mobile/identify';
    final body = json.encode({
      'phoneNumber': phoneNumber,
      'deviceId': deviceId,
    });
    
    _addLog(ApiLog(
      type: LogType.request,
      method: 'POST',
      url: url,
      requestBody: body,
    ));

    try {
      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: body,
      ).timeout(const Duration(seconds: 30));

      _addLog(ApiLog(
        type: LogType.response,
        method: 'POST',
        url: url,
        statusCode: response.statusCode,
        responseBody: response.body,
      ));

      if (response.statusCode == 200 || response.statusCode == 404) {
        final decoded = _safeDecode(response, context: 'identifyMobile');
        final Map<String, dynamic> data = decoded is Map ? Map<String, dynamic>.from(decoded) : {};
        if (data['user'] != null && data['user'] is Map) {
          user = Map<String, dynamic>.from(data['user'] as Map);
          notifyListeners();
        }
        return data;
      } else {
        throw Exception('Identification failed: ${response.statusCode}');
      }
    } catch (e) {
      _addLog(ApiLog(
        type: LogType.error,
        method: 'POST',
        url: url,
        error: e.toString(),
      ));
      rethrow;
    }
  }

  Future<Map<String, dynamic>> identifyEmail(String email, String password) async {
    final url = '$authUrl/login';
    final body = json.encode({
      'email': email,
      'password': password,
      'deviceId': deviceId,
    });
    
    _addLog(ApiLog(
      type: LogType.request,
      method: 'POST',
      url: url,
      requestBody: body,
    ));

    try {
      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: body,
      ).timeout(const Duration(seconds: 30));

      _addLog(ApiLog(
        type: LogType.response,
        method: 'POST',
        url: url,
        statusCode: response.statusCode,
        responseBody: response.body,
      ));

      final decoded = _safeDecode(response, context: 'identifyEmail');
      final Map<String, dynamic> data = decoded is Map ? Map<String, dynamic>.from(decoded) : {};
      
      if (response.statusCode == 200) {
        if (data['user'] != null && data['user'] is Map) {
          user = Map<String, dynamic>.from(data['user'] as Map);
        }
        if (data['token'] != null) {
          token = data['token']?.toString();
          await _saveSession();
        }
        notifyListeners();
        return {...data, 'status': 'SUCCESS'};
      } else if (response.statusCode == 401 || response.statusCode == 404) {
        return {'error': data['error'] ?? 'Invalid credentials', 'status': 'FAILED'};
      } else {
        throw Exception(data['error'] ?? 'Email login failed: ${response.statusCode}');
      }
    } catch (e) {
      _addLog(ApiLog(
        type: LogType.error,
        method: 'POST',
        url: url,
        error: e.toString(),
      ));
      rethrow;
    }
  }

  Future<Map<String, dynamic>> verifyOtp({
    required String userId,
    required String otp,
    required String type,
  }) async {
    final url = '$authUrl/verify-otp';
    final response = await http.post(
      Uri.parse(url),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'userId': userId,
        'otp': otp,
        'type': type,
        'deviceId': deviceId,
      }),
    ).timeout(const Duration(seconds: 30));

    final decoded = _safeDecode(response, context: 'verifyOtp');
    final Map<String, dynamic> data = decoded is Map ? Map<String, dynamic>.from(decoded) : {};
    if (response.statusCode == 200) {
      if (data['user'] != null && data['user'] is Map) {
        user = Map<String, dynamic>.from(data['user'] as Map);
      }
      if (data['token'] != null) {
        token = data['token']?.toString();
        await _saveSession();
      }
      notifyListeners();
      return data;
    } else {
      throw Exception(data['error']?.toString() ?? 'OTP verification failed');
    }
  }

  Future<Map<String, dynamic>> resendOtp({
    required String userId,
    required String type,
  }) async {
    final url = '$authUrl/resend-otp';
    final body = json.encode({
      'userId': userId,
      'type': type,
    });

    _addLog(ApiLog(
      type: LogType.request,
      method: 'POST',
      url: url,
      requestBody: body,
    ));

    try {
      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: body,
      ).timeout(const Duration(seconds: 30));

      _addLog(ApiLog(
        type: LogType.response,
        method: 'POST',
        url: url,
        statusCode: response.statusCode,
        responseBody: response.body,
      ));

      final decoded = _safeDecode(response, context: 'resendOtp');
      final Map<String, dynamic> data = decoded is Map ? Map<String, dynamic>.from(decoded) : {};
      
      if (response.statusCode == 200) {
        return data;
      } else {
        throw Exception(data['error'] ?? 'Failed to resend OTP');
      }
    } catch (e) {
      _addLog(ApiLog(
        type: LogType.error,
        method: 'POST',
        url: url,
        error: e.toString(),
      ));
      rethrow;
    }
  }

  Future<Map<String, dynamic>> verifyPin({
    required String userId,
    required String pin,
  }) async {
    final url = '$authUrl/login/mobile/verify-pin';
    final body = json.encode({
      'userId': userId,
      'pin': pin,
      'deviceId': deviceId,
    });

    _addLog(ApiLog(
      type: LogType.request,
      method: 'POST',
      url: url,
      requestBody: body,
    ));

    try {
      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: body,
      ).timeout(const Duration(seconds: 30));

      _addLog(ApiLog(
        type: LogType.response,
        method: 'POST',
        url: url,
        statusCode: response.statusCode,
        responseBody: response.body,
      ));

      final decoded = _safeDecode(response, context: 'verifyPin');
      final Map<String, dynamic> data = decoded is Map ? Map<String, dynamic>.from(decoded) : {};
      if (response.statusCode == 200) {
        token = data['token'];
        user = data['user'];
        await _saveSession();
        notifyListeners();
        return data;
      } else {
        throw Exception(data['error'] ?? 'PIN verification failed');
      }
    } catch (e) {
      _addLog(ApiLog(
        type: LogType.error,
        method: 'POST',
        url: url,
        error: e.toString(),
      ));
      rethrow;
    }
  }

  Future<Map<String, dynamic>> setupPin({
    required String userId,
    required String pin,
  }) async {
    final url = '$authUrl/login/mobile/setup-pin';
    final body = json.encode({
      'userId': userId,
      'pin': pin,
    });

    _addLog(ApiLog(
      type: LogType.request,
      method: 'POST',
      url: url,
      requestBody: body,
    ));

    try {
      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: body,
      ).timeout(const Duration(seconds: 30));

      _addLog(ApiLog(
        type: LogType.response,
        method: 'POST',
        url: url,
        statusCode: response.statusCode,
        responseBody: response.body,
      ));

      final decoded = _safeDecode(response, context: 'setupPin');
      final Map<String, dynamic> data = decoded is Map ? Map<String, dynamic>.from(decoded) : {};
      if (response.statusCode == 200) {
        token = data['token'];
        user = data['user'];
        await _saveSession();
        notifyListeners();
        return data;
      } else {
        throw Exception(data['error'] ?? 'PIN setup failed');
      }
    } catch (e) {
      _addLog(ApiLog(
        type: LogType.error,
        method: 'POST',
        url: url,
        error: e.toString(),
      ));
      rethrow;
    }
  }

  Future<Map<String, dynamic>> register({
    String? email,
    String? password,
    required String firstName,
    required String lastName,
    required String phoneNumber,
    required String pin,
  }) async {
    final url = '$authUrl/register';
    final body = json.encode({
      'email': email,
      'password': password,
      'firstName': firstName,
      'lastName': lastName,
      'phoneNumber': phoneNumber,
      'pin': pin,
      'deviceId': deviceId,
    });

    _addLog(ApiLog(
      type: LogType.request,
      method: 'POST',
      url: url,
      requestBody: body,
    ));
    
    try {
      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: body,
      ).timeout(const Duration(seconds: 30));

      _addLog(ApiLog(
        type: LogType.response,
        method: 'POST',
        url: url,
        statusCode: response.statusCode,
        responseBody: response.body,
      ));

      final decoded = _safeDecode(response, context: 'register');
      final Map<String, dynamic> data = decoded is Map ? Map<String, dynamic>.from(decoded) : {};
      if (response.statusCode == 201) {
        return data;
      } else {
        throw Exception(data['error'] ?? 'Registration failed');
      }
    } catch (e) {
      _addLog(ApiLog(
        type: LogType.error,
        method: 'POST',
        url: url,
        error: e.toString(),
      ));
      rethrow;
    }
  }

  Future<Map<String, dynamic>> quickRegister({
    required String phoneNumber,
    String? firstName,
  }) async {
    final url = '$authUrl/register/quick';
    final body = json.encode({
      'phoneNumber': phoneNumber,
      'firstName': firstName,
      'deviceId': deviceId,
    });

    _addLog(ApiLog(
      type: LogType.request,
      method: 'POST',
      url: url,
      requestBody: body,
    ));
    
    try {
      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: body,
      ).timeout(const Duration(seconds: 10));

      _addLog(ApiLog(
        type: LogType.response,
        method: 'POST',
        url: url,
        statusCode: response.statusCode,
        responseBody: response.body,
      ));

      final decoded = _safeDecode(response, context: 'quickRegister');
      final Map<String, dynamic> data = decoded is Map ? Map<String, dynamic>.from(decoded) : {};
      if (response.statusCode == 201) {
        return data;
      } else {
        throw Exception(data['error'] ?? 'Quick registration failed');
      }
    } catch (e) {
      _addLog(ApiLog(
        type: LogType.error,
        method: 'POST',
        url: url,
        error: e.toString(),
      ));
      rethrow;
    }
  }

  Future<Map<String, dynamic>> updateProfile({
    String? firstName,
    String? lastName,
    String? email,
  }) async {
    await _ensureInitialized();
    if (user == null || token == null) throw Exception('User session expired. Please login again.');

    final url = '$authUrl/profile';
    final body = json.encode({
      if (firstName != null) 'firstName': firstName,
      if (lastName != null) 'lastName': lastName,
      if (email != null) 'email': email,
    });

    _addLog(ApiLog(
      type: LogType.request,
      method: 'PATCH',
      url: url,
      requestBody: body,
    ));

    try {
      final response = await http.patch(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: body,
      ).timeout(const Duration(seconds: 30));

      _addLog(ApiLog(
        type: LogType.response,
        method: 'PATCH',
        url: url,
        statusCode: response.statusCode,
        responseBody: response.body,
      ));

      final decoded = _safeDecode(response, context: 'updateProfile');
      final Map<String, dynamic> data = decoded is Map ? Map<String, dynamic>.from(decoded) : {};

      if (response.statusCode == 200) {
        if (data['user'] != null) {
          // Update local user data but preserve other fields
          final updatedUser = Map<String, dynamic>.from(user!);
          updatedUser.addAll(Map<String, dynamic>.from(data['user']));
          user = updatedUser;
          await _saveSession();
          notifyListeners();
        }
        return data;
      } else {
        throw Exception(data['error'] ?? 'Failed to update profile');
      }
    } catch (e) {
      _addLog(ApiLog(
        type: LogType.error,
        method: 'PATCH',
        url: url,
        error: e.toString(),
      ));
      rethrow;
    }
  }

  Future<Map<String, dynamic>> updateMpin({
    required String oldPin,
    required String newPin,
  }) async {
    await _ensureInitialized();
    if (user == null || token == null) throw Exception('User session expired. Please login again.');

    final url = '$authUrl/pin/update';
    final response = await http.post(
      Uri.parse(url),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'userId': user!['id'],
        'oldPin': oldPin,
        'newPin': newPin,
      }),
    ).timeout(const Duration(seconds: 10));

    final decoded = _safeDecode(response, context: 'updateMpin');
    final Map<String, dynamic> data = decoded is Map ? Map<String, dynamic>.from(decoded) : {};

    if (response.statusCode == 200) {
      return data;
    } else {
      throw Exception(data['error'] ?? 'Failed to update MPIN');
    }
  }

  Future<Map<String, dynamic>> checkEmail(String email) async {
    await _ensureInitialized();
    final url = '$authUrl/check-email?email=${Uri.encodeComponent(email)}';
    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 5));
      final decoded = _safeDecode(response, context: 'checkEmail');
      return decoded is Map ? Map<String, dynamic>.from(decoded) : {};
    } catch (e) {
      if (kDebugMode) print('ApiService: Error checking email: $e');
      return {'exists': false};
    }
  }

  Future<Map<String, dynamic>> checkPhone(String phone) async {
    await _ensureInitialized();
    final url = '$authUrl/check-phone?phone=${Uri.encodeComponent(phone)}';
    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 5));
      final decoded = _safeDecode(response, context: 'checkPhone');
      return decoded is Map ? Map<String, dynamic>.from(decoded) : {};
    } catch (e) {
      if (kDebugMode) print('ApiService: Error checking phone: $e');
      return {'exists': false};
    }
  }

  // --- Favorites Management ---

  Future<List<dynamic>> getFavorites() async {
    await _ensureInitialized();
    if (token == null) return [];

    final url = '$baseUrl/auth/favorites';
    try {
      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return _safeDecode(response, context: 'getFavorites') as List<dynamic>;
      } else {
        throw Exception('Failed to fetch favorites');
      }
    } catch (e) {
      if (kDebugMode) print('ApiService: Error fetching favorites: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>> addFavorite(String recipientId, {String? alias}) async {
    await _ensureInitialized();
    if (token == null) throw Exception('Not authenticated');

    final url = '$baseUrl/auth/favorites';
    final response = await http.post(
      Uri.parse(url),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'recipientId': recipientId,
        'alias': alias,
      }),
    ).timeout(const Duration(seconds: 10));

    final decoded = _safeDecode(response, context: 'addFavorite');
    if (response.statusCode == 200) {
      return Map<String, dynamic>.from(decoded);
    } else {
      throw Exception(decoded['error'] ?? 'Failed to add favorite');
    }
  }

  Future<void> removeFavorite(String recipientId) async {
    await _ensureInitialized();
    if (token == null) throw Exception('Not authenticated');

    final url = '$baseUrl/auth/favorites/$recipientId';
    final response = await http.delete(
      Uri.parse(url),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode != 200) {
      final decoded = _safeDecode(response, context: 'removeFavorite');
      throw Exception(decoded['error'] ?? 'Failed to remove favorite');
    }
  }

  Future<void> resetHost() async {
    _customHost = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_hostKey);
    notifyListeners();
  }

  // --- Wallet & Transaction Methods ---

  Future<void> fetchSystemSettings() async {
    final url = '$baseUrl/system/settings';
    try {
      final response = await http.get(Uri.parse(url)).timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        _systemSettings = _safeDecode(response, context: 'fetchSystemSettings');
        notifyListeners();
      }
    } catch (e) {
      if (kDebugMode) print('ApiService: Failed to fetch system settings: $e');
    }
  }

  Future<double> getBalance() async {
    await _ensureInitialized();
    if (user == null || token == null) throw Exception('User session expired. Please login again.');

    final url = '$baseUrl/wallet/balance/${user!['id']}';
    final response = await http.get(
      Uri.parse(url),
      headers: {'Authorization': 'Bearer $token'},
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final data = _safeDecode(response, context: 'getBalance');
      if (data is Map && data.containsKey('balance')) {
        return (data['balance'] ?? 0.0).toDouble();
      }
      return (data ?? 0.0).toDouble();
    } else {
      throw Exception('Failed to fetch balance');
    }
  }

  Future<List<dynamic>> getTransactions() async {
    await _ensureInitialized();
    if (user == null || token == null) throw Exception('User session expired. Please login again.');

    final url = '$baseUrl/transactions/history/${user!['id']}';
    final response = await http.get(
      Uri.parse(url),
      headers: {'Authorization': 'Bearer $token'},
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      return _safeDecode(response, context: 'getTransactions');
    } else {
      throw Exception('Failed to fetch transactions');
    }
  }

  Future<Map<String, dynamic>> cashIn({
    required double amount,
    required String provider,
  }) async {
    await _ensureInitialized();
    if (user == null || token == null) throw Exception('User session expired. Please login again.');

    final url = '$baseUrl/transactions/cash-in';
    final response = await http.post(
      Uri.parse(url),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'userId': user!['id'],
        'amount': amount,
        'provider': provider,
      }),
    ).timeout(const Duration(seconds: 10));

    final result = _safeDecode(response, context: 'cashIn');
    if (response.statusCode == 200) {
      return result;
    } else {
      throw Exception(result['error'] ?? 'Cash-in failed');
    }
  }

  Future<Map<String, dynamic>> transfer({
    required String recipient,
    required double amount,
    String? description,
  }) async {
    await _ensureInitialized();
    if (user == null || token == null) throw Exception('User session expired. Please login again.');

    final url = '$baseUrl/transactions/transfer';
    final response = await http.post(
      Uri.parse(url),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'senderId': user!['id'],
        'recipient': recipient,
        'amount': amount,
        'description': description,
      }),
    ).timeout(const Duration(seconds: 10));

    final result = _safeDecode(response, context: 'transfer');
    if (response.statusCode == 200) {
      return result;
    } else {
      throw Exception(result['error'] ?? 'Transfer failed');
    }
  }

  Future<Map<String, dynamic>> processPayment({required Map<String, dynamic> qrData}) async {
    await _ensureInitialized();
    if (user == null || token == null) throw Exception('User session expired. Please login again.');

    final url = '$baseUrl/wallet/process-qr';
    final response = await http.post(
      Uri.parse(url),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'userId': user!['id'],
        'qrData': qrData,
      }),
    ).timeout(const Duration(seconds: 10));

    final data = _safeDecode(response, context: 'processPayment');
    if (response.statusCode == 200) {
      return data;
    } else {
      throw Exception(data['error'] ?? 'Payment failed');
    }
  }

  Future<void> logout() async {
    try {
      if (user != null && user!['id'] != null) {
        final url = '$authUrl/logout';
        if (kDebugMode) print('ApiService: Sending logout notification to backend: $url');
        await http.post(
          Uri.parse(url),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({
            'userId': user!['id'],
            'deviceId': deviceId,
          }),
        ).timeout(const Duration(seconds: 5));
      }
    } catch (e) {
      if (kDebugMode) print('ApiService: Backend logout notification failed: $e');
    }

    token = null;
    user = null;
    await _clearSession();
    notifyListeners();
  }
}
