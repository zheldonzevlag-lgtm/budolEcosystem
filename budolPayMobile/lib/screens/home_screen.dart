import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../services/realtime_service.dart';
import '../constants/routes.dart';
import '../utils/ui_utils.dart';
import '../utils/js_helper.dart';
import '../utils/formatters.dart' as budol_format;
import 'dart:async';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _balance = '₱0.00';
  bool _isLoading = true;
  bool _isBalanceVisible = false;
  bool _isNameVisible = false;
  List<dynamic> _transactions = [];
  StreamSubscription<double>? _balanceSubscription;
  StreamSubscription<Map<String, dynamic>>? _transactionSubscription;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initRealtime();
      _fetchData();
      
      // On Web, ensure splash is removed if we navigated directly here
      if (kIsWeb) {
        Future.delayed(const Duration(milliseconds: 200), () {
          if (mounted) {
            callJsMethod('removeSplashFromWeb');
          }
        });
      }
    });
  }

  Future<void> _fetchData({bool silent = false}) async {
    await Future.wait([
      _fetchBalance(silent: silent),
      _fetchTransactions(),
    ]);
  }

  String _formatBalance(double value) {
    final formatter = NumberFormat.currency(
      locale: 'en_PH',
      symbol: '₱',
      decimalDigits: 2,
    );
    return formatter.format(value);
  }

  String get _greeting {
    try {
      // Force Philippine Time (UTC+8) regardless of device timezone
      final phTime = DateTime.now().toUtc().add(const Duration(hours: 8));
      final hour = phTime.hour;
      if (hour >= 5 && hour < 12) {
        return 'Magandang Umaga Bes! ';
      } else if (hour >= 12 && hour < 18) {
        return 'Magandang Hapon Bes! ';
      } else {
        return 'Magandang Gabi Bes! ';
      }
    } catch (e) {
      // Fallback greeting if there's any error with date/time calculation
      return 'Kumusta Bes! ';
    }
  }

  Timer? _swrTimer;

  void _initRealtime() {
    final apiService = Provider.of<ApiService>(context, listen: false);
    final realtimeService = Provider.of<RealtimeService>(context, listen: false);
    
    final method = apiService.systemSettings?['realtime']?['method'] ?? 'SWR';

    if (method == 'SWR') {
      final interval = apiService.systemSettings?['realtime']?['swr']?['refreshInterval'] ?? 5000;
      _swrTimer = Timer.periodic(Duration(milliseconds: interval), (_) {
        if (mounted && apiService.isAuthenticated) {
          _fetchData(silent: true);
        }
      });
      if (kDebugMode) print('HomeScreen: SWR Polling initialized with ${interval}ms interval');
      return;
    }

    if (apiService.isAuthenticated) {
      if (kDebugMode) {
        print('HomeScreen: Initializing RealtimeService for user ${apiService.user!['id']} using $method');
      }
      
      realtimeService.init();
      
      _balanceSubscription = realtimeService.balanceStream.listen((newBalance) {
        if (kDebugMode) {
          print('HomeScreen: Real-time balance update received: $newBalance');
        }
        if (mounted) {
          final formatted = _formatBalance(newBalance);
          if (_balance != formatted) {
            setState(() {
              _balance = formatted;
              _isLoading = false; // Ensure loading is off if we got a real-time update
            });
          }
        }
      });

      _transactionSubscription = realtimeService.transactionStream.listen((data) {
        if (kDebugMode) {
          print('HomeScreen: Real-time transaction update received: $data');
        }
        if (mounted) {
          _fetchTransactions(); // Refresh transactions list
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Transaction completed: ${data['message'] ?? 'New transaction'}'),
              backgroundColor: Colors.green,
            ),
          );
        }
      });
    }
  }

  @override
  void dispose() {
    _swrTimer?.cancel();
    _balanceSubscription?.cancel();
    _transactionSubscription?.cancel();
    super.dispose();
  }

  Future<void> _fetchBalance({bool silent = false}) async {
    if (kDebugMode) {
      print('HomeScreen: _fetchBalance initiated (silent: $silent)');
    }
    
    if (!mounted) return;

    final apiService = Provider.of<ApiService>(context, listen: false);
    
    // Do not fetch if not authenticated
    if (!apiService.isAuthenticated) {
      if (kDebugMode) print('HomeScreen: Skipping _fetchBalance - not authenticated');
      return;
    }
    
    if (!silent) {
      setState(() {
        _isLoading = true;
      });
    }

    try {
      final balanceValue = await apiService.getBalance();
      
      if (mounted) {
        final formatted = _formatBalance(balanceValue);
        if (_balance != formatted || !silent) {
          setState(() {
            if (kDebugMode) {
              print('HomeScreen: Updating balance state: $formatted');
            }
            _balance = formatted;
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('HomeScreen: Error in _fetchBalance: $e');
      }
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        if (!silent) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to fetch balance: $e')),
          );
        }
      }
    }
  }

  Future<void> _fetchTransactions() async {
    if (kDebugMode) {
      print('HomeScreen: _fetchTransactions initiated');
    }
    
    if (!mounted) return;

    final apiService = Provider.of<ApiService>(context, listen: false);
    
    // Do not fetch if not authenticated
    if (!apiService.isAuthenticated) {
      if (kDebugMode) print('HomeScreen: Skipping _fetchTransactions - not authenticated');
      return;
    }

    try {
      final result = await apiService.getTransactions();
      if (mounted) {
        setState(() {
          _transactions = result;
        });
      }
    } catch (e) {
      if (kDebugMode) {
        print('HomeScreen: Error in _fetchTransactions: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final apiService = Provider.of<ApiService>(context);
    final socketService = Provider.of<SocketService>(context);
    final user = apiService.user;
    String userName = 'User';
    if (user != null) {
      final firstName = user['firstName']?.toString() ?? '';
      userName = firstName.trim();
      if (userName.isEmpty) userName = user['email']?.toString() ?? 'User';
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (bool didPop, dynamic result) {
        if (didPop) {
          return;
        }
        // This prevents the user from going back to the login screen
        // from the home screen via the native back button.
        if (kDebugMode) {
          print('HomeScreen: Back button pressed, but pop is disabled to prevent returning to login.');
        }
      },
      child: Scaffold(
        appBar: AppBar(
        automaticallyImplyLeading: false,
        title: UIUtils.formatBudolPayText(
          'budol₱ay',
          useColors: false,
          baseStyle: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFFF43F5E),
        foregroundColor: Colors.white,
        actions: [
          // Connection status indicator
          Padding(
            padding: const EdgeInsets.only(right: 4.0),
            child: Tooltip(
              message: socketService.isConnected ? 'Connected' : 'Disconnected',
              child: Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: socketService.isConnected ? Colors.greenAccent : Colors.orange,
                  boxShadow: [
                    if (socketService.isConnected)
                      BoxShadow(
                        color: Colors.greenAccent.withAlpha(128),
                        blurRadius: 4,
                        spreadRadius: 1,
                      ),
                  ],
                ),
              ),
            ),
          ),
          IconButton(icon: const Icon(Icons.notifications), onPressed: () {}),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            children: [
              // Balance Card
              Container(
                padding: const EdgeInsets.all(24),
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: Color(0xFFF43F5E),
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(32),
                    bottomRight: Radius.circular(32),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _greeting,
                                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w500),
                              ),
                              Flexible(
                                child: Text(
                                  _isNameVisible ? userName : '•' * userName.length,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: () {
                            setState(() {
                              _isNameVisible = !_isNameVisible;
                            });
                          },
                          child: Icon(
                            _isNameVisible ? Icons.visibility : Icons.visibility_off,
                            color: Colors.white70,
                            size: 16,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Available Balance',
                      style: TextStyle(color: Colors.white70, fontSize: 14),
                    ),
                    const SizedBox(height: 8),
                    _isLoading
                        ? const SizedBox(
                            height: 30,
                            child: Center(child: CircularProgressIndicator(color: Colors.white)),
                          )
                        : Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Text(
                                _isBalanceVisible ? _balance : '₱ ••••••',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 22,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 8),
                              IconButton(
                                constraints: const BoxConstraints(),
                                padding: EdgeInsets.zero,
                                iconSize: 20,
                                icon: Icon(
                                  _isBalanceVisible ? Icons.visibility : Icons.visibility_off,
                                  color: Colors.white70,
                                ),
                                onPressed: () {
                                  setState(() {
                                    _isBalanceVisible = !_isBalanceVisible;
                                  });
                                },
                              ),
                            ],
                          ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        _buildBalanceAction(context, Icons.add_circle, 'Cash In', () async {
                          await Navigator.pushNamed(context, Routes.cashIn);
                          _fetchData();
                        }),
                        const SizedBox(width: 16),
                        _buildBalanceAction(context, Icons.send, 'Send', () async {
                          await Navigator.pushNamed(context, Routes.sendMoney);
                          _fetchData();
                        }),
                        const SizedBox(width: 16),
                        _buildBalanceAction(context, Icons.favorite, 'Favorites', () async {
                          await Navigator.pushNamed(context, Routes.favorites);
                          _fetchData();
                        }),
                        const SizedBox(width: 16),
                        _buildBalanceAction(context, Icons.qr_code_scanner, 'Scan QR', () async {
                          await Navigator.pushNamed(context, Routes.qrScanner);
                          _fetchData(); // Refresh balance after returning from scanner
                        }),
                      ],
                    ),
                  ],
                ),
              ),
              
              // Services Grid
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Services',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF334155)), // Slate 700
                    ),
                    const SizedBox(height: 16),
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 4,
                      mainAxisSpacing: 24,
                      children: [
                        _buildServiceItem(Icons.phone_android, 'Load'),
                        _buildServiceItem(Icons.receipt_long, 'Bills'),
                        _buildServiceItem(Icons.shopping_bag, 'budolShap'),
                        _buildServiceItem(Icons.account_balance, 'Bank Transfer'),
                        _buildServiceItem(Icons.credit_card, 'Cards'),
                        _buildServiceItem(Icons.savings, 'Savings'),
                        _buildServiceItem(
                          Container(
                            width: 32,
                            height: 32,
                            alignment: Alignment.center,
                            child: const Text(
                              '₱',
                              style: TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFF43F5E),
                                height: 1.0,
                              ),
                            ),
                          ),
                          'budolLoan',
                        ),
                        _buildServiceItem(Icons.more_horiz, 'More'),
                      ],
                    ),
                  ],
                ),
              ),
              
              // Recent Transactions
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Recent Transactions',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF334155)), // Slate 700
                        ),
                        TextButton(
                          onPressed: () {
                            Navigator.pushNamed(context, Routes.transactionHistory);
                          },
                          child: const Text('See All'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (_transactions.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24.0),
                        child: Center(
                          child: Text(
                            'No recent transactions',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ),
                      )
                    else
                      ..._transactions.take(5).map((tx) {
                        try {
                          if (tx == null) return const SizedBox.shrink();
                          
                          final bool isIncome = tx['receiverId'] == user?['id'];
                          final String title = tx['description'] ?? (isIncome ? 'Money Received' : 'Money Sent');
                          
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
                          
                          // Parse date
                          String dateStr = 'Recent';
                          if (tx['createdAt'] != null) {
                            try {
                              final date = DateTime.parse(tx['createdAt']);
                              dateStr = DateFormat('MMM d, yyyy').format(budol_format.DateUtils.toManila(date));
                            } catch (e) {
                              dateStr = tx['createdAt'].toString();
                            }
                          }

                          return InkWell(
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
                            child: _buildTransactionItem(
                              title,
                              amountStr,
                              dateStr,
                              amountColor,
                            ),
                          );
                        } catch (e) {
                          if (kDebugMode) print('HomeScreen: Error rendering transaction item: $e');
                          return const SizedBox.shrink();
                        }
                      }),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        onTap: (index) async {
          if (index == 1) {
            await Navigator.pushNamed(context, Routes.transactionHistory);
            _fetchData();
          } else if (index == 2) {
            await Navigator.pushNamed(context, Routes.qrScanner);
            _fetchData();
          } else if (index == 3) {
            await Navigator.pushNamed(context, Routes.wallet);
            _fetchData();
          } else if (index == 4) {
            await Navigator.pushNamed(context, Routes.settings);
            _fetchData();
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.history), label: 'History'),
          BottomNavigationBarItem(icon: Icon(Icons.qr_code), label: 'Scan'),
          BottomNavigationBarItem(icon: Icon(Icons.wallet), label: 'Wallet'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: 'Settings'),
        ],
      ),
    ),
  );
}

  Widget _buildBalanceAction(BuildContext context, IconData icon, String label, VoidCallback onTap) {
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
            child: Icon(icon, color: Colors.white, size: 24),
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildServiceItem(dynamic icon, String label) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        SizedBox(
          height: 32,
          width: 32,
          child: icon is IconData 
              ? Icon(icon, color: const Color(0xFFF43F5E), size: 32)
              : (icon is Widget ? icon : const Icon(Icons.error, color: Color(0xFFF43F5E), size: 32)),
        ),
        const SizedBox(height: 8),
        UIUtils.formatBudolPayText(
          label,
          baseStyle: const TextStyle(fontSize: 12),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildTransactionItem(String title, String amount, String date, Color amountColor) {
    const slate600 = Color(0xFF475569);
    const fontSize = 13.0;
    
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: const CircleAvatar(
        backgroundColor: Color(0xFFF1F5F9), // Slate 100
        child: Icon(Icons.payment, color: Color(0xFFF43F5E), size: 20),
      ),
      title: UIUtils.formatBudolPayText(
        title, 
        baseStyle: const TextStyle(
          fontWeight: FontWeight.w600, 
          fontSize: fontSize,
          color: slate600,
        )
      ),
      subtitle: null,
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            amount,
            style: TextStyle(
              color: amountColor, 
              fontWeight: FontWeight.bold,
              fontSize: fontSize,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            date,
            style: const TextStyle(
              fontSize: 11,
              color: Color(0xFF94A3B8), // Slate 400
            ),
          ),
        ],
      ),
    );
  }
}
