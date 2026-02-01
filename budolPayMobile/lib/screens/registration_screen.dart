import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../services/api_service.dart';
import '../constants/routes.dart';

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
    if (phone.length < 10) {
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
    if (email.length < 5 || !email.contains('@')) {
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
        email: _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
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
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () {
            if (_currentStep > 0) {
              _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
            } else {
              Navigator.pop(context);
            }
          },
        ),
        title: const Text('Create Account', style: TextStyle(color: Colors.white)),
      ),
      body: Column(
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
                color: index <= _currentStep ? const Color(0xFFF43F5E) : const Color(0xFF334155),
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
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _isQuickReg = false),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: !_isQuickReg ? Colors.white.withValues(alpha: 0.1) : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'Standard',
                        style: TextStyle(
                          color: !_isQuickReg ? Colors.white : Colors.white60,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _isQuickReg = true),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: _isQuickReg ? const Color(0xFF10B981) : Colors.transparent,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'Quick (Phone Only)',
                        style: TextStyle(
                          color: _isQuickReg ? Colors.white : Colors.white60,
                          fontWeight: FontWeight.bold,
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
            style: const TextStyle(color: Colors.white),
            decoration: _inputDecoration(
              'Phone Number', 
              Icons.phone,
              suffixIcon: _checkingPhone 
                ? const SizedBox(width: 20, height: 20, child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white70)))
                : _phoneExists 
                  ? const Icon(Icons.error_outline, color: Colors.redAccent)
                  : _phoneController.text.length >= 10 ? const Icon(Icons.check_circle_outline, color: Colors.greenAccent) : null,
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
        if (_phoneController.text.length < 10) {
          _showError('Enter a valid phone number');
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
            style: const TextStyle(color: Colors.white),
            decoration: _inputDecoration('First Name', Icons.person),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _lastNameController,
            style: const TextStyle(color: Colors.white),
            decoration: _inputDecoration('Last Name', Icons.person_outline),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            style: const TextStyle(color: Colors.white),
            decoration: _inputDecoration(
              'Email (Optional)', 
              Icons.email,
              suffixIcon: _checkingEmail 
                ? const SizedBox(width: 20, height: 20, child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white70)))
                : _emailExists 
                  ? const Icon(Icons.error_outline, color: Colors.redAccent)
                  : _emailController.text.contains('@') && _emailController.text.length > 5 ? const Icon(Icons.check_circle_outline, color: Colors.greenAccent) : null,
              errorText: _emailExists ? 'This email is already registered in the ecosystem' : null,
            ),
          ),
        ],
      ),
      onNext: () {
        if (_emailExists) {
          _showError('This email is already registered in the ecosystem');
          return;
        }
        if (_firstNameController.text.isNotEmpty && _lastNameController.text.isNotEmpty) {
          _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
        } else {
          _showError('First and last name are required');
        }
      },
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
            style: const TextStyle(color: Colors.white, letterSpacing: 8, fontSize: 24),
            textAlign: TextAlign.center,
            decoration: _inputDecoration('PIN', Icons.lock),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _confirmPinController,
            keyboardType: TextInputType.number,
            obscureText: true,
            maxLength: 6,
            style: const TextStyle(color: Colors.white, letterSpacing: 8, fontSize: 24),
            textAlign: TextAlign.center,
            decoration: _inputDecoration('Confirm PIN', Icons.lock_outline),
          ),
        ],
      ),
      buttonText: 'Complete Registration',
      onNext: _handleRegister,
    );
  }

  Widget _stepContainer({
    required String title,
    required String subtitle,
    required Widget content,
    required VoidCallback onNext,
    String buttonText = 'Continue',
  }) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(subtitle, style: const TextStyle(color: Colors.white70, fontSize: 16)),
          const SizedBox(height: 32),
          content,
          const Spacer(),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _isLoading ? null : onNext,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF43F5E),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _isLoading 
                ? const CircularProgressIndicator(color: Colors.white)
                : Text(buttonText, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon, {Widget? suffixIcon, String? errorText}) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: Colors.white70),
      suffixIcon: suffixIcon,
      errorText: errorText,
      errorStyle: const TextStyle(color: Colors.redAccent),
      labelStyle: const TextStyle(color: Colors.white70),
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.1),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFF43F5E)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: errorText != null ? Colors.redAccent : Colors.white24),
      ),
      counterStyle: const TextStyle(color: Colors.white70),
    );
  }
}
