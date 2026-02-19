import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _emailController;
  bool _isLoading = false;
  bool _obscureFirstName = true;
  bool _obscureLastName = true;
  bool _emailInitialized = false;
  bool _firstNameDirty = false;
  bool _lastNameDirty = false;

  @override
  void initState() {
    super.initState();
    // Setup listener for real-time updates
    final apiService = context.read<ApiService>();
    apiService.addListener(_onUserUpdate);

    // Force refresh from server to ensure we have the latest email/profile data
    WidgetsBinding.instance.addPostFrameCallback((_) {
      apiService.fetchUserProfile();
    });

    _initializeControllers(apiService.user);
  }

  @override
  void dispose() {
    context.read<ApiService>().removeListener(_onUserUpdate);
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  void _initializeControllers(Map<String, dynamic>? user) {
    if (user != null) {
      _firstNameController = TextEditingController(text: user['firstName'] ?? '');
      _lastNameController = TextEditingController(text: user['lastName'] ?? '');
      
      final email = user['email'];
      _emailController = TextEditingController(text: email ?? '');
      if (email != null && email.toString().isNotEmpty) {
        _emailInitialized = true;
      }
    } else {
      _firstNameController = TextEditingController();
      _lastNameController = TextEditingController();
      _emailController = TextEditingController();
    }
  }

  void _onUserUpdate() {
    final user = context.read<ApiService>().user;
    if (user != null && mounted) {
      setState(() {
        // Update fields if they are empty OR if they haven't been edited by the user (not dirty)
        // This ensures that if we loaded cached masked data (e.g. "M*****"), we replace it with fresh unmasked data
        if (!_firstNameDirty && (user['firstName']?.isNotEmpty ?? false)) {
           if (_firstNameController.text != user['firstName']) {
             _firstNameController.text = user['firstName']!;
           }
        }
        
        if (!_lastNameDirty && (user['lastName']?.isNotEmpty ?? false)) {
           if (_lastNameController.text != user['lastName']) {
             _lastNameController.text = user['lastName']!;
           }
        }
        
        // Special handling for email to avoid overwriting user edits/clears
        // Only fill if we haven't initialized it yet and the field is empty
        if (!_emailInitialized && (user['email']?.isNotEmpty ?? false)) {
          if (_emailController.text.isEmpty) {
            _emailController.text = user['email']!;
            _emailInitialized = true;
          } else {
             // User already typed something, mark as initialized to avoid future overwrites
             _emailInitialized = true; 
          }
        }
      });
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Logic moved to _onUserUpdate via addListener
  }

  Future<void> _handleUpdate() async {
    if (!_formKey.currentState!.validate()) return;

    // Safety Check: Prevent saving if data appears to be masked (contains asterisks)
    // This prevents overwriting valid DB data with masked "M*****" values
    if (_firstNameController.text.contains('*') || _lastNameController.text.contains('*')) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Cannot save masked data. Please wait for profile to fully load.'),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 4),
          ),
        );
        // Try to fetch fresh data again
        context.read<ApiService>().fetchUserProfile();
      }
      return;
    }

    setState(() => _isLoading = true);
    try {
      await context.read<ApiService>().updateProfile(
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        email: _emailController.text.trim(),
      );
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully'), backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<ApiService>().user;
    final bool isFullyVerified = user?['kycTier'] == 'FULLY_VERIFIED';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Edit Profile', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFFF43F5E),
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Stack(
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: const Color(0xFFF43F5E).withValues(alpha: 0.1),
                      child: Text(
                        (user?['firstName']?[0] ?? '') + (user?['lastName']?[0] ?? ''),
                        style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFFF43F5E)),
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Color(0xFFF43F5E),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              
              if (isFullyVerified)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: Colors.blue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.blue.withValues(alpha: 0.3)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.blue, size: 20),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Your account is fully verified. Legal name changes require manual review. Please contact support.',
                          style: TextStyle(color: Colors.blue, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),

              const Text('First Name', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
              const SizedBox(height: 8),
              TextFormField(
                controller: _firstNameController,
                readOnly: isFullyVerified,
                obscureText: _obscureFirstName,
                onChanged: (value) => _firstNameDirty = true,
                decoration: InputDecoration(
                  hintText: 'Enter your first name',
                  filled: true,
                  fillColor: isFullyVerified ? Colors.grey[100] : Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  suffixIcon: IconButton(
                    icon: Icon(_obscureFirstName ? Icons.visibility : Icons.visibility_off, color: Colors.grey),
                    onPressed: () => setState(() => _obscureFirstName = !_obscureFirstName),
                  ),
                ),
                validator: (value) => value == null || value.isEmpty ? 'Please enter first name' : null,
              ),
              const SizedBox(height: 16),

              const Text('Last Name', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
              const SizedBox(height: 8),
              TextFormField(
                controller: _lastNameController,
                readOnly: isFullyVerified,
                obscureText: _obscureLastName,
                onChanged: (value) => _lastNameDirty = true,
                decoration: InputDecoration(
                  hintText: 'Enter your last name',
                  filled: true,
                  fillColor: isFullyVerified ? Colors.grey[100] : Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  suffixIcon: IconButton(
                    icon: Icon(_obscureLastName ? Icons.visibility : Icons.visibility_off, color: Colors.grey),
                    onPressed: () => setState(() => _obscureLastName = !_obscureLastName),
                  ),
                ),
                validator: (value) => value == null || value.isEmpty ? 'Please enter last name' : null,
              ),
              const SizedBox(height: 16),

              const Text('Email Address', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
              const SizedBox(height: 8),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  hintText: 'Enter your email',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Please enter email';
                  if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) return 'Please enter a valid email';
                  return null;
                },
              ),
              const SizedBox(height: 40),

              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleUpdate,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF43F5E),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('Save Changes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
