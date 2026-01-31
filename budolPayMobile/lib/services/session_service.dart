import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flag_secure/flag_secure.dart';
import 'package:local_auth/local_auth.dart';
import '../utils/timezone_utils.dart';
import 'api_service.dart';

class SessionService extends ChangeNotifier with WidgetsBindingObserver {
  final ApiService apiService;
  final LocalAuthentication _auth = LocalAuthentication();
  
  Timer? _inactivityTimer;
  static const int _timeoutMinutes = 3;
  static const int _gracePeriodSeconds = 180; // 3 minutes grace period for backgrounding (v472)
  
  DateTime? _lastBackgroundTime;
  bool _isLocked = false;
  bool _isProcessingBiometrics = false;
  bool _wasAuthenticated = false;

  bool get isLocked => _isLocked;

  SessionService(this.apiService) {
    _wasAuthenticated = apiService.isAuthenticated;
    WidgetsBinding.instance.addObserver(this);
    apiService.addListener(_onAuthChanged);
    if (!kIsWeb) {
      _disableScreenSecurity(); // Explicitly ensure screenshots are allowed
    }
    // Initial check
    if (_wasAuthenticated) {
      resetInactivityTimer();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    apiService.removeListener(_onAuthChanged);
    _inactivityTimer?.cancel();
    super.dispose();
  }

  void _onAuthChanged() {
    final bool currentAuth = apiService.isAuthenticated;
    
    if (currentAuth && !_wasAuthenticated) {
      // Transition from NOT authenticated to authenticated
      if (kDebugMode) print('SessionService: User logged in. Starting inactivity timer.');
      resetInactivityTimer();
    } else if (!currentAuth && _wasAuthenticated) {
      // Transition from authenticated to NOT authenticated
      if (kDebugMode) print('SessionService: User logged out. Stopping inactivity timer.');
      _inactivityTimer?.cancel();
      _isLocked = false;
      notifyListeners();
    }
    
    _wasAuthenticated = currentAuth;
  }

  Future<void> _disableScreenSecurity() async {
    if (kIsWeb) return;
    if (defaultTargetPlatform != TargetPlatform.android) return;
    
    try {
      await FlagSecure.unset();
      if (kDebugMode) print('SessionService: Screen security (FLAG_SECURE) disabled to allow screenshots');
    } catch (e) {
      if (kDebugMode) print('SessionService: Failed to disable screen security: $e');
    }
  }

  // --- Inactivity Management ---
  void resetInactivityTimer() {
    _inactivityTimer?.cancel();
    if (apiService.isAuthenticated && !_isLocked) {
      _inactivityTimer = Timer(const Duration(minutes: _timeoutMinutes), () {
        if (kDebugMode) print('SessionService: Idle timeout reached. Logging out.');
        _handleTimeout();
      });
    }
  }

  void _handleTimeout() {
    if (kDebugMode) print('SessionService: Hard timeout reached. Logging out user.');
    _isLocked = false; // Hide lock screen if it was showing
    apiService.logout(); // This will trigger the auth listener in BudolPayApp to redirect to login
    notifyListeners();
  }

  // --- Lifecycle Handling ---
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!apiService.isAuthenticated) return;

    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) {
      _lastBackgroundTime = TimezoneUtils.getManilaNow();
      if (kDebugMode) print('SessionService: App backgrounded at $_lastBackgroundTime');
    } else if (state == AppLifecycleState.resumed) {
      if (kDebugMode) print('SessionService: App resumed');
      _handleResumed();
    }
  }

  void _handleResumed() {
    if (_lastBackgroundTime == null) return;

    final now = TimezoneUtils.getManilaNow();
    final difference = now.difference(_lastBackgroundTime!).inSeconds;

    if (difference > _gracePeriodSeconds) {
      if (kDebugMode) print('SessionService: Grace period exceeded ($difference s). Logging out user.');
      _isLocked = false;
      apiService.logout();
      notifyListeners();
    } else {
      if (kDebugMode) print('SessionService: Resumed within grace period ($difference s).');
    }
    
    _lastBackgroundTime = null;
    resetInactivityTimer();
  }

  // --- Authentication ---
  Future<bool> unlockWithBiometrics() async {
    if (_isProcessingBiometrics) return false;
    
    try {
      _isProcessingBiometrics = true;
      
      final bool canAuthenticateWithBiometrics = await _auth.canCheckBiometrics;
      final bool canAuthenticate = canAuthenticateWithBiometrics || await _auth.isDeviceSupported();

      if (!canAuthenticate) {
        if (kDebugMode) print('SessionService: Biometrics not available');
        return false;
      }

      final bool didAuthenticate = await _auth.authenticate(
        localizedReason: 'Please authenticate to resume your session',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false, // Allows PIN/Pattern fallback like real banking apps
        ),
      );

      if (didAuthenticate) {
        _isLocked = false;
        resetInactivityTimer();
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      if (kDebugMode) print('SessionService: Biometric auth error: $e');
      return false;
    } finally {
      _isProcessingBiometrics = false;
    }
  }

  void forceLogout() {
    _isLocked = false;
    apiService.logout();
    notifyListeners();
  }
}
