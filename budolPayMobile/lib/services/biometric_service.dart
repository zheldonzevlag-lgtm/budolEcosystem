import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:local_auth_android/local_auth_android.dart';
import 'package:local_auth_darwin/local_auth_darwin.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';
import '../utils/js_helper.dart';

class BiometricService {
  final LocalAuthentication _auth = LocalAuthentication();
  final FlutterSecureStorage _storage;
  
  BiometricService({FlutterSecureStorage? storage}) 
    : _storage = storage ?? const FlutterSecureStorage(
        aOptions: AndroidOptions(
          resetOnError: true,
        ),
        webOptions: WebOptions(
          dbName: 'budolpay_biometric_db',
          publicKey: 'budolpay_biometric_pub',
        ),
      );
  
  Future<String?> _readSecure(String key) async {
    try {
      if (kIsWeb && !isWebCryptoSupported()) {
        final prefs = await SharedPreferences.getInstance();
        return prefs.getString('fallback_bio_$key');
      }
      return await _storage.read(key: key);
    } catch (e) {
      if (kDebugMode) print('BiometricService: Error reading secure key $key: $e');
      return null;
    }
  }

  Future<void> _writeSecure(String key, String value) async {
    try {
      if (kIsWeb && !isWebCryptoSupported()) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('fallback_bio_$key', value);
        return;
      }
      await _storage.write(key: key, value: value);
    } catch (e) {
      if (kDebugMode) print('BiometricService: Error writing secure key $key: $e');
    }
  }

  Future<void> _deleteSecure(String key) async {
    try {
      if (kIsWeb && !isWebCryptoSupported()) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('fallback_bio_$key');
        return;
      }
      await _storage.delete(key: key);
    } catch (e) {
      if (kDebugMode) print('BiometricService: Error deleting secure key $key: $e');
    }
  }
  
  void Function(String)? onLogUpdate;
  
  static const String _pinKey = 'biometric_stored_pin';
  static const String _enabledKey = 'biometric_enabled';
  static const String _faceTemplateKey = 'biometric_face_template';

  Future<bool> isAvailable() async {
    try {
      final bool canAuthenticateWithBiometrics = await _auth.canCheckBiometrics;
      final bool isSupported = await _auth.isDeviceSupported();
      return canAuthenticateWithBiometrics || isSupported;
    } catch (e) {
      if (kDebugMode) print('BiometricService: Error checking availability: $e');
      return false;
    }
  }

  Future<List<BiometricType>> getAvailableBiometricTypes() async {
    try {
      return await _auth.getAvailableBiometrics();
    } catch (e) {
      if (kDebugMode) print('BiometricService: Error getting biometric types: $e');
      return [];
    }
  }

  Future<bool> hasEnrolledBiometrics() async {
    try {
      final List<BiometricType> availableBiometrics = await _auth.getAvailableBiometrics();
      if (kDebugMode) print('BiometricService: Available biometrics: $availableBiometrics');
      return availableBiometrics.isNotEmpty;
    } catch (e) {
      if (kDebugMode) print('BiometricService: Error checking enrollment: $e');
      return false;
    }
  }

  Future<bool> hasEnrolledFace() async {
    try {
      final List<BiometricType> availableBiometrics = await _auth.getAvailableBiometrics();
      return availableBiometrics.contains(BiometricType.face) || 
             availableBiometrics.contains(BiometricType.strong);
    } catch (e) {
      return false;
    }
  }

  Future<bool> isEnabled() async {
    final String? enabled = await _readSecure(_enabledKey);
    return enabled == 'true';
  }

  Future<void> setEnabled(bool enabled) async {
    await _writeSecure(_enabledKey, enabled.toString());
  }

  Future<void> storePin(String pin) async {
    await _writeSecure(_pinKey, pin);
  }

  Future<String?> getStoredPin() async {
    return await _readSecure(_pinKey);
  }

  Future<void> clearStoredPin() async {
    await _deleteSecure(_pinKey);
  }

  Future<void> storeFaceTemplate(List<double> template) async {
    await _writeSecure(_faceTemplateKey, template.join(','));
  }

  Future<List<double>?> getStoredFaceTemplate() async {
    final String? templateStr = await _readSecure(_faceTemplateKey);
    if (templateStr == null) return null;
    try {
      return templateStr.split(',').map((e) => double.parse(e)).toList();
    } catch (e) {
      if (kDebugMode) print('BiometricService: Error parsing stored template: $e');
      return null;
    }
  }

  Future<void> clearFaceTemplate() async {
    await _deleteSecure(_faceTemplateKey);
  }

  Future<bool> authenticate() async {
    try {
      final List<AuthMessages> authMessages = [
        const AndroidAuthMessages(
          signInTitle: 'Biometric login for budol₱ay',
          cancelButton: 'No thanks',
        ),
        const IOSAuthMessages(
          cancelButton: 'No thanks',
        ),
      ];
      return await _auth.authenticate(
        localizedReason: 'Please authenticate to log in to budol₱ay',
        authMessages: authMessages,
      );
    } on PlatformException catch (e) {
      _addLog('OS Error: ${e.code} - ${e.message}');
      if (kDebugMode) print('BiometricService: PlatformException: $e');
      return false;
    } catch (e) {
      _addLog('Unexpected Error: $e');
      if (kDebugMode) print('BiometricService: Error authenticating: $e');
      return false;
    }
  }

  void _addLog(String message) {
    if (onLogUpdate != null) {
      onLogUpdate!(message);
    }
  }
}
