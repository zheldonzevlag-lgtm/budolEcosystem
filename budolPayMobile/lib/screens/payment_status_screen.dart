import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../constants/routes.dart';
import '../services/realtime_service.dart';
import 'dart:async';

enum PaymentStatus { verifying, success, failed }

class PaymentStatusScreen extends StatefulWidget {
  final PaymentStatus initialStatus;
  final Map<String, dynamic>? transactionData;
  final String? errorMessage;
  final String? referenceId; // Added to track specific transaction
  final Future<Map<String, dynamic>> Function()? onVerify; // Callback to perform verification

  const PaymentStatusScreen({
    super.key,
    required this.initialStatus,
    this.transactionData,
    this.errorMessage,
    this.referenceId,
    this.onVerify,
  });

  @override
  State<PaymentStatusScreen> createState() => _PaymentStatusScreenState();
}

class _PaymentStatusScreenState extends State<PaymentStatusScreen> with SingleTickerProviderStateMixin {
  late PaymentStatus _currentStatus;
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  StreamSubscription? _transactionSubscription;
  Map<String, dynamic>? _updatedTransactionData;

  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _currentStatus = widget.initialStatus;
    _updatedTransactionData = widget.transactionData;
    _errorMessage = widget.errorMessage;
    
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _scaleAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.elasticOut,
    );

    if (_currentStatus != PaymentStatus.verifying) {
      _animationController.forward();
    } else {
      // If verifying, start listening for real-time updates
      _setupRealtimeListener();
      
      // If a verification callback is provided, execute it
      if (widget.onVerify != null) {
        _performVerification();
      }
    }
  }

  Future<void> _performVerification() async {
    try {
      // Add a small delay to ensure the "verifying" UI is seen
      await Future.delayed(const Duration(milliseconds: 1500));
      
      final result = await widget.onVerify!();
      if (mounted) {
        updateStatus(PaymentStatus.success, updatedData: result['transaction'] ?? widget.transactionData);
      }
    } catch (e) {
      if (mounted) {
        updateStatus(PaymentStatus.failed, errorMessage: e.toString().replaceAll('Exception: ', ''));
      }
    }
  }

  void _setupRealtimeListener() {
    final realtimeService = Provider.of<RealtimeService>(context, listen: false);
    _transactionSubscription = realtimeService.transactionStream.listen((data) {
      if (!mounted) return;

      final transaction = data['transaction'];
      if (transaction == null) return;

      // Check if this transaction matches our payment
      final txReference = transaction['reference']?.toString() ?? transaction['referenceId']?.toString();
      final targetReference = widget.referenceId ?? widget.transactionData?['paymentIntentId']?.toString() ?? widget.transactionData?['orderId']?.toString();

      if (txReference != null && txReference == targetReference) {
        final status = transaction['status']?.toString().toUpperCase();
        if (status == 'COMPLETED' || status == 'SUCCESS' || status == 'PAID') {
          updateStatus(PaymentStatus.success, updatedData: transaction);
        } else if (status == 'FAILED') {
          updateStatus(PaymentStatus.failed);
        }
      }
    });
  }

  @override
  void dispose() {
    _transactionSubscription?.cancel();
    _animationController.dispose();
    super.dispose();
  }

  void updateStatus(PaymentStatus newStatus, {Map<String, dynamic>? updatedData, String? errorMessage}) {
    if (mounted) {
      setState(() {
        _currentStatus = newStatus;
        if (updatedData != null) {
          _updatedTransactionData = updatedData;
        }
        if (errorMessage != null) {
          _errorMessage = errorMessage;
        }
      });
      if (newStatus != PaymentStatus.verifying) {
        _transactionSubscription?.cancel(); // Stop listening once we have a final status
        _animationController.reset();
        _animationController.forward();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildStatusIcon(),
                      const SizedBox(height: 32),
                      _buildStatusText(),
                      const SizedBox(height: 16),
                      _buildTransactionDetails(),
                    ],
                  ),
                ),
              ),
            ),
            _buildActionButtons(),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusIcon() {
    if (_currentStatus == PaymentStatus.verifying) {
      return const SizedBox(
        width: 80,
        height: 80,
        child: CircularProgressIndicator(
          strokeWidth: 6,
          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFF43F5E)),
        ),
      );
    }

    final isSuccess = _currentStatus == PaymentStatus.success;
    return ScaleTransition(
      scale: _scaleAnimation,
      child: Container(
        width: 100,
        height: 100,
        decoration: BoxDecoration(
          color: isSuccess ? const Color(0xFFF43F5E).withValues(alpha: 0.1) : const Color(0xFFF43F5E).withValues(alpha: 0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(
          isSuccess ? Icons.check_circle_rounded : Icons.error_rounded,
          size: 80,
          color: isSuccess ? const Color(0xFFF43F5E) : const Color(0xFFF43F5E),
        ),
      ),
    );
  }

  Widget _buildStatusText() {
    String title;
    String subtitle;
    Color titleColor = const Color(0xFF1E293B);

    switch (_currentStatus) {
      case PaymentStatus.verifying:
        title = 'Verifying Payment';
        subtitle = 'Please wait while we process your transaction...';
        break;
      case PaymentStatus.success:
        title = 'Payment Successful!';
        subtitle = 'Your transaction has been completed.';
        titleColor = const Color(0xFFF43F5E);
        break;
      case PaymentStatus.failed:
        title = 'Payment Failed';
        subtitle = _errorMessage ?? 'Something went wrong. Please try again.';
        titleColor = const Color(0xFFF43F5E);
        break;
    }

    return Column(
      children: [
        Text(
          title,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: titleColor,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 10,
            color: Colors.grey[600],
            height: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildTransactionDetails() {
    if (_currentStatus != PaymentStatus.success || _updatedTransactionData == null) {
      return const SizedBox.shrink();
    }

    final data = _updatedTransactionData!;
    
    // Safe parsing of amount
    double amount = 0.0;
    if (data['amount'] != null) {
      if (data['amount'] is num) {
        amount = (data['amount'] as num).toDouble();
      } else {
        amount = double.tryParse(data['amount'].toString()) ?? 0.0;
      }
    }

    final merchant = data['storeName'] ?? data['merchant'] ?? 'Merchant';
    
    // Logic to ensure Order # and Reference ID are distinct and correctly labeled
    String orderId = data['orderId']?.toString() ?? 'N/A';
    String reference = data['reference']?.toString() ?? data['referenceId']?.toString() ?? data['id']?.toString().toUpperCase() ?? 'N/A';
    
    // If we have a JON (Job Order Number) in reference but orderId is empty, swap them
    if (orderId == 'N/A' && reference.startsWith('JON')) {
      orderId = reference;
      reference = data['id']?.toString().toUpperCase() ?? 'N/A';
    }
    
    final date = DateFormat('MMM dd, yyyy • hh:mm a').format(DateTime.now());
    final isSuccess = _currentStatus == PaymentStatus.success;

    return Container(
      margin: const EdgeInsets.only(top: 24),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC), // slate-50 equivalent
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)), // slate-200 equivalent
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildDetailRow('Reference ID', reference, isMonospace: true),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1, thickness: 1, color: Color(0xFFF1F5F9)),
          ),
          _buildDetailRow('Order #', orderId, isMonospace: true),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1, thickness: 1, color: Color(0xFFF1F5F9)),
          ),
          _buildDetailRow('Amount', '₱${NumberFormat('#,##0.00').format(amount)}', isHighlighted: isSuccess),
          const SizedBox(height: 12),
          _buildDetailRow('Status', isSuccess ? 'Paid' : 'Failed', isStatus: true, isSuccess: isSuccess),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1, thickness: 1, color: Color(0xFFF1F5F9)),
          ),
          _buildDetailRow('Paid To', merchant),
          const SizedBox(height: 12),
          _buildDetailRow('Date & Time', date),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isHighlighted = false, bool isStatus = false, bool isSuccess = false, bool isMonospace = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(color: Color(0xFF64748B), fontSize: 8, fontWeight: FontWeight.w500),
        ),
        const SizedBox(width: 16),
        Expanded(
        child: Text(
          value,
          textAlign: TextAlign.right,
          softWrap: true,
          style: TextStyle(
            fontSize: 8,
            fontFamily: isMonospace ? 'monospace' : null,
            color: isStatus 
              ? (isSuccess ? const Color(0xFFF43F5E) : const Color(0xFFEF4444))
              : (isHighlighted ? const Color(0xFFF43F5E) : const Color(0xFF1E293B)),
          ),
        ),
      ),
      ],
    );
  }

  Widget _buildActionButtons() {
    if (_currentStatus == PaymentStatus.verifying) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.all(18.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_currentStatus == PaymentStatus.success) ...[
            ElevatedButton(
              onPressed: () {
                // In a real app, this might deep link back to budolShap or open a WebView
                Navigator.of(context).pushNamedAndRemoveUntil(
                  Routes.home,
                  (route) => false,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF43F5E),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'VIEW MY ORDERS',
                style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5),
              ),
            ),
            const SizedBox(height: 12),
          ],
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pushNamedAndRemoveUntil(
                Routes.home,
                (route) => false,
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: _currentStatus == PaymentStatus.success ? const Color(0xFFF1F5F9) : const Color(0xFFF43F5E),
              foregroundColor: _currentStatus == PaymentStatus.success ? const Color(0xFF475569) : Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              _currentStatus == PaymentStatus.success ? 'CONTINUE SHOPPING' : 'BACK TO HOME',
              style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 0.5),
            ),
          ),
          if (_currentStatus == PaymentStatus.failed) ...[
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Try Again',
                style: TextStyle(
                  color: Color(0xFF64748B),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
