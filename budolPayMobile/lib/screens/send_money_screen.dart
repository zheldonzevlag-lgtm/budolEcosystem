import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../utils/formatters.dart';
import '../utils/ui_utils.dart';

class SendMoneyScreen extends StatefulWidget {
  final String? initialRecipient;
  const SendMoneyScreen({super.key, this.initialRecipient});

  @override
  State<SendMoneyScreen> createState() => _SendMoneyScreenState();
}

class _SendMoneyScreenState extends State<SendMoneyScreen> {
  late final TextEditingController _recipientController;
  final _amountController = TextEditingController();
  final _messageController = TextEditingController();
  bool _isLoading = false;
  String? _recipientError;

  @override
  void initState() {
    super.initState();
    String initialValue = widget.initialRecipient ?? '';
    // If it's a phone number without hyphens, format it
    if (initialValue.startsWith('09') && initialValue.length == 11 && !initialValue.contains('-')) {
      initialValue = '${initialValue.substring(0, 4)}-${initialValue.substring(4, 7)}-${initialValue.substring(7)}';
    }
    _recipientController = TextEditingController(text: initialValue);
    if (initialValue.isNotEmpty) {
      _validateRecipient(initialValue);
    }
  }

  @override
  void dispose() {
    _recipientController.dispose();
    _amountController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  void _validateRecipient(String value) {
    if (value.isEmpty) {
      setState(() {
        _recipientError = null;
      });
      return;
    }

    final cleanNumber = value.replaceAll('-', '');
    
    if (cleanNumber.startsWith('09')) {
      if (cleanNumber.length != 11) {
        setState(() {
          _recipientError = 'Must be 11 digits (09XX-XXX-XXXX)';
        });
      } else if (!RegExp(r'^09\d{9}$').hasMatch(cleanNumber)) {
        setState(() {
          _recipientError = 'Invalid phone number';
        });
      } else {
        setState(() {
          _recipientError = null;
        });
      }
    } else {
      setState(() {
        _recipientError = 'Phone must start with 09';
      });
    }
  }

  Future<void> _handleTransfer() async {
    final recipientInput = _recipientController.text.trim();
    final recipient = recipientInput.replaceAll('-', ''); // Send clean number to backend
    final amountText = _amountController.text.trim();
    final message = _messageController.text.trim();

    _validateRecipient(recipientInput);
    if (_recipientError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_recipientError!)),
      );
      return;
    }

    if (recipient.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter recipient phone number')),
      );
      return;
    }

    if (amountText.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an amount')),
      );
      return;
    }

    final amount = double.tryParse(amountText);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid amount')),
      );
      return;
    }

    final apiService = Provider.of<ApiService>(context, listen: false);
    final user = apiService.currentUser;
    if (user != null && user['kycTier'] == 'BASIC') {
      final double monthlySent = (user['monthlySent'] ?? 0).toDouble();
      final double remaining = 5000.0 - monthlySent;
      if (amount > remaining) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Limit Exceeded. Basic accounts can only send ₱5,000 monthly. Remaining: ₱${remaining.toStringAsFixed(2)}'),
            backgroundColor: Colors.red.shade700,
          ),
        );
        return;
      }
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final response = await apiService.transfer(
        recipient: recipient,
        amount: amount,
        description: message.isNotEmpty ? message : null,
      );

      if (mounted) {
        final tx = response['transaction'];
        String displayName = recipientInput; // Show formatted number
        if (tx != null && tx['receiver'] != null) {
          final firstName = tx['receiver']['firstName']?.toString() ?? '';
          final lastName = tx['receiver']['lastName']?.toString() ?? '';
          final fullName = '$firstName $lastName'.trim();
          if (fullName.isNotEmpty) {
            displayName = fullName;
          } else {
            // Fallback to formatted phone
            displayName = recipientInput;
          }
        }

        final reference = tx != null ? (tx['reference'] ?? tx['id']?.toString().substring(0, 8).toUpperCase() ?? 'N/A') : 'N/A';

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Transfer Successful', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                UIUtils.formatBudolPayText(
                  'Sent ₱${amount.toStringAsFixed(2)} to $displayName',
                  baseStyle: const TextStyle(color: Colors.white)
                ),
                UIUtils.formatBudolPayText(
                  'Reference: $reference',
                  baseStyle: const TextStyle(fontSize: 12, color: Colors.white70)
                ),
              ],
            ),
            backgroundColor: Colors.green.shade700,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            margin: const EdgeInsets.all(10),
            duration: const Duration(seconds: 4),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Transfer failed: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Send Money'),
        backgroundColor: const Color(0xFFF43F5E),
        foregroundColor: Colors.white,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Recipient Information',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _recipientController,
                  onChanged: _validateRecipient,
                  keyboardType: TextInputType.phone,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    PhoneNumberFormatter(),
                  ],
                  decoration: InputDecoration(
                    labelText: 'Phone Number',
                    hintText: 'e.g. 0912-345-6789',
                    errorText: _recipientError,
                    border: const OutlineInputBorder(),
                    prefixIcon: const Icon(Icons.phone_android),
                  ),
                ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Amount',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Consumer<ApiService>(
                  builder: (context, apiService, _) {
                    final user = apiService.currentUser;
                    if (user != null && user['kycTier'] == 'BASIC') {
                      final double monthlySent = (user['monthlySent'] ?? 0).toDouble();
                      final double remaining = 5000.0 - monthlySent;
                       return Text(
                        'Remaining limit: ₱${remaining.toStringAsFixed(2)}',
                        style: TextStyle(
                            fontSize: 12, 
                            color: remaining <= 0 ? Colors.red : Colors.grey[600],
                            fontWeight: FontWeight.w500
                        ),
                      );
                    }
                    return const SizedBox();
                  },
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [
                CurrencyInputFormatter(),
              ],
              onChanged: (value) {
                // We don't force formatting here to avoid cursor jumps
                // but we could format on blur if needed
              },
              decoration: InputDecoration(
                prefixText: '₱ ',
                hintText: '0.00',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFFF43F5E), width: 2),
                ),
              ),
              style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),
            const Text(
              'Message (Optional)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _messageController,
              maxLines: 2,
              decoration: InputDecoration(
                hintText: 'What\'s this for?',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleTransfer,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF43F5E),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Send Now', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
