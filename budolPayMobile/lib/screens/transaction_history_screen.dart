import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../services/realtime_service.dart';
import '../constants/routes.dart';
import '../utils/ui_utils.dart';
import '../utils/formatters.dart' as budol_format;
import 'dart:async';

class TransactionHistoryScreen extends StatefulWidget {
  const TransactionHistoryScreen({super.key});

  @override
  State<TransactionHistoryScreen> createState() => _TransactionHistoryScreenState();
}

class _TransactionHistoryScreenState extends State<TransactionHistoryScreen> {
  bool _isLoading = true;
  List<dynamic> _transactions = [];
  StreamSubscription? _transactionSubscription;
  Timer? _swrTimer;

  @override
  void initState() {
    super.initState();
    _fetchTransactions();
    _setupRealtimeListener();
    _initSWR();
  }

  @override
  void dispose() {
    _transactionSubscription?.cancel();
    _swrTimer?.cancel();
    super.dispose();
  }

  void _initSWR() {
    final apiService = Provider.of<ApiService>(context, listen: false);
    final method = apiService.systemSettings?['realtime']?['method'] ?? 'SWR';

    if (method == 'SWR' || method == 'POLLING') {
      final interval = apiService.systemSettings?['realtime']?['swr']?['refreshInterval'] ?? 5000;
      _swrTimer = Timer.periodic(Duration(milliseconds: interval), (_) {
        if (mounted && apiService.isAuthenticated) {
          _fetchTransactions(silent: true);
        }
      });
      if (kDebugMode) print('TransactionHistoryScreen: SWR Polling initialized');
    }
  }

  void _setupRealtimeListener() {
    // We use a microtask to ensure the RealtimeService is available via Provider
    Future.microtask(() {
      if (!mounted) return;
      final realtimeService = Provider.of<RealtimeService>(context, listen: false);
      
      // Ensure RealtimeService is initialized
      realtimeService.init();
      
      _transactionSubscription = realtimeService.transactionStream.listen((data) {
        if (mounted) {
          // If we receive a transaction update, refresh the whole list to be sure
          _fetchTransactions(silent: true);
          
          // Show a helpful snackbar
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(data['message'] ?? 'New transaction received!'),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
              duration: const Duration(seconds: 3),
            ),
          );
        }
      });
    });
  }

  Future<void> _fetchTransactions({bool silent = false}) async {
    final apiService = Provider.of<ApiService>(context, listen: false);
    if (!silent) setState(() => _isLoading = true);
    try {
      final result = await apiService.getTransactions();
      if (mounted) {
        setState(() {
          _transactions = result;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        if (!silent) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error loading transactions: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final apiService = Provider.of<ApiService>(context);
    final userId = apiService.user?['id'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transaction History'),
        backgroundColor: const Color(0xFFF43F5E),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchTransactions,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFFF43F5E)))
          : _transactions.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.history, size: 64, color: Colors.grey[300]),
                      const SizedBox(height: 16),
                      const Text(
                        'No transactions yet',
                        style: TextStyle(color: Colors.grey, fontSize: 16),
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: _transactions.length,
                  separatorBuilder: (context, index) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final tx = _transactions[index];
                    final bool isIncome = tx['receiverId'] == userId;
                    
                    // Safe parsing of amount
                    double amount = 0.0;
                    if (tx['amount'] != null) {
                      if (tx['amount'] is num) {
                        amount = (tx['amount'] as num).toDouble();
                      } else {
                        amount = double.tryParse(tx['amount'].toString()) ?? 0.0;
                      }
                    }

                    final String amountStr = '${isIncome ? '+' : '-'} PHP ${NumberFormat('#,##0.00').format(amount)}';
                    final Color amountColor = isIncome ? Colors.green : Colors.red;
                    
                    String dateStr = 'Recent';
                    if (tx['createdAt'] != null) {
                      try {
                        final date = DateTime.parse(tx['createdAt']);
                        dateStr = DateFormat('MMM d, yyyy').format(budol_format.DateUtils.toManila(date));
                      } catch (e) {
                        dateStr = tx['createdAt'].toString();
                      }
                    }

                    const slate600 = Color(0xFF475569);
                    const fontSize = 13.0;

                    return ListTile(
                      onTap: () {
                        Navigator.pushNamed(
                          context,
                          Routes.transactionDetails,
                          arguments: {
                            ...tx,
                            'isIncome': isIncome,
                          },
                        );
                      },
                      leading: CircleAvatar(
                        backgroundColor: const Color(0xFFF1F5F9), // Slate 100
                        child: Icon(
                          isIncome ? Icons.arrow_downward : Icons.arrow_upward,
                          color: isIncome ? Colors.green : const Color(0xFFF43F5E),
                          size: 20,
                        ),
                      ),
                      title: UIUtils.formatBudolPayText(
                        tx['description'] ?? (isIncome ? 'Money Received' : 'Money Sent'),
                        baseStyle: const TextStyle(
                          fontWeight: FontWeight.w600, 
                          fontSize: fontSize,
                          color: slate600,
                        ),
                      ),
                      subtitle: null,
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            amountStr,
                            style: TextStyle(
                              color: amountColor,
                              fontWeight: FontWeight.bold,
                              fontSize: fontSize,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            dateStr,
                            style: const TextStyle(
                              fontSize: 11,
                              color: Color(0xFF94A3B8), // Slate 400
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }
}
