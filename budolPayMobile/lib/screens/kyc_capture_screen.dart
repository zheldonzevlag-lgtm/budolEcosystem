import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Supported capture types for the KYC process.
enum KYCCaptureType { face, idCard }

/// A unified screen for capturing both face and ID card images with guided overlays.
class KYCCaptureScreen extends StatefulWidget {
  final KYCCaptureType captureType;

  const KYCCaptureScreen({
    super.key,
    required this.captureType,
  });

  @override
  State<KYCCaptureScreen> createState() => _KYCCaptureScreenState();
}

class _KYCCaptureScreenState extends State<KYCCaptureScreen> {
  CameraController? _controller;
  List<CameraDescription>? _cameras;
  bool _isInitialized = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  /// Initializes the camera based on the capture type.
  /// Face capture uses the front camera, while ID capture uses the rear camera.
  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras == null || _cameras!.isEmpty) {
        throw Exception('No cameras available');
      }

      // Determine starting lens direction
      final targetDirection = widget.captureType == KYCCaptureType.face
          ? CameraLensDirection.front
          : CameraLensDirection.back;

      // Find the best match, fallback to the first available
      final selectedCamera = _cameras!.firstWhere(
        (camera) => camera.lensDirection == targetDirection,
        orElse: () => _cameras!.first,
      );

      _controller = CameraController(
        selectedCamera,
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _controller!.initialize();
      
      // Lock orientation to prevent "sideways" issues on emulators
      await _controller!.lockCaptureOrientation(DeviceOrientation.portraitUp);

      if (mounted) {
        setState(() => _isInitialized = true);
      }
    } catch (e) {
      debugPrint('[KYCCapture] Initialization error: $e');
      if (mounted) {
        setState(() => _errorMessage = 'Failed to open camera: $e');
      }
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _takePicture() async {
    if (_controller == null || !_controller!.value.isInitialized) return;
    if (_controller!.value.isTakingPicture) return;

    try {
      final XFile file = await _controller!.takePicture();
      if (mounted) {
        Navigator.pop(context, file.path);
      }
    } catch (e) {
      debugPrint('[KYCCapture] Error taking picture: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_errorMessage != null) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(backgroundColor: Colors.transparent, foregroundColor: Colors.white),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 64),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white)),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Go Back'),
              ),
            ],
          ),
        ),
      );
    }

    if (!_isInitialized || _controller == null) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: CircularProgressIndicator(color: Colors.white)),
      );
    }

    final String title = widget.captureType == KYCCaptureType.face
        ? 'Align your face within the circle'
        : 'Align your ID within the frame';

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          Center(
            child: CameraPreview(_controller!),
          ),

          // Custom Overlay based on capture type
          CustomPaint(
            painter: KYCOverlayPainter(captureType: widget.captureType),
            child: const SizedBox.expand(),
          ),

          // Navigation
          Positioned(
            top: 50,
            left: 16,
            child: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white, size: 30),
              onPressed: () => Navigator.pop(context),
            ),
          ),

          Positioned(
            top: 100,
            left: 0,
            right: 0,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  shadows: [Shadow(blurRadius: 10, color: Colors.black)],
                ),
              ),
            ),
          ),

          // Capture Button
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Center(
              child: GestureDetector(
                onTap: _takePicture,
                child: Container(
                  height: 84,
                  width: 84,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 4),
                  ),
                  child: Center(
                    child: Container(
                      height: 68,
                      width: 68,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                      ),
                      child: const Icon(Icons.camera_alt, color: Color(0xFFF43F5E), size: 32),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Painter that draws either a circle (for face) or a rectangle (for ID) hole in the overlay.
class KYCOverlayPainter extends CustomPainter {
  final KYCCaptureType captureType;

  KYCOverlayPainter({required this.captureType});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black.withValues(alpha: 0.7)
      ..style = PaintingStyle.fill;

    final outerRect = Rect.fromLTWH(0, 0, size.width, size.height);
    final Path outerPath = Path()..addRect(outerRect);
    
    Path innerPath;
    Rect innerRect;

    if (captureType == KYCCaptureType.face) {
      // Oval for face
      innerRect = Rect.fromCenter(
        center: Offset(size.width / 2, size.height * 0.45),
        width: size.width * 0.75,
        height: size.height * 0.5,
      );
      innerPath = Path()..addOval(innerRect);
    } else {
      // Rectangle for ID Card
      innerRect = Rect.fromCenter(
        center: Offset(size.width / 2, size.height * 0.45),
        width: size.width * 0.85,
        height: size.width * 0.85 * 0.63, // ID card aspect ratio ~1:0.63
      );
      innerPath = Path()..addRRect(RRect.fromRectAndRadius(innerRect, const Radius.circular(12)));
    }

    // Draw the overlay with the hole
    canvas.drawPath(
      Path.combine(PathOperation.difference, outerPath, innerPath),
      paint,
    );

    // Draw the guideline border
    final borderPaint = Paint()
      ..color = const Color(0xFFF43F5E).withValues(alpha: 0.8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0;
    
    if (captureType == KYCCaptureType.face) {
      canvas.drawOval(innerRect, borderPaint);
    } else {
      canvas.drawRRect(RRect.fromRectAndRadius(innerRect, const Radius.circular(12)), borderPaint);
    }
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
