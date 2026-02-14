import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'dart:io';
import '../services/api_service.dart';
import '../constants/routes.dart';
import '../services/biometric_service.dart';
import '../services/face_embedding_service.dart';
import '../utils/ui_utils.dart';
import 'kyc_verification_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _isBiometricEnabled = false;
  bool _isBiometricAvailable = false;
  bool _hasFaceTemplate = false;
  bool _isLoading = false;
  bool _showDebugWindow = false;
  final List<String> _debugLogs = [];
  StreamSubscription<String>? _logSubscription;

  final ImagePicker _picker = ImagePicker();
  final FaceDetector _faceDetector = FaceDetector(
    options: FaceDetectorOptions(
      enableClassification: true,
      enableTracking: true,
    ),
  );

  @override
  void initState() {
    super.initState();
    _loadBiometricSettings();
    _initDebugLogs();
  }

  @override
  void dispose() {
    _logSubscription?.cancel();
    _faceDetector.close();
    super.dispose();
  }

  void _initDebugLogs() {
    final faceService = context.read<FaceEmbeddingService>();
    _logSubscription = faceService.logStream.listen((log) {
      if (mounted) {
        setState(() {
          _debugLogs.add(log);
          // Keep only the last 100 logs
          if (_debugLogs.length > 100) {
            _debugLogs.removeAt(0);
          }
        });
      }
    });
  }

  Future<void> _loadBiometricSettings() async {
    final biometricService = context.read<BiometricService>();
    final available = await biometricService.isAvailable();
    final enabled = await biometricService.isEnabled();
    final faceTemplate = await biometricService.getStoredFaceTemplate();
    
    if (mounted) {
      setState(() {
        _isBiometricAvailable = available;
        _isBiometricEnabled = enabled;
        _hasFaceTemplate = faceTemplate != null;
      });
    }
  }

  Future<void> _toggleBiometrics(bool value) async {
    final biometricService = context.read<BiometricService>();
    if (value) {
      await biometricService.setEnabled(true);
      if (mounted) {
        setState(() => _isBiometricEnabled = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Biometric login enabled. It will be active after your next manual login.')),
        );
      }
    } else {
      await biometricService.setEnabled(false);
      await biometricService.clearStoredPin();
      if (mounted) {
        setState(() => _isBiometricEnabled = false);
      }
    }
  }

  Future<void> _registerFace() async {
    try {
      final biometricService = context.read<BiometricService>();
      final apiService = context.read<ApiService>();
      String? storedPin = await biometricService.getStoredPin();

      // If PIN is not stored, ask for it
      if (storedPin == null) {
        final userId = apiService.user?['id']?.toString();
        if (userId == null) throw Exception('User session invalid. Please log in again.');

        final pin = await _showPinDialog();
        if (pin == null) return; // User cancelled

        setState(() => _isLoading = true);
        
        try {
          // Verify PIN with server
          await apiService.verifyPin(userId: userId, pin: pin);
          // Store it securely for future biometric use
          await biometricService.storePin(pin);
          storedPin = pin;
        } catch (e) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('PIN Verification failed: $e'), backgroundColor: Colors.red),
            );
          }
          return;
        } finally {
          if (mounted) setState(() => _isLoading = false);
        }
      }

      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice: CameraDevice.front,
      );

      if (photo == null) return;

      setState(() => _isLoading = true);

      final file = File(photo.path);
      final inputImage = InputImage.fromFile(file);

      // 1. Face Detection & Liveness Check
      final faces = await _faceDetector.processImage(inputImage);
      if (faces.isEmpty) {
        throw Exception('No face detected. Please ensure your face is clearly visible and try again.');
      }

      final face = faces.first;
      final bool isBlinking = (face.leftEyeOpenProbability ?? 1.0) < 0.2 || 
                               (face.rightEyeOpenProbability ?? 1.0) < 0.2;
      final bool isSmiling = (face.smilingProbability ?? 0.0) > 0.7;

      // Require at least a clear face. Liveness is a bonus for registration.
      if (!isBlinking && !isSmiling) {
        debugPrint('Face Registration: Liveness check weak, but proceeding (Blink: $isBlinking, Smile: $isSmiling)');
      }

      // 2. Generate Embedding
      if (!mounted) return;
      final faceService = context.read<FaceEmbeddingService>();
      debugPrint('SettingsScreen: Generating embedding for face at ${face.boundingBox}');
      
      List<double>? template;
      try {
        template = await faceService.generateEmbedding(
          file, 
          faceArea: face.boundingBox
        );
      } catch (e) {
        debugPrint('SettingsScreen: Embedding with crop failed: $e. Retrying with full image...');
        // Fallback: try generating embedding from the full image if crop failed
        try {
          template = await faceService.generateEmbedding(file);
        } catch (e2) {
          debugPrint('SettingsScreen: Embedding with full image also failed: $e2');
          throw Exception('AI Inference failed: $e2');
        }
      }

      if (template != null) {
        await biometricService.storeFaceTemplate(template);
        await biometricService.setEnabled(true);
        
        if (mounted) {
          setState(() {
            _hasFaceTemplate = true;
            _isBiometricEnabled = true;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Face login enabled successfully!'), backgroundColor: Colors.green),
          );
        }
      } else {
        debugPrint('SettingsScreen: Face embedding generation returned null without exception');
        throw Exception('Failed to capture face embedding. Please ensure your face is well-lit and try again.');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Face registration failed: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _clearFace() async {
    final biometricService = context.read<BiometricService>();
    await biometricService.clearFaceTemplate();
    if (mounted) {
      setState(() => _hasFaceTemplate = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Face profile cleared.')),
      );
    }
  }

  Future<String?> _showPinDialog() async {
    final TextEditingController pinController = TextEditingController();
    return showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: SingleChildScrollView(
          child: Padding(
            padding: EdgeInsets.only(
              top: 24,
              left: 24,
              right: 24,
              bottom: 24 + MediaQuery.of(context).viewInsets.bottom,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF43F5E).withAlpha(26),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.lock_outline, color: Color(0xFFF43F5E), size: 40),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Verify MPIN',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Please enter your 6-digit MPIN to secure your face profile registration.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: pinController,
                  obscureText: true,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 24, letterSpacing: 8, fontWeight: FontWeight.bold),
                  decoration: InputDecoration(
                    hintText: '••••••',
                    counterText: '',
                    filled: true,
                    fillColor: Colors.grey.withAlpha(26),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          if (pinController.text.length == 6) {
                            Navigator.pop(context, pinController.text);
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF43F5E),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const Text('Verify', style: TextStyle(color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF43F5E).withAlpha(26),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.logout, color: Color(0xFFF43F5E), size: 40),
              ),
              const SizedBox(height: 24),
              const Text(
                'Logout Account',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              const Text(
                'Are you sure you want to log out? You will need to enter your credentials again to access your wallet.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 32),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () async {
                        try {
                          final apiService = Provider.of<ApiService>(context, listen: false);
                          await apiService.logout();
                          if (context.mounted) {
                            Navigator.pushNamedAndRemoveUntil(context, Routes.login, (route) => false);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Logged out successfully'),
                                backgroundColor: Colors.green,
                              ),
                            );
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Logout failed: $e'),
                                backgroundColor: Colors.red,
                              ),
                            );
                          }
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF43F5E),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Logout', style: TextStyle(color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final apiService = Provider.of<ApiService>(context);
    final user = apiService.user;
    
    String userName = 'User';
    String email = '';
    
    if (user != null) {
      final firstName = user['firstName']?.toString() ?? '';
      final lastName = user['lastName']?.toString() ?? '';
      userName = '$firstName $lastName'.trim();
      if (userName.isEmpty) userName = 'User';
      
      email = user['email']?.toString() ?? '';
    }

    final String kycTier = user?['kycTier']?.toString() ?? 'BASIC';
    final String kycStatus = user?['kycStatus']?.toString() ?? 'NONE';
    final bool isFullyVerified = kycTier == 'FULLY_VERIFIED' || kycStatus == 'VERIFIED';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: const Color(0xFFF43F5E),
        foregroundColor: Colors.white,
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            child: Column(
              children: [
                // Profile Header
                Container(
                  padding: const EdgeInsets.all(24),
                  color: Colors.white,
                  child: Row(
                    children: [
                      const CircleAvatar(
                        radius: 35,
                        backgroundColor: Color(0xFFF43F5E),
                        child: Icon(Icons.person, size: 40, color: Colors.white),
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              userName,
                              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                            ),
                            Text(
                              email,
                              style: TextStyle(color: Colors.grey[600]),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: isFullyVerified ? Colors.green[100] : (kycStatus == 'PENDING' ? Colors.blue[100] : Colors.amber[100]),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                isFullyVerified 
                                  ? 'Fully Verified' 
                                  : (kycStatus == 'PENDING' ? 'Under Review' : 'Basic User'),
                                style: TextStyle(
                                  color: isFullyVerified ? Colors.green : (kycStatus == 'PENDING' ? Colors.blue : Colors.amber), 
                                  fontSize: 12, 
                                  fontWeight: FontWeight.bold
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.edit, color: Color(0xFFF43F5E)),
                        onPressed: () {
                          Navigator.pushNamed(context, Routes.editProfile);
                        },
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 8),

                // Settings Groups
                _buildSettingsGroup('Account', [
                  if (!isFullyVerified)
                    _buildSettingsTile(Icons.verified_user, 'Verify Account', 
                      kycStatus == 'PENDING' ? 'Verification in progress' : 'Get higher limits', () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => const KYCVerificationScreen()),
                      );
                    }),
                  _buildSettingsTile(Icons.phone_android, 'Change Phone Number', 'Update your registered number', () {
                    Navigator.pushNamed(context, Routes.changePhoneNumber);
                  }),
                  _buildSettingsTile(Icons.lock, 'Change MPIN', 'Secure your wallet', () {
                    Navigator.pushNamed(context, Routes.changeMpin);
                  }),
                  if (_isBiometricAvailable)
                    _buildSettingsTile(
                      Icons.fingerprint, 
                      'Biometric Login', 
                      _isBiometricEnabled ? 'Enabled' : 'Fast & secure', 
                      null, 
                      trailing: Switch(
                        value: _isBiometricEnabled, 
                        onChanged: _toggleBiometrics,
                        activeThumbColor: Colors.blue,
                      )
                    ),
                  if (_isBiometricAvailable)
                    _buildSettingsTile(
                      Icons.face, 
                      'Face Recognition Login', 
                      _hasFaceTemplate ? 'Face Registered' : 'Setup face login', 
                      _isLoading ? null : (_hasFaceTemplate ? _clearFace : _registerFace),
                      trailing: _isLoading 
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : (_hasFaceTemplate 
                            ? const Icon(Icons.delete_outline, color: Colors.red) 
                            : const Icon(Icons.add_a_photo, color: Colors.blue)),
                    ),
                  _buildSettingsTile(
                    Icons.bug_report_outlined, 
                    'Face Registration Debug', 
                    _showDebugWindow ? 'Hide Logs' : 'Show Logs', 
                    () => setState(() => _showDebugWindow = !_showDebugWindow),
                    trailing: Icon(
                      _showDebugWindow ? Icons.visibility_off : Icons.visibility,
                      color: _showDebugWindow ? Colors.orange : Colors.grey,
                    ),
                  ),
                ]),

                _buildSettingsGroup('General', [
                  _buildSettingsTile(Icons.notifications, 'Notifications', 'Manage alerts', () {}),
                  _buildSettingsTile(Icons.language, 'Language', 'English', () {}),
                  _buildSettingsTile(Icons.dns, 'Gateway Host', apiService.host, () => UIUtils.showHostConfigDialog(context)),
                  _buildSettingsTile(Icons.help, 'Help Center', 'FAQs & Support', () {}),
                ]),

                _buildSettingsGroup('About', [
                  _buildSettingsTile(Icons.info, 'Terms & Conditions', '', () {}),
                  _buildSettingsTile(Icons.privacy_tip, 'Privacy Policy', '', () {}),

                ]),

                // Logout Button
                Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: ElevatedButton.icon(
                    onPressed: () => _showLogoutDialog(context),
                    icon: const Icon(Icons.logout, color: Colors.white),
                    label: const Text('Logout Account', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF43F5E),
                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 32),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
          
          // Debug Log Window Overlay (Full Screen)
          if (_showDebugWindow)
            Positioned.fill(
              child: Container(
                decoration: const BoxDecoration(
                  color: Color(0xFF1E293B), // Professional dark background
                ),
                child: SafeArea(
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.black.withAlpha(50),
                          border: Border(bottom: BorderSide(color: Colors.white.withAlpha(30))),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.bug_report, color: Colors.redAccent, size: 20),
                                SizedBox(width: 12),
                                Text(
                                  'Face Service Debug Logs',
                                  style: TextStyle(
                                    color: Colors.white, 
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                              ],
                            ),
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.delete_sweep, color: Colors.white70),
                                  onPressed: () => setState(() => _debugLogs.clear()),
                                  tooltip: 'Clear logs',
                                ),
                                IconButton(
                                  icon: const Icon(Icons.close, color: Colors.white),
                                  onPressed: () => setState(() => _showDebugWindow = false),
                                  tooltip: 'Close',
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Container(
                          margin: const EdgeInsets.all(12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.black.withAlpha(100),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.white.withAlpha(20)),
                          ),
                          child: _debugLogs.isEmpty
                            ? const Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.terminal, color: Colors.white24, size: 48),
                                    SizedBox(height: 16),
                                    Text(
                                      'No logs yet. Try starting face registration.',
                                      style: TextStyle(color: Colors.white54),
                                    ),
                                  ],
                                ),
                              )
                            : ListView.builder(
                                padding: EdgeInsets.zero,
                                reverse: true,
                                itemCount: _debugLogs.length,
                                itemBuilder: (context, index) {
                                  final log = _debugLogs[_debugLogs.length - 1 - index];
                                  final isError = log.toLowerCase().contains('failed') || log.toLowerCase().contains('error') || log.toLowerCase().contains('exception');
                                  
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 6),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          '${_debugLogs.length - index}'.padLeft(3, '0'),
                                          style: TextStyle(
                                            color: Colors.white.withAlpha(50),
                                            fontFamily: 'monospace',
                                            fontSize: 10,
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Text(
                                            log,
                                            style: TextStyle(
                                              color: isError ? Colors.redAccent : Colors.greenAccent,
                                              fontFamily: 'monospace',
                                              fontSize: 12,
                                              height: 1.4,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                'TFLite Model: assets/models/facenet.tflite',
                                style: TextStyle(color: Colors.white.withAlpha(100), fontSize: 10),
                              ),
                            ),
                            Text(
                              'Logs: ${_debugLogs.length}',
                              style: TextStyle(color: Colors.white.withAlpha(100), fontSize: 10),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSettingsGroup(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
          child: Text(
            title,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
        ),
        Container(
          color: Colors.white,
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildSettingsTile(IconData icon, String title, String subtitle, VoidCallback? onTap, {Widget? trailing}) {
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, color: const Color(0xFFF43F5E)),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
      subtitle: subtitle.isNotEmpty ? Text(subtitle) : null,
      trailing: trailing ?? (onTap != null ? const Icon(Icons.chevron_right) : null),
    );
  }
}
