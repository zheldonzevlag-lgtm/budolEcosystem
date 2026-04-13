import 'package:flutter/material.dart';
import 'dart:ui';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../services/api_service.dart';
import '../constants/routes.dart';
import '../utils/brand_colors.dart';

class RegistrationScreen extends StatefulWidget {
  const RegistrationScreen({super.key});

  @override
  State<RegistrationScreen> createState() => _RegistrationScreenState();
}

class _RegistrationScreenState extends State<RegistrationScreen> {
  final PageController _pageController = PageController();
  int _currentStep = 0;
  bool _isLoading = false;
  bool _isQuickReg = true; // Default to Quick as per Shopee best practice

  // Real-time validation states
  bool _phoneExists = false;
  bool _emailExists = false;
  bool _checkingPhone = false;
  bool _checkingEmail = false;
  Timer? _debounceTimer;

  // Step 1: Phone
  final TextEditingController _phoneController = TextEditingController();
  
  // Step 2: Profile
  final TextEditingController _firstNameController = TextEditingController();
  final TextEditingController _lastNameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  
  // Validation Helpers
  static final RegExp _emailRegex = RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');

  bool get _isEmailValid => 
    _emailRegex.hasMatch(_emailController.text) && 
    !_emailExists && 
    !_checkingEmail;
    
  bool get _isPasswordComplex => 
    RegExp(r'^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#\$&*~]).{8,}$').hasMatch(_passwordController.text);
    
  bool get _passwordsMatch => 
    _passwordController.text.isNotEmpty && 
    _passwordController.text == _confirmPasswordController.text;
    
  bool get _namesValid => 
    _firstNameController.text.trim().isNotEmpty && 
    _lastNameController.text.trim().isNotEmpty;
    
  bool get _isProfileFormValid => 
    _isEmailValid && _isPasswordComplex && _passwordsMatch && _namesValid;

  // Step 3: PIN
  final TextEditingController _pinController = TextEditingController();
  final TextEditingController _confirmPinController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = ModalRoute.of(context)?.settings.arguments as Map?;
      if (args != null && args['phoneNumber'] != null) {
        _phoneController.text = args['phoneNumber'].toString();
        _checkPhone(_phoneController.text);
      }
    });

    _phoneController.addListener(_onPhoneChanged);
    _emailController.addListener(_onEmailChanged);
    
    // Listen to changes for validation
    _firstNameController.addListener(() => setState(() {}));
    _lastNameController.addListener(() => setState(() {}));
    _passwordController.addListener(() => setState(() {}));
    _confirmPasswordController.addListener(() => setState(() {}));
  }

  void _onPhoneChanged() {
    if (_debounceTimer?.isActive ?? false) _debounceTimer!.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 800), () {
      _checkPhone(_phoneController.text);
    });
  }

  void _onEmailChanged() {
    if (_debounceTimer?.isActive ?? false) _debounceTimer!.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 800), () {
      _checkEmail(_emailController.text);
    });
  }

  Future<void> _checkPhone(String phone) async {
    // Strictly enforce PH phone format: 09XXXXXXXXX (11 digits) or 9XXXXXXXXX (10 digits)
    final RegExp phoneRegex = RegExp(r'^(09|9)\d{9}$');
    
    if (!phoneRegex.hasMatch(phone)) {
      setState(() {
        _phoneExists = false;
        _checkingPhone = false;
      });
      return;
    }

    setState(() => _checkingPhone = true);
    try {
      final result = await context.read<ApiService>().checkPhone(phone);
      if (mounted) {
        setState(() {
          _phoneExists = result['exists'] ?? false;
          _checkingPhone = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _checkingPhone = false);
    }
  }

  Future<void> _checkEmail(String email) async {
    if (!_emailRegex.hasMatch(email)) {
      setState(() {
        _emailExists = false;
        _checkingEmail = false;
      });
      return;
    }

    setState(() => _checkingEmail = true);
    try {
      final result = await context.read<ApiService>().checkEmail(email);
      if (mounted) {
        setState(() {
          _emailExists = result['exists'] ?? false;
          _checkingEmail = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _checkingEmail = false);
    }
  }

  @override
  void dispose() {
    _phoneController.removeListener(_onPhoneChanged);
    _emailController.removeListener(_onEmailChanged);
    _debounceTimer?.cancel();
    _pageController.dispose();
    _phoneController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _pinController.dispose();
    _confirmPinController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (_pinController.text != _confirmPinController.text) {
      _showError('PINs do not match');
      return;
    }
    if (_pinController.text.length != 6) {
      _showError('PIN must be 6 digits');
      return;
    }

    setState(() => _isLoading = true);
    try {
      await context.read<ApiService>().register(
        phoneNumber: _phoneController.text.trim(),
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        pin: _pinController.text.trim(),
      );
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Registration successful! Please login.'), backgroundColor: Colors.green),
        );
        Navigator.pushNamedAndRemoveUntil(context, Routes.login, (route) => false);
      }
    } catch (e) {
      _showError(e.toString());
    } finally {
      setState(() => _isLoading = false);
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
      backgroundColor: BrandColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Theme.of(context).colorScheme.onSurface),
          onPressed: () {
            if (_currentStep > 0) {
              _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
            } else {
              Navigator.pop(context);
            }
          },
        ),
        title: GestureDetector(
          onLongPress: () => Navigator.pushNamed(context, Routes.debugConsole),
          child: Text('Create Account', style: TextStyle(color: Theme.of(context).colorScheme.onSurface)),
        ),
      ),
      body: Stack(
        children: [
          _buildMeshBackground(),
          _buildGlassOverlay(),
          Column(
            children: [
              _buildProgressIndicator(),
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  onPageChanged: (i) => setState(() => _currentStep = i),
                  children: [
                    _buildPhoneStep(),
                    _buildProfileStep(),
                    _buildPinStep(),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Row(
        children: List.generate(3, (index) {
          return Expanded(
            child: Container(
              height: 4,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                color: index <= _currentStep ? BrandColors.accent : Theme.of(context).colorScheme.outlineVariant.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildPhoneStep() {
    return _stepContainer(
      title: _isQuickReg ? 'Join us today' : 'What\'s your number?',
      subtitle: _isQuickReg 
        ? 'Quick registration will generate a temporary profile. You can complete your KYC later.'
        : 'We\'ll use this to secure your account.',
      content: Column(
        children: [
          // Registration Type Toggle (Shopee Style)
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Theme.of(context).colorScheme.outline.withValues(alpha: 0.1)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _isQuickReg = false),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: !_isQuickReg ? Theme.of(context).colorScheme.primary : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'Standard',
                        maxLines: 1,
                        style: TextStyle(
                          color: !_isQuickReg ? Theme.of(context).colorScheme.onPrimary : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _isQuickReg = true),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: _isQuickReg ? BrandColors.accent : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'Quick (Phone Only)',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: _isQuickReg ? BrandColors.primaryDark : Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.6),
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(11),
            ],
            decoration: _inputDecoration(
              'Phone Number', 
              Icons.phone_android,
              suffixIcon: _checkingPhone 
                ? const SizedBox(width: 20, height: 20, child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white70)))
                : _phoneExists 
                  ? const Icon(Icons.error_outline, color: Colors.redAccent)
                  : RegExp(r'^(09|9)\d{9}$').hasMatch(_phoneController.text) ? const Icon(Icons.check_circle_outline, color: Colors.greenAccent) : null,
              errorText: _phoneExists ? 'This number is already registered' : null,
            ),
          ),
        ],
      ),
      buttonText: _isQuickReg ? 'Create Account' : 'Continue',
      onNext: () async {
        if (_phoneExists) {
          _showError('This phone number is already taken');
          return;
        }
        
        final String phone = _phoneController.text.trim();
        final RegExp phoneRegex = RegExp(r'^(09|9)\d{9}$');
        
        if (!phoneRegex.hasMatch(phone)) {
          _showError('Enter a valid phone number (e.g. 09123456789)');
          return;
        }

        if (_isQuickReg) {
          await _handleQuickRegister();
        } else {
          _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
        }
      },
    );
  }

  Future<void> _handleQuickRegister() async {
    setState(() => _isLoading = true);
    try {
      final result = await context.read<ApiService>().quickRegister(
        phoneNumber: _phoneController.text.trim(),
      );
      
      if (mounted) {
        // We reuse LoginScreen's OTP step for quick registration verification.
        // We push login with the userId and initialStep set to OTP.
        Navigator.pushNamed(
          context, 
          Routes.login, 
          arguments: {
            'userId': result['userId'],
            'phoneNumber': _phoneController.text.trim(),
            'initialStep': 'OTP',
            'type': 'REGISTRATION' // Backend will handle the registration verification type
          }
        );
      }
    } catch (e) {
      _showError(e.toString());
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Widget _buildProfileStep() {
    return _stepContainer(
      title: 'Tell us about yourself',
      subtitle: 'Your legal name for financial transactions.',
      content: Column(
        children: [
          TextField(
            controller: _firstNameController,
            textCapitalization: TextCapitalization.words,
            decoration: _inputDecoration('First Name', Icons.person),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _lastNameController,
            textCapitalization: TextCapitalization.words,
            decoration: _inputDecoration('Last Name', Icons.person_outline),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: _inputDecoration(
              'Email', 
              Icons.email,
              suffixIcon: _checkingEmail 
                ? const SizedBox(width: 20, height: 20, child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white70)))
                : _emailExists 
                  ? const Icon(Icons.error_outline, color: Colors.redAccent)
                  : _isEmailValid ? const Icon(Icons.check_circle_outline, color: Colors.greenAccent) : null,
              errorText: _emailExists 
                ? 'This email is already registered' 
                : (_emailController.text.isNotEmpty && !_isEmailValid) ? 'Invalid email format' : null,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            decoration: _inputDecoration(
              'Password', 
              Icons.lock,
              suffixIcon: IconButton(
                icon: Icon(_obscurePassword ? Icons.visibility : Icons.visibility_off, color: Theme.of(context).colorScheme.onSurfaceVariant),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
              ),
              errorText: (_passwordController.text.isNotEmpty && !_isPasswordComplex) 
                ? 'Min 8 chars, Upper, Lower, Digit, Special' 
                : null,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _confirmPasswordController,
            obscureText: _obscureConfirmPassword,
            decoration: _inputDecoration(
              'Confirm Password', 
              Icons.lock_outline,
              suffixIcon: IconButton(
                icon: Icon(_obscureConfirmPassword ? Icons.visibility : Icons.visibility_off, color: Theme.of(context).colorScheme.onSurfaceVariant),
                onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
              ),
              errorText: (_confirmPasswordController.text.isNotEmpty && !_passwordsMatch)
                ? 'Passwords do not match'
                : null,
            ),
          ),
        ],
      ),
      onNext: _isProfileFormValid ? () {
        _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
      } : null,
    );
  }

  Widget _buildPinStep() {
    return _stepContainer(
      title: 'Set your 6-digit PIN',
      subtitle: 'This will be used for all transactions and logins.',
      content: Column(
        children: [
          TextField(
            controller: _pinController,
            keyboardType: TextInputType.number,
            obscureText: true,
            maxLength: 6,
            style: TextStyle(letterSpacing: 8, fontSize: 24, color: Theme.of(context).colorScheme.onSurface),
            textAlign: TextAlign.center,
            decoration: _inputDecoration('PIN', Icons.lock),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _confirmPinController,
            keyboardType: TextInputType.number,
            obscureText: true,
            maxLength: 6,
            style: TextStyle(letterSpacing: 8, fontSize: 18, color: Theme.of(context).colorScheme.onSurface),
            textAlign: TextAlign.center,
            decoration: _inputDecoration('Confirm PIN', Icons.lock_outline),
          ),
        ],
      ),
      buttonText: 'Complete Registration',
      onNext: _handleRegister,
    );
  }

  Widget _buildMeshBackground() {
    return Container(
      color: const Color(0xFF0F172A), // Midnight Base
      child: Stack(
        children: [
          _buildBlob(
            color: BrandColors.primary.withValues(alpha: 0.1),
            top: -100,
            right: -50,
            size: 350,
          ),
          _buildBlob(
            color: const Color(0xFF991B1B).withValues(alpha: 0.08),
            bottom: -150,
            left: -100,
            size: 500,
          ),
        ],
      ),
    );
  }

  Widget _buildBlob({required Color color, double? top, double? left, double? right, double? bottom, required double size}) {
    return Positioned(
      top: top,
      left: left,
      right: right,
      bottom: bottom,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [color, color.withValues(alpha: 0)],
          ),
        ),
      ),
    );
  }

  Widget _buildGlassOverlay() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.1),
      ),
    );
  }

  Widget _stepContainer({
    required String title,
    required String subtitle,
    required Widget content,
    VoidCallback? onNext,
    String buttonText = 'Continue',
  }) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(24),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(32),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.02),
              borderRadius: BorderRadius.circular(32),
              border: Border.all(color: Colors.white.withValues(alpha: 0.1), width: 1.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(title, style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(subtitle, style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant.withValues(alpha: 0.8), fontSize: 14)),
                const SizedBox(height: 32),
                content,
                const SizedBox(height: 48),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: (_isLoading || onNext == null) ? null : onNext,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      foregroundColor: Theme.of(context).colorScheme.onPrimary,
                      disabledBackgroundColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.12),
                      disabledForegroundColor: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.38),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: _isLoading ? 0 : 4,
                      shadowColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.3),
                    ),
                    child: _isLoading 
                      ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 3)
                      : Text(buttonText, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon, {Widget? suffixIcon, String? errorText}) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: Theme.of(context).colorScheme.primary),
      suffixIcon: suffixIcon,
      errorText: errorText,
      // WHY: Allow global theme to set decoration details.
    );
  }
}
