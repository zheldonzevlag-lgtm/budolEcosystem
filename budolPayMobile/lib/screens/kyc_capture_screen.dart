import 'dart:io';
import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
// import 'package:path/path.dart' as path; // Removed to avoid dependency issue if not in pubspec

enum KYCCaptureType { face, idCard }

class KYCCaptureScreen extends StatefulWidget {
  final KYCCaptureType captureType;

  const KYCCaptureScreen({
    super.key,
    required this.captureType,
  });

  @override
  State<KYCCaptureScreen> createState() => _KYCCaptureScreenState();
}

class _KYCCaptureScreenState extends State<KYCCaptureScreen> with WidgetsBindingObserver {
  CameraController? _controller;
  List<CameraDescription>? _cameras;
  bool _isReady = false;
  bool _isCapturing = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeCamera();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final CameraController? cameraController = _controller;

    if (cameraController == null || !cameraController.value.isInitialized) {
      return;
    }

    if (state == AppLifecycleState.inactive) {
      cameraController.dispose();
    } else if (state == AppLifecycleState.resumed) {
      _initializeCamera();
    }
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras == null || _cameras!.isEmpty) {
        throw Exception('No cameras available');
      }

      // Use front camera for face, back camera for ID
      CameraDescription selectedCamera = _cameras!.first;
      if (widget.captureType == KYCCaptureType.face) {
        try {
          selectedCamera = _cameras!.firstWhere(
            (camera) => camera.lensDirection == CameraLensDirection.front,
          );
        } catch (_) {
          selectedCamera = _cameras!.first;
        }
      } else {
        try {
          selectedCamera = _cameras!.firstWhere(
            (camera) => camera.lensDirection == CameraLensDirection.back,
          );
        } catch (_) {
          selectedCamera = _cameras!.first;
        }
      }

      _controller = CameraController(
        selectedCamera,
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _controller!.initialize();
      
      if (mounted) {
        setState(() {
          _isReady = true;
        });
      }
    } catch (e) {
      debugPrint('Error initializing camera: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Camera Error: $e')),
        );
      }
    }
  }

  Future<void> _takePicture() async {
    if (_controller == null || !_controller!.value.isInitialized || _isCapturing) {
      return;
    }

    setState(() => _isCapturing = true);

    try {
      final XFile file = await _controller!.takePicture();
      
      // Save to a permanent location
      final directory = await getApplicationDocumentsDirectory();
      final String fileName = '${DateTime.now().millisecondsSinceEpoch}.jpg';
      final String filePath = '${directory.path}/$fileName';
      
      await File(file.path).copy(filePath);

      if (mounted) {
        Navigator.pop(context, filePath);
      }
    } catch (e) {
      debugPrint('Error taking picture: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to capture: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isCapturing = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_isReady || _controller == null) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: CircularProgressIndicator(color: Color(0xFFF43F5E))),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Camera Preview
          Center(
            child: AspectRatio(
              aspectRatio: 1 / _controller!.value.aspectRatio,
              child: CameraPreview(_controller!),
            ),
          ),

          // Overlay Guide
          _buildOverlay(),

          // Top Header
          Positioned(
            top: 60,
            left: 0,
            right: 0,
            child: Column(
              children: [
                const Text(
                  'KYC VERIFICATION',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  widget.captureType == KYCCaptureType.face
                      ? 'Step 2: Face Recognition'
                      : 'Step 1: ID Initialization',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 32),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40),
                  child: Text(
                    widget.captureType == KYCCaptureType.face
                        ? 'Position your face within the frame and look directly at the camera.'
                        : 'Align your ID within the focus area.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Bottom Controls
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'Cancel',
                    style: TextStyle(color: Colors.white, fontSize: 16),
                  ),
                ),
                _buildCaptureButton(),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'Skip',
                    style: TextStyle(color: Colors.white24, fontSize: 16),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverlay() {
    return ColorFiltered(
      colorFilter: ColorFilter.mode(
        Colors.black.withValues(alpha: 0.7),
        BlendMode.srcOut,
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Container(
            decoration: const BoxDecoration(
              color: Colors.black,
              backgroundBlendMode: BlendMode.dstOut,
            ),
          ),
          Center(
            child: widget.captureType == KYCCaptureType.face
                ? _buildFaceGuide()
                : _buildIDGuide(),
          ),
        ],
      ),
    );
  }

  Widget _buildFaceGuide() {
    return Container(
      width: 280,
      height: 380,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.all(Radius.elliptical(140, 190)),
        border: Border.all(color: const Color(0xFFF43F5E), width: 3),
      ),
    );
  }

  Widget _buildIDGuide() {
    return Container(
      width: 320,
      height: 200,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF43F5E), width: 3),
      ),
    );
  }

  Widget _buildCaptureButton() {
    return GestureDetector(
      onTap: _takePicture,
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: const BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
        ),
        child: Container(
          width: 70,
          height: 70,
          decoration: const BoxDecoration(
            color: Color(0xFFF43F5E),
            shape: BoxShape.circle,
          ),
          child: _isCapturing
              ? const Center(child: CircularProgressIndicator(color: Colors.white))
              : const Icon(Icons.camera_alt, color: Colors.white, size: 32),
        ),
      ),
    );
  }
}
