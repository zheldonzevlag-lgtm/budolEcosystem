import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import '../services/face_embedding_service.dart';
import 'package:latlong2/latlong.dart';
import '../utils/timezone_utils.dart';
import '../widgets/map_picker.dart';
import 'kyc_capture_screen.dart';


class KYCVerificationScreen extends StatefulWidget {
  const KYCVerificationScreen({super.key});

  @override
  State<KYCVerificationScreen> createState() => _KYCVerificationScreenState();
}

class _KYCVerificationScreenState extends State<KYCVerificationScreen> {
  final PageController _pageController = PageController();
  int _currentStep = 0;
  final ImagePicker _picker = ImagePicker();
  
  File? _idFrontImage;
  File? _selfieImage;
  bool _isUploading = false;
  bool _isProcessingML = false;
  
  // Liveness Detection State
  bool _hasBlinked = false;
  bool _hasSmiled = false;
  String _livenessPrompt = 'Please center your face';
  List<double>? _faceTemplate;

  // Personal Info Controllers
  final _nameController = TextEditingController();
  final _dobController = TextEditingController();
  final _sourceController = TextEditingController();
  final _addressController = TextEditingController();

  final TextRecognizer _textRecognizer = TextRecognizer();
  final FaceDetector _faceDetector = FaceDetector(
    options: FaceDetectorOptions(
      enableContours: true,
      enableClassification: true,
    ),
  );

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2000),
      firstDate: DateTime(1900),
      lastDate: TimezoneUtils.getManilaNow(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFFF43F5E),
              onPrimary: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _dobController.text = DateFormat('MM-dd-yyyy').format(picked);
      });
    }
  }

  Future<void> _pinAddress() async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    final LatLng? result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MapPicker(settings: apiService.systemSettings),
      ),
    );

    if (result != null) {
      if (!mounted) return;
      setState(() {
        _addressController.text = "${result.latitude.toStringAsFixed(6)}, ${result.longitude.toStringAsFixed(6)}";
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Location pinned successfully!')),
      );
    }
  }

  @override
  void dispose() {
    _textRecognizer.close();
    _faceDetector.close();
    _nameController.dispose();
    _dobController.dispose();
    _sourceController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _processImageML(File file, bool isSelfie) async {
    setState(() => _isProcessingML = true);
    try {
      final inputImage = InputImage.fromFile(file);
      
      if (isSelfie) {
        final faces = await _faceDetector.processImage(inputImage);
        if (faces.isEmpty) {
          throw Exception('No face detected. Please take a clearer selfie.');
        }
        
        final face = faces.first;
        
        // Check Liveness (Blink & Smile)
        bool blinkDetected = false;
        if (face.leftEyeOpenProbability != null && face.rightEyeOpenProbability != null) {
          // A blink is typically < 0.2 probability
          if (face.leftEyeOpenProbability! < 0.2 || face.rightEyeOpenProbability! < 0.2) {
            blinkDetected = true;
          }
        }

        bool smileDetected = false;
        if (face.smilingProbability != null) {
          if (face.smilingProbability! > 0.7) {
            smileDetected = true;
          }
        }

        setState(() {
          if (blinkDetected) _hasBlinked = true;
          if (smileDetected) _hasSmiled = true;
          
          if (!_hasBlinked) {
            _livenessPrompt = 'Please blink your eyes';
          } else if (!_hasSmiled) {
            _livenessPrompt = 'Now, please give us a big smile!';
          } else {
            _livenessPrompt = 'Liveness verified! You look great.';
          }
        });

        if (!_hasBlinked || !_hasSmiled) {
           throw Exception('Liveness verification incomplete: $_livenessPrompt');
         }
 
         // Phase 2: Generate Face Embedding
         if (!mounted) return;
         final faceEmbeddingService = Provider.of<FaceEmbeddingService>(context, listen: false);
         final embedding = await faceEmbeddingService.generateEmbedding(file);
         
         if (embedding != null) {
           setState(() => _faceTemplate = embedding);
           debugPrint('[KYC] Face embedding generated successfully');
         } else {
           debugPrint('[KYC] Warning: Failed to generate face embedding');
         }
 
         debugPrint('[KYC] Face detected & Liveness verified');
      } else {
        final RecognizedText recognizedText = await _textRecognizer.processImage(inputImage);
        debugPrint('[KYC] OCR Text: ${recognizedText.text}');
        
        // Basic heuristic to find a name-like string (all caps, multi-word)
        // In a real app, this would be much more sophisticated or use a specialized ID model
        final lines = recognizedText.text.split('\n');
        for (var line in lines) {
          if (line.length > 5 && line == line.toUpperCase() && line.contains(' ')) {
            if (_nameController.text.isEmpty) {
              setState(() => _nameController.text = line);
              break;
            }
          }
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Verification Error: $e')),
      );
      // Reset image if verification fails
      setState(() {
        if (isSelfie) {
          _selfieImage = null;
        } else {
          _idFrontImage = null;
        }
      });
    } finally {
      setState(() => _isProcessingML = false);
    }
  }

  Future<void> _pickImage(ImageSource source, bool isSelfie) async {
    try {
      String? imagePath;

      if (source == ImageSource.camera) {
        // Use custom KYCCaptureScreen for both ID and Selfie to get guidance frames
        imagePath = await Navigator.push<String>(
          context,
          MaterialPageRoute(
            builder: (context) => KYCCaptureScreen(
              captureType: isSelfie ? KYCCaptureType.face : KYCCaptureType.idCard,
            ),
          ),
        );
      } else {
        // Fallback to standard ImagePicker for gallery uploads
        final XFile? pickedFile = await _picker.pickImage(
          source: source,
          maxWidth: 1024,
          maxHeight: 1024,
          imageQuality: 85,
        );
        imagePath = pickedFile?.path;
      }

      if (imagePath != null) {
        final file = File(imagePath);
        setState(() {
          if (isSelfie) {
            _selfieImage = file;
          } else {
            _idFrontImage = file;
          }
        });
        
        // Trigger ML processing
        await _processImageML(file, isSelfie);
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to pick image: $e')),
      );
    }
  }

  Future<void> _uploadDocument(File file, String type, {List<double>? template}) async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    final userId = apiService.currentUser?['id'];
    
    if (userId == null) return;

    try {
      final uri = Uri.parse('${apiService.baseUrl}/verification/upload');
      final request = http.MultipartRequest('POST', uri)
        ..fields['userId'] = userId
        ..fields['type'] = type
        ..fields['documentType'] = 'GOVERNMENT_ID';
      
      if (template != null) {
        request.fields['faceTemplate'] = template.join(',');
      }

      request.files.add(await http.MultipartFile.fromPath(
          'document',
          file.path,
          contentType: MediaType('image', 'jpeg'),
        ));

      final response = await request.send();
      
      if (response.statusCode == 201) {
        debugPrint('[KYC] Upload successful for $type');
      } else {
        throw Exception('Upload failed with status ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('[KYC] Upload error: $e');
      rethrow;
    }
  }

  void _nextStep() async {
    if (_currentStep == 0) {
      if (_nameController.text.isEmpty || _dobController.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please fill in all personal details')),
        );
        return;
      }
      _goToNextPage();
    } else if (_currentStep == 1) {
      if (_idFrontImage == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please scan your government ID')),
        );
        return;
      }
      _goToNextPage();
    } else if (_currentStep == 2) {
      if (_selfieImage == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please take a selfie')),
        );
        return;
      }
      
      // Final submission
      try {
        await _submitApplication();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Submission failed: $e')),
        );
      }
    }
  }

  void _goToNextPage() {
    _pageController.nextPage(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
    setState(() => _currentStep++);
  }

  Future<void> _submitApplication() async {
    setState(() => _isUploading = true);
    
    try {
      // 1. Upload ID
      if (_idFrontImage != null) {
        await _uploadDocument(_idFrontImage!, 'ID_FRONT');
      }
      
      // 2. Upload Selfie
      if (_selfieImage != null) {
        await _uploadDocument(_selfieImage!, 'SELFIE', template: _faceTemplate);
      }

      _showSuccessDialog();
    } catch (e) {
      rethrow;
    } finally {
      setState(() => _isUploading = false);
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle, color: Colors.green, size: 80),
            const SizedBox(height: 24),
            const Text(
              'Application Submitted',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            const Text(
              'Your verification documents are being reviewed. This usually takes 24-48 hours.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                Navigator.pop(context); // Return to settings
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF43F5E),
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Back to Settings', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Account Verification'),
        backgroundColor: const Color(0xFFF43F5E),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Progress Indicator
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Row(
              children: [
                _buildStepIndicator(0, 'Info'),
                _buildStepDivider(),
                _buildStepIndicator(1, 'ID Scan'),
                _buildStepDivider(),
                _buildStepIndicator(2, 'Selfie'),
              ],
            ),
          ),

          // Steps
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _buildPersonalInfoStep(),
                _buildIDUploadStep(),
                _buildSelfieStep(),
              ],
            ),
          ),

          // Action Button
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: ElevatedButton(
              onPressed: (_isUploading || _isProcessingML) ? null : _nextStep,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF43F5E),
                minimumSize: const Size(double.infinity, 56),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: (_isUploading || _isProcessingML)
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : Text(
                      _currentStep == 2 ? 'Submit Application' : 'Next Step',
                      style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepIndicator(int step, String label) {
    bool isActive = _currentStep >= step;
    return Column(
      children: [
        CircleAvatar(
          radius: 15,
          backgroundColor: isActive ? const Color(0xFFF43F5E) : Colors.grey[300],
          child: isActive && _currentStep > step
              ? const Icon(Icons.check, size: 16, color: Colors.white)
              : Text('${step + 1}', style: TextStyle(color: isActive ? Colors.white : Colors.grey, fontSize: 12)),
        ),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 10, color: isActive ? const Color(0xFFF43F5E) : Colors.grey)),
      ],
    );
  }

  Widget _buildStepDivider() {
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.only(bottom: 15),
        color: Colors.grey[300],
      ),
    );
  }

  Widget _buildPersonalInfoStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Personal Information', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Please ensure your details match your government ID.', style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 32),
          _buildTextField('Full Name', 'Enter your full name', _nameController),
          const SizedBox(height: 20),
          _buildTextField(
            'Date of Birth',
            'MM-DD-YYYY',
            _dobController,
            suffixIcon: IconButton(
              icon: const Icon(Icons.calendar_today, color: Color(0xFFF43F5E)),
              onPressed: () => _selectDate(context),
            ),
            keyboardType: TextInputType.datetime,
          ),
          const SizedBox(height: 20),
          _buildTextField('Source of Funds', 'e.g., Salary, Business', _sourceController),
          const SizedBox(height: 20),
          _buildTextField(
            'Present Address',
            'Enter your full address',
            _addressController,
            suffixIcon: TextButton.icon(
              onPressed: _pinAddress,
              icon: const Icon(Icons.location_on, size: 18, color: Color(0xFFF43F5E)),
              label: const Text('Pin', style: TextStyle(color: Color(0xFFF43F5E))),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIDUploadStep() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Government ID Scan', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Upload a clear photo of your valid ID.', style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 32),
          GestureDetector(
            onTap: () => _pickImage(ImageSource.camera, false),
            child: Container(
              width: double.infinity,
              height: 200,
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _idFrontImage != null ? const Color(0xFFF43F5E) : Colors.grey[300]!,
                  style: BorderStyle.solid,
                  width: _idFrontImage != null ? 2 : 1,
                ),
                image: _idFrontImage != null
                    ? DecorationImage(image: FileImage(_idFrontImage!), fit: BoxFit.cover)
                    : null,
              ),
              child: _idFrontImage == null
                  ? const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.camera_alt, size: 48, color: Color(0xFFF43F5E)),
                        SizedBox(height: 16),
                        Text('Front of ID Card', style: TextStyle(fontWeight: FontWeight.bold)),
                        Text('Tap to capture', style: TextStyle(color: Color(0xFFF43F5E))),
                      ],
                    )
                  : Container(
                      padding: const EdgeInsets.all(8),
                      alignment: Alignment.bottomRight,
                      child: CircleAvatar(
                        backgroundColor: Colors.black54,
                        child: IconButton(
                          icon: const Icon(Icons.edit, color: Colors.white),
                          onPressed: () => _pickImage(ImageSource.camera, false),
                        ),
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 24),
          const Text('Accepted IDs:', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('• Driver\'s License\n• Passport\n• UMID / SSS ID\n• PhilID (National ID)'),
        ],
      ),
    );
  }

  Widget _buildSelfieStep() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Face Verification', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Take a selfie to verify your identity.', style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 16),
          // Liveness Status Indicator
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
            decoration: BoxDecoration(
              color: (_hasBlinked && _hasSmiled) ? Colors.green.withValues(alpha: 0.1) : Colors.orange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: (_hasBlinked && _hasSmiled) ? Colors.green : Colors.orange,
                width: 1,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  (_hasBlinked && _hasSmiled) ? Icons.verified_user : Icons.security,
                  size: 16,
                  color: (_hasBlinked && _hasSmiled) ? Colors.green : Colors.orange,
                ),
                const SizedBox(width: 8),
                Text(
                  _livenessPrompt,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: (_hasBlinked && _hasSmiled) ? Colors.green : Colors.orange,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          Center(
            child: GestureDetector(
              onTap: () => _pickImage(ImageSource.camera, true),
              child: Stack(
                children: [
                  Container(
                    width: 200,
                    height: 200,
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: _selfieImage != null ? const Color(0xFFF43F5E) : Colors.grey[300]!,
                        width: 2,
                      ),
                      image: _selfieImage != null
                          ? DecorationImage(image: FileImage(_selfieImage!), fit: BoxFit.cover)
                          : null,
                    ),
                    child: _selfieImage == null
                        ? const Icon(Icons.person, size: 100, color: Colors.grey)
                        : null,
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: CircleAvatar(
                      backgroundColor: const Color(0xFFF43F5E),
                      child: IconButton(
                        icon: Icon(_selfieImage == null ? Icons.camera_alt : Icons.edit, color: Colors.white),
                        onPressed: () => _pickImage(ImageSource.camera, true),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 40),
          const Text('Tips for a good selfie:', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('• Find a well-lit area\n• Keep a neutral expression\n• Do not wear glasses or hats\n• Center your face in the circle'),
        ],
      ),
    );
  }

  Widget _buildTextField(
    String label,
    String hint,
    TextEditingController controller, {
    Widget? suffixIcon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey[400]),
            suffixIcon: suffixIcon,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey[300]!),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFF43F5E)),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
      ],
    );
  }
}
