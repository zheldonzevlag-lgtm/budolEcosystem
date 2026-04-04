import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../utils/formatters.dart';

class CashInScreen extends StatefulWidget {
  const CashInScreen({super.key});

  @override
  State<CashInScreen> createState() => _CashInScreenState();
}

class _CashInScreenState extends State<CashInScreen> {
  final _amountController = TextEditingController();
  bool _isLoading = false;
  String? _selectedProvider = '7-Eleven';

  final List<String> _providers = [
    '7-Eleven',
    'GCash',
    'Maya',
    'BDO',
    'BPI',
    'UnionBank',
    'Over-the-Counter'
  ];

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _handleCashIn() async {
    final amountText = _amountController.text.trim();
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
      final double monthlyReceived = (user['monthlyReceived'] ?? 0).toDouble();
      final double walletBalance = (user['walletBalance'] ?? 0).toDouble();
      final double incomingRemaining = 5000.0 - monthlyReceived;
      final double walletRemaining = 10000.0 - walletBalance;
      
      final double allowed = incomingRemaining < walletRemaining ? incomingRemaining : walletRemaining;
      
      if (amount > allowed) {
        String reason = incomingRemaining < walletRemaining
            ? 'Monthly incoming limit (₱5,000)' 
            : 'Wallet balance limit (₱10,000)';
            
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Limit Exceeded. Basic accounts exceed $reason. Max allowed: ₱${allowed.toStringAsFixed(2)}'),
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
      await apiService.cashIn(
        amount: amount,
        provider: _selectedProvider ?? '7-Eleven',
      );

      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Success'),
            content: Text('Successfully cashed in ₱${amount.toStringAsFixed(2)} via $_selectedProvider'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(context); // Close dialog
                  Navigator.pop(context); // Go back to home
                },
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Cash in failed: $e')),
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
        title: const Text('Cash In'),
        backgroundColor: const Color(0xFFF43F5E),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Select Provider',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(8),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedProvider,
                  isExpanded: true,
                  items: _providers.map((String provider) {
                    return DropdownMenuItem<String>(
                      value: provider,
                      child: Text(provider),
                    );
                  }).toList(),
                  onChanged: (String? newValue) {
                    setState(() {
                      _selectedProvider = newValue;
                    });
                  },
                ),
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
                      final double monthlyReceived = (user['monthlyReceived'] ?? 0).toDouble();
                      final double walletBalance = (user['walletBalance'] ?? 0).toDouble();
                      final double incomingRemaining = 5000.0 - monthlyReceived;
                      final double walletRemaining = 10000.0 - walletBalance;
                      final double allowed = incomingRemaining < walletRemaining ? incomingRemaining : walletRemaining;
                      
                       return Text(
                        'Allowed Cash In: ₱${allowed.toStringAsFixed(2)}',
                        style: TextStyle(
                            fontSize: 12, 
                            color: allowed <= 0 ? Colors.red : Colors.grey[600],
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
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleCashIn,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF43F5E),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('Confirm Cash In', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
