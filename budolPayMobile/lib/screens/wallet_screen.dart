import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../services/realtime_service.dart';
import '../constants/routes.dart';
import 'dart:async';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  bool _isLoading = true;
  String _balance = '₱0.00';
  StreamSubscription<double>? _balanceSubscription;

  @override
  void initState() {
    super.initState();
    _fetchBalance();
    _initRealtimeListener();
  }

  void _initRealtimeListener() {
    final realtimeService = Provider.of<RealtimeService>(context, listen: false);
    _balanceSubscription = realtimeService.balanceStream.listen((newBalance) {
      if (mounted) {
        final formatted = NumberFormat.currency(locale: 'en_PH', symbol: '₱').format(newBalance);
        if (_balance != formatted) {
          setState(() {
            _balance = formatted;
            _isLoading = false; // Got update, stop loading if it was active
          });
        }
      }
    });
  }

  @override
  void dispose() {
    _balanceSubscription?.cancel();
    super.dispose();
  }

  Future<void> _fetchBalance({bool silent = false}) async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    
    // Do not fetch if not authenticated
    if (!apiService.isAuthenticated) {
      return;
    }

    if (!silent) {
      setState(() => _isLoading = true);
    }
    try {
      final balanceValue = await apiService.getBalance();
      if (mounted) {
        final formatted = NumberFormat.currency(locale: 'en_PH', symbol: '₱').format(balanceValue);
        if (_balance != formatted || !silent) {
          setState(() {
            _balance = formatted;
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Wallet'),
        backgroundColor: const Color(0xFFF43F5E),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Balance Section
            Container(
              padding: const EdgeInsets.all(24),
              width: double.infinity,
              color: const Color(0xFFF43F5E),
              child: Column(
                children: [
                  const Text(
                    'Total Balance',
                    style: TextStyle(color: Colors.white70, fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text(
                          _balance,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 40,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildQuickAction(Icons.add_card, 'Add Money', () async {
                        final result = await Navigator.pushNamed(context, Routes.addMoney);
                        if (result == true) {
                          _fetchBalance();
                        }
                      }),
                      _buildQuickAction(Icons.account_balance_wallet, 'Cash Out', () {
                        Navigator.pushNamed(context, Routes.cashOut);
                      }),
                      _buildQuickAction(Icons.swap_horiz, 'Transfer', () {
                        Navigator.pushNamed(context, Routes.transfer);
                      }),
                    ],
                  ),
                ],
              ),
            ),

            // Limits Section
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Transaction Limits',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  _buildLimitProgress('Daily Outgoing', 0.15, '₱1,500 / ₱10,000'),
                  const SizedBox(height: 16),
                  _buildLimitProgress('Monthly Outgoing', 0.05, '₱5,000 / ₱100,000'),
                ],
              ),
            ),

            // Linked Accounts
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Linked Accounts',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  _buildLinkedItem(Icons.account_balance, 'BPI Bank', '**** 1234'),
                  _buildLinkedItem(Icons.credit_card, 'Visa Card', '**** 5678'),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.add),
                    label: const Text('Link New Account'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFF43F5E),
                      side: const BorderSide(color: Color(0xFFF43F5E)),
                      minimumSize: const Size(double.infinity, 50),
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

  Widget _buildQuickAction(IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(51),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 28),
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildLimitProgress(String label, double progress, String detail) {
    const slate600 = Color(0xFF475569);
    const slate400 = Color(0xFF94A3B8);
    const fontSize = 13.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: fontSize,
                color: slate400,
                fontWeight: FontWeight.w500,
              ),
            ),
            Text(
              detail,
              style: const TextStyle(
                fontSize: fontSize,
                color: slate600,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(
          value: progress,
          backgroundColor: const Color(0xFFF1F5F9), // Slate 100
          valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFF43F5E)),
          minHeight: 8,
          borderRadius: BorderRadius.circular(4),
        ),
      ],
    );
  }

  Widget _buildLinkedItem(IconData icon, String name, String detail) {
    const slate600 = Color(0xFF475569);
    const slate400 = Color(0xFF94A3B8);
    const fontSize = 13.0;

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9), // Slate 100
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: slate600),
      ),
      title: Text(
        name,
        style: const TextStyle(
          fontSize: fontSize,
          color: slate600,
          fontWeight: FontWeight.w600,
        ),
      ),
      subtitle: Text(
        detail,
        style: const TextStyle(
          fontSize: fontSize - 1,
          color: slate400,
        ),
      ),
      trailing: const Icon(Icons.chevron_right, color: slate400, size: 20),
    );
  }
}
