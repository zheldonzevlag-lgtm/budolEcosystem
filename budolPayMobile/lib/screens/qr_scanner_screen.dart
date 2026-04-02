import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../utils/ui_utils.dart';
import 'payment_status_screen.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> with SingleTickerProviderStateMixin {
  bool _isProcessing = false;
  late MobileScannerController _controller;
  late AnimationController _animationController;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = MobileScannerController();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    
    _animation = Tween<double>(begin: 0, end: 1).animate(_animationController);
  }

  @override
  void dispose() {
    _controller.dispose();
    _animationController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_isProcessing) return;

    final List<Barcode> barcodes = capture.barcodes;
    for (final barcode in barcodes) {
      final String? code = barcode.rawValue;
      if (code != null) {
        debugPrint('Barcode found! $code');
        HapticFeedback.mediumImpact();
        _processQRCode(code);
        break;
      }
    }
  }

  Future<void> _pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      final BarcodeCapture? capture = await _controller.analyzeImage(image.path);
      if (capture != null && capture.barcodes.isNotEmpty) {
        _processQRCode(capture.barcodes.first.rawValue ?? '');
      } else {
        _showError('No QR code found in image');
      }
    }
  }

  void _processQRCode(String code) {
    setState(() {
      _isProcessing = true;
    });

    try {
      final decoded = json.decode(code);
      if (decoded is! Map) {
        _showError('Invalid QR Code format: Expected an object');
        return;
      }
      final Map<String, dynamic> data = Map<String, dynamic>.from(decoded);
      if (data['type'] == 'budolpay_payment') {
        // Valid budolPay QR code
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => PaymentSummaryScreen(paymentData: data),
          ),
        );
      } else {
        _showError('Invalid QR Code format for budol₱ay');
      }
    } catch (e) {
      _showError('Failed to parse QR Code');
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
    setState(() {
      _isProcessing = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan to Pay'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: [
          ValueListenableBuilder(
            valueListenable: _controller,
            builder: (context, state, child) {
              final torchState = state.torchState;
              return IconButton(
                icon: Icon(
                  torchState == TorchState.on ? Icons.flash_on : Icons.flash_off,
                  color: Colors.white,
                ),
                onPressed: () => _controller.toggleTorch(),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.photo_library, color: Colors.white),
            onPressed: _pickImage,
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
            errorBuilder: (context, error) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.videocam_off, color: Colors.white, size: 64),
                    const SizedBox(height: 16),
                    Text(
                      error.errorCode == MobileScannerErrorCode.permissionDenied
                          ? 'Camera Permission Denied'
                          : 'Camera Error: ${error.errorCode}',
                      style: const TextStyle(color: Colors.white),
                    ),
                    const SizedBox(height: 8),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 32),
                      child: Text(
                        'Note: Web browsers require HTTPS for camera access. If you are using HTTP, please enable "Insecure origins treated as secure" in chrome://flags',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          AnimatedBuilder(
            animation: _animation,
            builder: (context, child) {
              return CustomPaint(
                painter: QRScannerOverlayPainter(
                  animationValue: _animation.value,
                  scanAreaSize: 260.0,
                ),
                child: Container(),
              );
            },
          ),
          if (_isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            ),
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Column(
              children: [
                const Text(
                  'Align QR code within the frame',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white, fontSize: 16),
                ),
                const SizedBox(height: 24),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 48),
                  child: SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.white70, width: 1.5),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'CANCEL',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.1,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class PaymentSummaryScreen extends StatelessWidget {
  final Map<String, dynamic> paymentData;

  const PaymentSummaryScreen({super.key, required this.paymentData});

  @override
  Widget build(BuildContext context) {
    // Safe parsing of amount
    double amount = 0.0;
    if (paymentData['amount'] != null) {
      if (paymentData['amount'] is num) {
        amount = (paymentData['amount'] as num).toDouble();
      } else {
        amount = double.tryParse(paymentData['amount'].toString()) ?? 0.0;
      }
    }

    final storeName = paymentData['storeName'] ?? paymentData['merchant'] ?? 'Unknown Merchant';
    final orderId = paymentData['orderId'] ?? 'N/A';
    final paymentMethod = paymentData['paymentMethod'] ?? 'budol₱ay Wallet';
    
    // Payment Date Details
    final now = DateTime.now();
    final paymentDate = DateFormat('MMMM dd, yyyy').format(now);
    final paymentTime = DateFormat('hh:mm a').format(now);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Payment Summary', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Center(
                        child: Icon(
                          Icons.account_balance_wallet_rounded,
                          size: 48,
                          color: Color(0xFFF43F5E),
                        ),
                      ),
                      const SizedBox(height: 12),
                      UIUtils.formatBudolPayText(
                        paymentMethod,
                        textAlign: TextAlign.center,
                        baseStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Payment to',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey[600], fontSize: 11, fontWeight: FontWeight.w500),
                      ),
                      const SizedBox(height: 2),
                      UIUtils.formatBudolPayText(
                        storeName,
                        textAlign: TextAlign.center,
                        baseStyle: const TextStyle(color: Color(0xFF1E293B), fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFF1F5F9)),
                        ),
                        child: Column(
                          children: [
                            Text(
                              'Amount to Pay',
                              style: TextStyle(fontSize: 11, color: Colors.grey[500], fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '₱${amount.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFF43F5E),
                                letterSpacing: -0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      // Payment Details
                      const Text(
                        'TRANSACTION DETAILS',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Color.fromARGB(255, 118, 130, 148), // Slate 400
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 8),
                      _buildDetailRow('Store Name', storeName),
                      const Divider(height: 12, thickness: 0.5, color: Color.fromARGB(255, 197, 205, 212)),
                      _buildDetailRow('Order #', orderId),
                      const Divider(height: 12, thickness: 0.5, color: Color.fromARGB(255, 197, 205, 212)),
                      _buildDetailRow('Date', paymentDate),
                      const Divider(height: 12, thickness: 0.5, color: Color.fromARGB(255, 197, 205, 212)),
                      _buildDetailRow('Time', paymentTime),
                      const Divider(height: 12, thickness: 0.5, color: Color.fromARGB(255, 197, 205, 212)),
                      _buildDetailRow('Payment Method', paymentMethod),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  ElevatedButton(
                    onPressed: () => _handlePayment(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFF43F5E),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: const Text(
                      'CONFIRM PAYMENT',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                    ),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      foregroundColor: const Color(0xFF94A3B8),
                    ),
                    child: const Text(
                      'Cancel',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    const slate600 = Color(0xFF475569);
    const slate400 = Color(0xFF94A3B8);
    const fontSize = 12.0;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: const TextStyle(color: slate400, fontSize: fontSize, fontWeight: FontWeight.w500),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: UIUtils.formatBudolPayText(
              value,
              textAlign: TextAlign.right,
              baseStyle: const TextStyle(
                fontWeight: FontWeight.w600,
                color: slate600,
                fontSize: fontSize,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _handlePayment(BuildContext context) async {
    final apiService = Provider.of<ApiService>(context, listen: false);

    // Get the reference ID for real-time tracking
    final referenceId = paymentData['paymentIntentId']?.toString() ?? paymentData['orderId']?.toString();

    // Navigate to status screen in verifying mode immediately
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PaymentStatusScreen(
          initialStatus: PaymentStatus.verifying,
          transactionData: paymentData,
          referenceId: referenceId,
          onVerify: () => apiService.processPayment(qrData: paymentData),
        ),
      ),
    );
  }
}

class QRScannerOverlayPainter extends CustomPainter {
  final double animationValue;
  final double scanAreaSize;

  QRScannerOverlayPainter({
    required this.animationValue,
    required this.scanAreaSize,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final double width = size.width;
    final double height = size.height;
    final double scanWidth = scanAreaSize;
    final double scanHeight = scanAreaSize;
    
    final double left = (width - scanWidth) / 2;
    final double top = (height - scanHeight) / 2;
    final Rect scanRect = Rect.fromLTWH(left, top, scanWidth, scanHeight);

    // Draw background with cutout
    final Paint backgroundPaint = Paint()..color = Colors.black.withAlpha(178); // ~0.7 opacity
    final Path backgroundPath = Path()..addRect(Rect.fromLTWH(0, 0, width, height));
    final Path cutoutPath = Path()..addRRect(RRect.fromRectAndRadius(scanRect, const Radius.circular(12)));
    
    final Path finalPath = Path.combine(PathOperation.difference, backgroundPath, cutoutPath);
    canvas.drawPath(finalPath, backgroundPaint);

    // Draw frame corners (Techno style)
    final Paint cornerPaint = Paint()
      ..color = const Color(0xFFF43F5E) // BudolPay Pink
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round;

    const double cornerSize = 30.0;
    const double radius = 12.0;

    // Top Left
    canvas.drawPath(
      Path()
        ..moveTo(left, top + cornerSize)
        ..lineTo(left, top + radius)
        ..arcToPoint(Offset(left + radius, top), radius: const Radius.circular(radius))
        ..lineTo(left + cornerSize, top),
      cornerPaint,
    );

    // Top Right
    canvas.drawPath(
      Path()
        ..moveTo(left + scanWidth - cornerSize, top)
        ..lineTo(left + scanWidth - radius, top)
        ..arcToPoint(Offset(left + scanWidth, top + radius), radius: const Radius.circular(radius))
        ..lineTo(left + scanWidth, top + cornerSize),
      cornerPaint,
    );

    // Bottom Left
    canvas.drawPath(
      Path()
        ..moveTo(left, top + scanHeight - cornerSize)
        ..lineTo(left, top + scanHeight - radius)
        ..arcToPoint(Offset(left + radius, top + scanHeight), radius: const Radius.circular(radius))
        ..lineTo(left + cornerSize, top + scanHeight),
      cornerPaint,
    );

    // Bottom Right
    canvas.drawPath(
      Path()
        ..moveTo(left + scanWidth - cornerSize, top + scanHeight)
        ..lineTo(left + scanWidth - radius, top + scanHeight)
        ..arcToPoint(Offset(left + scanWidth, top + scanHeight - radius), radius: const Radius.circular(radius))
        ..lineTo(left + scanWidth, top + scanHeight - cornerSize),
      cornerPaint,
    );

    // Draw scanning laser line
    final double laserTop = top + (scanHeight * animationValue);
    final Paint laserPaint = Paint()
      ..shader = LinearGradient(
        colors: [
          const Color(0xFFF43F5E).withAlpha(0),
          const Color(0xFFF43F5E),
          const Color(0xFFF43F5E).withAlpha(0),
        ],
      ).createShader(Rect.fromLTWH(left, laserTop - 2, scanWidth, 4));

    canvas.drawRect(Rect.fromLTWH(left + 10, laserTop - 1, scanWidth - 20, 2), laserPaint);
    
    // Add glowing effect to the laser
    final Paint glowPaint = Paint()
      ..color = const Color(0xFFF43F5E).withAlpha(76) // ~0.3 opacity
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8);
    canvas.drawRect(Rect.fromLTWH(left + 5, laserTop - 2, scanWidth - 10, 4), glowPaint);
  }

  @override
  bool shouldRepaint(QRScannerOverlayPainter oldDelegate) {
    return oldDelegate.animationValue != animationValue;
  }
}
