import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'dart:async';
import 'package:local_auth/local_auth.dart';
import '../services/face_embedding_service.dart';
import '../utils/js_helper.dart';
import '../services/api_service.dart';
import '../services/biometric_service.dart';
import '../constants/routes.dart';
import '../utils/ui_utils.dart';

enum LoginStep { phone, otp, pin, pinSetup }

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with WidgetsBindingObserver {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  final _pinController = TextEditingController();
  
  LoginStep _currentStep = LoginStep.phone;
  bool _isLoading = false;
  String? _userId;
  bool _isBiometricAvailable = false;
  bool _isBiometricEnabled = false;
  bool _hasFaceTemplate = false;
  List<BiometricType> _availableBiometricTypes = [];
  bool _isPhoneValid = false;
  String? _phoneError;
  bool _hasAutoPrompted = false;
  bool _identifierExists = true; // Default to true for login
  bool _checkingIdentifier = false;
  Timer? _debounceTimer;

  // Face Recognition state
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _checkBiometrics();
    
    _phoneController.addListener(_onIdentifierChanged);

    // Handle initial state from arguments (e.g., coming from Registration)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = ModalRoute.of(context)?.settings.arguments as Map?;
      if (args != null) {
        if (args['phoneNumber'] != null) {
          _phoneController.text = args['phoneNumber'];
          _validateIdentifier(args['phoneNumber']);
        }
        if (args['userId'] != null) {
          _userId = args['userId'].toString();
        }
        if (args['initialStep'] == 'OTP') {
          setState(() => _currentStep = LoginStep.otp);
        }
      }
    });

    // On Web, ensure splash is removed if we navigated directly here
    if (kIsWeb) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Future.delayed(const Duration(milliseconds: 200), () {
          if (mounted) {
            callJsMethod('removeSplashFromWeb');
          }
        });
      });
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _phoneController.removeListener(_onIdentifierChanged);
    _phoneController.dispose();
    _otpController.dispose();
    _pinController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Re-check biometrics when app returns to foreground
      // e.g. user might have enabled biometrics in system settings
      _checkBiometrics();
    }
  }

  Future<void> _checkBiometrics() async {
    final biometricService = context.read<BiometricService>();
    final available = await biometricService.isAvailable();
    final enabled = await biometricService.isEnabled();
    final faceTemplate = await biometricService.getStoredFaceTemplate();
    final types = await biometricService.getAvailableBiometricTypes();
    
    if (mounted) {
      setState(() {
        _isBiometricAvailable = available;
        _isBiometricEnabled = enabled;
        _hasFaceTemplate = faceTemplate != null;
        _availableBiometricTypes = types;
      });
      _maybeTriggerAutoBiometrics();
    }
  }

  void _maybeTriggerAutoBiometrics() {
    if (_currentStep == LoginStep.pin && 
        _isBiometricEnabled && 
        !_hasAutoPrompted && 
        !_isLoading) {
      _hasAutoPrompted = true;
      debugPrint('[AutoLogin] Triggering GoTyme-style automatic biometric prompt.');
      Future.delayed(const Duration(milliseconds: 600), () {
        if (mounted && _currentStep == LoginStep.pin) {
          _handleFaceRecognitionLogin();
        }
      });
    }
  }

  Future<void> _handleBiometricLogin() async {
    final biometricService = context.read<BiometricService>();
    
    // Refresh biometric status before proceeding to ensure we have the latest state
    final isNowEnabled = await biometricService.isEnabled();
    if (mounted) {
      setState(() {
        _isBiometricEnabled = isNowEnabled;
      });
    }

    if (!_isBiometricAvailable) {
      _showError('Biometric authentication is not supported on this device.');
      return;
    }

    final hasEnrolled = await biometricService.hasEnrolledBiometrics();
    
    if (!hasEnrolled) {
      _showError('No fingerprints or face enrolled on this device. Please check your system settings.');
      return;
    }

    if (!isNowEnabled) {
      _showError('Biometric login is disabled. Please login with your PIN once to enable it in Settings.');
      return;
    }

    try {
      final authenticated = await biometricService.authenticate();

      if (authenticated) {
        final storedPin = await biometricService.getStoredPin();
        if (storedPin != null) {
          _pinController.text = storedPin;
          _handleVerifyPin();
        } else {
          _showError('No stored PIN found for biometric login. Please enter your PIN once.');
        }
      }
    } catch (e) {
      _showError('Biometric authentication failed: $e');
    }
  }

  Future<void> _handleFaceRecognitionLogin() async {
    final biometricService = context.read<BiometricService>();
    
    // Refresh biometric status before proceeding
    final isNowEnabled = await biometricService.isEnabled();
    if (mounted) {
      setState(() {
        _isBiometricEnabled = isNowEnabled;
      });
    }

    // 1. Check for App-level Face Template
    final hasAppFace = _hasFaceTemplate;
    
    // 2. Check for OS-level Face Registration
    final hasNativeFace = await biometricService.hasEnrolledFace();
    
    // 3. Check for Generic OS Biometrics (Fingerprint/Strong)
    final hasAnyBiometric = await biometricService.hasEnrolledBiometrics();

    debugPrint('[FaceLogin] Status: AppFace=$hasAppFace, NativeFace=$hasNativeFace, AnyBiometric=$hasAnyBiometric, Enabled=$isNowEnabled');

    if (hasAppFace || hasNativeFace) {
      // If face is registered in any way, use the Zero-Action OS biometric prompt.
      // This satisfies the "do not make the user take picture again" requirement.
      debugPrint('[FaceLogin] Face context found. Triggering OS biometric prompt.');
      return _handleBiometricLogin();
    }

    if (hasAnyBiometric && isNowEnabled) {
      // Fallback to biometric login (Fingerprint) if no face is registered anywhere.
      debugPrint('[FaceLogin] No face registered. Falling back to generic biometric login.');
      return _handleBiometricLogin();
    }

    _showError('No face profile or biometric login enabled. Please login with PIN once to enable.');
  }

  Future<void> _handleIdentify() async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) return;

    setState(() => _isLoading = true);
    try {
      final apiService = context.read<ApiService>();
      final result = await apiService.identifyMobile(phone);
      if (!mounted) return;
      
      final String? error = result['error']?.toString();
      final String? status = result['status']?.toString();
      final apiUserId = apiService.currentUser?['id']?.toString();
      final resultUserId = (result['user'] is Map)
          ? (result['user'] as Map)['id']?.toString()
          : null;
      final String? userId = result['userId']?.toString() ?? resultUserId ?? apiUserId;

      if (error != null && error.contains('not found')) {
        if (mounted) {
          Navigator.pushNamed(context, Routes.registration, arguments: {'phoneNumber': phone});
        }
      } else if (status == 'OTP_REQUIRED') {
        setState(() {
          _userId = userId;
          _currentStep = LoginStep.otp;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('New device detected. Please verify OTP.')),
          );
        }
      } else if (status == 'AUTH_REQUIRED') {
        setState(() {
          _userId = userId;
          _currentStep = LoginStep.pin;
        });
        _checkBiometrics();
      } else if (userId != null) {
        setState(() {
          _userId = userId;
          _currentStep = LoginStep.pin;
        });
        _checkBiometrics();
      } else {
        throw Exception('Unable to start login. Missing user identifier from server response.');
      }
    } catch (e) {
      _showError(e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleVerifyOtp() async {
    final otp = _otpController.text.trim();
    if (otp.isEmpty) return;
    
    if (_userId == null) {
      _showError('Session expired. Please enter your mobile or email again.');
      setState(() => _currentStep = LoginStep.phone);
      return;
    }

    setState(() => _isLoading = true);
    try {
      // Get the type from arguments if coming from registration
      final args = ModalRoute.of(context)?.settings.arguments as Map?;
      final String otpType = args?['type'] ?? 'TRUST_DEVICE';

      final result = await context.read<ApiService>().verifyOtp(
        userId: _userId!,
        otp: otp,
        type: otpType,
      );
      if (mounted) {
        if (result['status'] == 'PIN_SETUP_REQUIRED' || result['needsPinSetup'] == true) {
          setState(() {
            _currentStep = LoginStep.pinSetup;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('OTP Verified! Please set up your 6-digit PIN.'), backgroundColor: Colors.blue),
          );
        } else {
          setState(() {
            _currentStep = LoginStep.pin;
          });
          _checkBiometrics();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('OTP Verified! Please enter your PIN.'), backgroundColor: Colors.green),
          );
        }
      }
    } catch (e) {
      _showError(e.toString());
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleSetupPin() async {
    final pin = _pinController.text.trim();
    if (pin.isEmpty) return;
    
    if (_userId == null) {
      _showError('Session expired. Please enter your mobile or email again.');
      setState(() => _currentStep = LoginStep.phone);
      return;
    }

    setState(() => _isLoading = true);
    try {
      await context.read<ApiService>().setupPin(
        userId: _userId!,
        pin: pin,
      );
      if (mounted) {
        Navigator.pushReplacementNamed(context, Routes.home);
      }
    } catch (e) {
      _showError(e.toString());
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleVerifyPin() async {
    final pin = _pinController.text.trim();
    if (pin.isEmpty) return;
    
    if (_userId == null) {
      _showError('Session expired. Please enter your phone number again.');
      setState(() => _currentStep = LoginStep.phone);
      return;
    }

    setState(() => _isLoading = true);
    final apiService = context.read<ApiService>();
    final biometricService = context.read<BiometricService>();
    
    try {
      await apiService.verifyPin(
        userId: _userId!,
        pin: pin,
      );
      
      // Store PIN for future biometric login if available
      if (_isBiometricAvailable) {
        if (!_isBiometricEnabled) {
          // Ask user to enable biometrics if not already enabled
          if (mounted) {
            _showEnableBiometricDialog(pin);
          }
        } else {
          // Just update the stored PIN
          await biometricService.storePin(pin);
        }
      }

      if (mounted) {
        Navigator.pushReplacementNamed(context, Routes.home);
      }
    } catch (e) {
      _showError(e.toString());
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _onIdentifierChanged() {
    if (_debounceTimer?.isActive ?? false) _debounceTimer!.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 800), () {
      _checkIdentifier(_phoneController.text);
    });
  }

  Future<void> _checkIdentifier(String identifier) async {
    final trimmed = identifier.trim();
    if (trimmed.isEmpty) {
      setState(() {
        _identifierExists = true;
        _checkingIdentifier = false;
        _phoneError = null;
      });
      return;
    }

    setState(() => _checkingIdentifier = true);
    try {
      final apiService = context.read<ApiService>();
      bool exists = false;
      
      if (trimmed.contains('@')) {
        final result = await apiService.checkEmail(trimmed);
        exists = result['exists'] ?? false;
      } else {
        final result = await apiService.checkPhone(trimmed);
        exists = result['exists'] ?? false;
      }

      if (mounted) {
        setState(() {
          _identifierExists = exists;
          _checkingIdentifier = false;
          if (!exists) {
            _phoneError = 'Account not found in ecosystem';
            _isPhoneValid = false;
          } else {
            _phoneError = null;
            // Re-validate format to set _isPhoneValid
            _validateIdentifier(trimmed);
          }
        });
      }
    } catch (e) {
      if (mounted) setState(() => _checkingIdentifier = false);
    }
  }

  void _validateIdentifier(String value) {
    final trimmed = value.trim();
    setState(() {
      if (trimmed.isEmpty) {
        _isPhoneValid = false;
        _phoneError = null;
      } else if (trimmed.contains('@')) {
        // Simple email validation
        final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
        _isPhoneValid = emailRegex.hasMatch(trimmed);
        _phoneError = _isPhoneValid ? null : 'Invalid email format';
      } else {
        // Phone validation
        final digits = trimmed.replaceAll(RegExp(r'\D'), '');
        if (!digits.startsWith('09') && !digits.startsWith('639') && !digits.startsWith('9')) {
          _isPhoneValid = false;
          _phoneError = 'Invalid phone format';
        } else if (digits.length < 10) {
          _isPhoneValid = false;
          _phoneError = 'Too short';
        } else if (digits.length > 12) {
          _isPhoneValid = false;
          _phoneError = 'Too long';
        } else {
          _isPhoneValid = true;
          _phoneError = null;
        }
      }
    });
  }

  void _showEnableBiometricDialog(String pin) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Enable Biometric Login?'),
        content: const Text('Would you like to use biometrics for faster login next time?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('No Thanks'),
          ),
          ElevatedButton(
            onPressed: () async {
              final biometricService = context.read<BiometricService>();
              final navigator = Navigator.of(context);
              
              // 1. Enable basic biometrics (Fingerprint)
              await biometricService.setEnabled(true);
              await biometricService.storePin(pin);
              
              // 2. Ask for Face Scan to store local template
              if (mounted) {
                navigator.pop();
                _showFaceRegistrationDialog(pin);
              }
            },
            child: const Text('Enable Fingerprint'),
          ),
        ],
      ),
    );
  }

  void _showFaceRegistrationDialog(String pin) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Register Face Login?'),
        content: const Text('Scan your face to enable Face Recognition login on this device.'),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              if (mounted) setState(() => _isBiometricEnabled = true);
            },
            child: const Text('Later'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await _registerFaceForLogin(pin);
            },
            child: const Text('Scan Now'),
          ),
        ],
      ),
    );
  }

  Future<void> _registerFaceForLogin(String pin) async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice: CameraDevice.front,
      );

      if (photo == null) return;

      setState(() => _isLoading = true);

      final file = File(photo.path);
      if (!mounted) return;
      final faceService = context.read<FaceEmbeddingService>();
      final biometricService = context.read<BiometricService>();

      final template = await faceService.generateEmbedding(file);
      if (template != null) {
        await biometricService.storeFaceTemplate(template);
        await biometricService.setEnabled(true);
        await biometricService.storePin(pin);
        
        if (mounted) {
          setState(() => _isBiometricEnabled = true);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Face registered successfully!'), backgroundColor: Colors.green),
          );
        }
      } else {
        throw Exception('Failed to capture face embedding. Please try again.');
      }
    } catch (e) {
      _showError('Face registration failed: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message.replaceAll('Exception: ', '')),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings, color: Colors.white70),
            onPressed: () => UIUtils.showHostConfigDialog(context),
            tooltip: 'API Configuration',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildLogo(),
              const SizedBox(height: 48),
              if (_currentStep == LoginStep.phone) _buildPhoneStep(),
              if (_currentStep == LoginStep.otp) _buildOtpStep(),
              if (_currentStep == LoginStep.pin) _buildPinStep(),
              if (_currentStep == LoginStep.pinSetup) _buildPinSetupStep(),
              const SizedBox(height: 24),
              if (_currentStep == LoginStep.phone)
                TextButton(
                  onPressed: () => Navigator.pushNamed(context, Routes.registration),
                  child: UIUtils.formatBudolPayText(
                    'New to budol₱ay? Register here',
                    baseStyle: const TextStyle(color: Color(0xFFF43F5E)),
                  ),
                ),
              if (_currentStep != LoginStep.phone)
                TextButton(
                  onPressed: () => setState(() => _currentStep = LoginStep.phone),
                  child: const Text('Back to Login', 
                    style: TextStyle(color: Colors.white70)),
                ),
              const SizedBox(height: 12),
              Text(
                '${context.watch<ApiService>().appVersion} - API: ${context.watch<ApiService>().host}',
                style: const TextStyle(color: Colors.white24, fontSize: 10),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLogo() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFFF43F5E).withValues(alpha: 0.15),
            shape: BoxShape.circle,
          ),
          child: const Text('₱',
            style: TextStyle(color: Color(0xFFF43F5E), fontSize: 70, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: 24),
        UIUtils.formatBudolPayText(
          'budol₱ay',
          baseStyle: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildPhoneStep() {
    return Column(
      children: [
        const Text('Login to continue', 
          style: TextStyle(color: Colors.white70)),
        const SizedBox(height: 24),
        TextField(
          controller: _phoneController,
          keyboardType: TextInputType.emailAddress,
          style: const TextStyle(color: Colors.white),
          onChanged: _validateIdentifier,
          decoration: _inputDecoration(
            'Mobile or Email', 
            Icons.phone_android, 
            iconColor: Colors.indigoAccent,
            suffixIcon: _checkingIdentifier 
              ? const SizedBox(width: 20, height: 20, child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white70)))
              : !_identifierExists 
                ? const Icon(Icons.error_outline, color: Colors.redAccent)
                : _isPhoneValid ? const Icon(Icons.check_circle_outline, color: Colors.greenAccent) : null,
            errorText: _phoneError,
          ),
        ),
        const SizedBox(height: 24),
        _buildButton('Continue', _handleIdentify, isEnabled: _isPhoneValid),
      ],
    );
  }

  Widget _buildOtpStep() {
    return Column(
      children: [
        const Text('Enter the 6-digit OTP sent to your phone', 
          style: TextStyle(color: Colors.white70)),
        const SizedBox(height: 24),
        TextField(
          controller: _otpController,
          keyboardType: TextInputType.number,
          maxLength: 6,
          style: const TextStyle(color: Colors.white, letterSpacing: 8, fontSize: 24),
          textAlign: TextAlign.center,
          decoration: _inputDecoration('OTP', Icons.lock_clock),
          onChanged: (value) {
            if (value.length == 6 && !_isLoading) {
              _handleVerifyOtp();
            }
          },
        ),
        const SizedBox(height: 24),
        _buildButton('Verify OTP', _handleVerifyOtp),
      ],
    );
  }

  Widget? _buildBiometricSuffixIcons() {
    if (!_isBiometricAvailable && !_hasFaceTemplate) return null;

    final List<Widget> icons = [];

    // Fingerprint Icon
    if (_availableBiometricTypes.contains(BiometricType.fingerprint) || 
        _availableBiometricTypes.contains(BiometricType.strong)) {
      icons.add(
        IconButton(
          onPressed: _handleBiometricLogin,
          icon: Icon(
            Icons.fingerprint,
            color: _isBiometricEnabled ? Colors.white70 : Colors.white24,
            size: 28,
          ),
          tooltip: 'Login with Fingerprint',
        ),
      );
    }

    // Face Icon (OS or Custom)
    if (_availableBiometricTypes.contains(BiometricType.face) || _hasFaceTemplate) {
      icons.add(
        IconButton(
          onPressed: _handleFaceRecognitionLogin,
          icon: Icon(
            Icons.face,
            color: (_isBiometricEnabled || _hasFaceTemplate) ? Colors.white70 : Colors.white24,
            size: 28,
          ),
          tooltip: 'Login with Face Recognition',
        ),
      );
    }

    // Fallback: if isBiometricAvailable is true but types list is empty, 
    // it usually means we can check but haven't enrolled yet, or types list failed.
    // In this case, show fingerprint as a default icon.
    if (icons.isEmpty && _isBiometricAvailable) {
      icons.add(
        IconButton(
          onPressed: _handleBiometricLogin,
          icon: Icon(
            Icons.fingerprint,
            color: _isBiometricEnabled ? Colors.white70 : Colors.white24,
            size: 28,
          ),
          tooltip: 'Login with Biometrics',
        ),
      );
    }

    if (icons.isEmpty) return null;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        ...icons,
        const SizedBox(width: 4),
      ],
    );
  }

  Widget _buildPinStep() {
    return Column(
      children: [
        const Text('Enter your 6-digit PIN', 
          style: TextStyle(color: Colors.white70)),
        const SizedBox(height: 24),
        TextField(
          controller: _pinController,
          keyboardType: TextInputType.number,
          obscureText: true,
          maxLength: 6,
          style: const TextStyle(color: Colors.white, letterSpacing: 8, fontSize: 24),
          textAlign: TextAlign.center,
          decoration: _inputDecoration(
            'PIN', 
            Icons.password,
            suffixIcon: _buildBiometricSuffixIcons(),
          ),
          onChanged: (value) {
            if (value.length == 6 && !_isLoading) {
              _handleVerifyPin();
            }
          },
        ),
        const SizedBox(height: 24),
        _buildButton('Login', _handleVerifyPin),
      ],
    );
  }

  Widget _buildPinSetupStep() {
    return Column(
      children: [
        const Text('Set your 6-digit PIN', 
          style: TextStyle(color: Colors.white70)),
        const SizedBox(height: 8),
        const Text('This will be used for all transactions and logins.', 
          style: TextStyle(color: Colors.white54, fontSize: 12)),
        const SizedBox(height: 24),
        TextField(
          controller: _pinController,
          keyboardType: TextInputType.number,
          obscureText: true,
          maxLength: 6,
          style: const TextStyle(color: Colors.white, letterSpacing: 8, fontSize: 24),
          textAlign: TextAlign.center,
          decoration: _inputDecoration('Create PIN', Icons.lock_outline),
          onChanged: (value) {
            if (value.length == 6 && !_isLoading) {
              _handleSetupPin();
            }
          },
        ),
        const SizedBox(height: 24),
        _buildButton('Set PIN & Login', _handleSetupPin),
      ],
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon, {Color? iconColor, String? errorText, Widget? suffixIcon}) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: iconColor ?? Colors.white70),
      suffixIcon: suffixIcon,
      errorText: errorText,
      labelStyle: const TextStyle(color: Colors.white70),
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.1),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFF43F5E)),
      ),
    );
  }

  Widget _buildButton(String text, VoidCallback onPressed, {bool isEnabled = true}) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: (_isLoading || !isEnabled) ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFF43F5E),
          foregroundColor: Colors.white,
          disabledBackgroundColor: const Color(0xFFF43F5E).withValues(alpha: 0.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: _isLoading ? 0 : 2,
        ),
        child: _isLoading 
          ? const SizedBox(
              height: 24,
              width: 24,
              child: CircularProgressIndicator(
                color: Colors.white,
                strokeWidth: 3,
              ),
            )
          : Text(text, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      ),
    );
  }
}

class PhoneInputFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final text = newValue.text.replaceAll('-', '');
    if (text.length > 11) return oldValue;

    var newText = '';
    for (var i = 0; i < text.length; i++) {
      newText += text[i];
      if ((i == 3 || i == 6) && i != text.length - 1) {
        newText += '-';
      }
    }

    return TextEditingValue(
      text: newText,
      selection: TextSelection.collapsed(offset: newText.length),
    );
  }
}
