// lib/utils/js_helper_web.dart
import 'dart:js_interop';
import 'dart:js_interop_unsafe';
import 'package:flutter/foundation.dart';

@JS('window')
external JSObject get _window;

bool isWebCryptoSupported() {
  try {
    // Check if isSecureContext exists and is true
    final JSAny? isSecureContext = _window.getProperty('isSecureContext'.toJS);
    final bool isSecure = isSecureContext != null;
    
    // Check if crypto.subtle exists
    final JSAny? crypto = _window.getProperty('crypto'.toJS);
    bool hasSubtle = false;
    if (crypto != null) {
      final JSObject cryptoObj = crypto as JSObject;
      final JSAny? subtle = cryptoObj.getProperty('subtle'.toJS);
      hasSubtle = subtle != null;
    }
    
    if (kDebugMode) {
      print('JS Helper: WebCrypto support check - isSecureContext: $isSecure, hasSubtle: $hasSubtle');
    }
    
    return isSecure && hasSubtle;
  } catch (e) {
    if (kDebugMode) {
      print('JS Helper: Error checking WebCrypto support: $e');
    }
    return false;
  }
}

void callJsMethod(String method, [List<dynamic>? args]) {
  try {
    final JSString methodKey = method.toJS;
    // Use getProperty and null check instead of hasProperty to avoid analysis issues
    if (_window.getProperty(methodKey) != null) {
      if (args == null || args.isEmpty) {
        _window.callMethod(methodKey);
      } else {
        final List<JSAny?> jsArgs = args.map((arg) {
          if (arg is String) return arg.toJS;
          if (arg is num) return arg.toJS;
          if (arg is bool) return arg.toJS;
          return null;
        }).toList();
        
        // Use callMethodVarArgs for dynamic number of arguments
        _window.callMethodVarArgs(methodKey, jsArgs);
      }
    } else {
      if (kDebugMode) {
        print('JS Helper: Method $method not found on window');
      }
    }
  } catch (e) {
    if (kDebugMode) {
      print('JS Helper: Error calling method $method: $e');
    }
  }
}