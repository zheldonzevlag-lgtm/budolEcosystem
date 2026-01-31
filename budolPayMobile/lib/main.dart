import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/api_service.dart';
import 'services/socket_service.dart';
import 'services/pusher_service.dart';
import 'services/realtime_service.dart';
import 'services/biometric_service.dart';
import 'services/face_embedding_service.dart';
import 'services/session_service.dart';
import 'widgets/session_overlay.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/registration_screen.dart';
import 'screens/wallet_screen.dart';
import 'screens/send_money_screen.dart';
import 'screens/add_money_screen.dart';
import 'screens/cash_in_screen.dart';
import 'screens/cash_out_screen.dart';
import 'screens/transfer_screen.dart';
import 'screens/qr_scanner_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/kyc_verification_screen.dart';
import 'screens/transaction_history_screen.dart';
import 'screens/transaction_details_screen.dart';
import 'screens/change_phone_number_screen.dart';
import 'screens/edit_profile_screen.dart';
import 'screens/change_mpin_screen.dart';
import 'screens/marketing_ads_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/favorites_screen.dart';
import 'screens/payment_status_screen.dart';
import 'constants/routes.dart';
import 'package:flutter/foundation.dart';
import 'dart:ui';

void main() async {
  // Immediate diagnostic logging
  debugPrint('BudolPay: main() entrypoint reached');
  
  try {
    WidgetsFlutterBinding.ensureInitialized();
    debugPrint('BudolPay: WidgetsFlutterBinding initialized');
  } catch (e) {
    debugPrint('BudolPay: WidgetsFlutterBinding failed: $e');
  }
  debugPrint('BudolPay: WidgetsBinding initialized');
  
  // Setup global error logging
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    if (kDebugMode) {
      print('Flutter Error: ${details.exception}');
      print('Stack Trace: ${details.stack}');
    }
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    if (kDebugMode) {
      print('Platform Error: $error');
      print('Stack Trace: $stack');
    }
    return true;
  };
  
  final apiService = ApiService();
  final socketService = SocketService();
  final pusherService = PusherService();
  final realtimeService = RealtimeService(apiService, socketService, pusherService);
  final biometricService = BiometricService();
  final faceEmbeddingService = FaceEmbeddingService();
  final sessionService = SessionService(apiService);
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  // Force reset ads status for Web Debug to ensure visibility (v469)
  if (kIsWeb && kDebugMode) {
    debugPrint('BudolPay: Web Debug Mode - Resetting Ads status for testing');
    await apiService.resetAdsStatus();
  }
  
  // Set global error handler for widget build errors
  ErrorWidget.builder = (FlutterErrorDetails details) {
    if (kDebugMode) {
      print('Widget Build Error: ${details.exception}');
    }
    
    return Material(
      child: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 64),
              const SizedBox(height: 16),
              const Text(
                'Oops! Something went wrong.',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                details.exception.toString(),
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () {
                  // Force redirect to login
                  navigatorKey.currentState?.pushNamedAndRemoveUntil(Routes.login, (route) => false);
                },
                child: const Text('Go to Login'),
              ),
            ],
          ),
        ),
      ),
    );
  };
  
  try {
    // Ensure the session is loaded before starting the app
    // We set a timeout to prevent infinite white screen if SharedPreferences hangs
    await apiService.init().timeout(const Duration(seconds: 10));
    debugPrint('BudolPay: ApiService initialized');
  } catch (e) {
    if (kDebugMode) {
      print('Main: Initialization error: $e');
    }
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => apiService),
        ChangeNotifierProvider(create: (_) => socketService),
        ChangeNotifierProvider(create: (_) => pusherService),
        ChangeNotifierProvider(create: (_) => realtimeService),
        ChangeNotifierProvider(create: (_) => sessionService),
        Provider.value(value: biometricService),
        Provider.value(value: faceEmbeddingService),
      ],
      child: BudolPayApp(
        apiService: apiService, 
        socketService: socketService, 
        pusherService: pusherService,
        realtimeService: realtimeService,
        sessionService: sessionService,
        navigatorKey: navigatorKey
      ),
    ),
  );
}

class BudolPayApp extends StatefulWidget {
  final ApiService apiService;
  final SocketService socketService;
  final PusherService pusherService;
  final RealtimeService realtimeService;
  final SessionService sessionService;
  final GlobalKey<NavigatorState> navigatorKey;

  const BudolPayApp({
    super.key, 
    required this.apiService, 
    required this.socketService, 
    required this.pusherService,
    required this.realtimeService,
    required this.sessionService,
    required this.navigatorKey
  });

  @override
  State<BudolPayApp> createState() => _BudolPayAppState();
}

class _BudolPayAppState extends State<BudolPayApp> {
  @override
  void initState() {
    super.initState();
    // Listen for global auth changes
    widget.apiService.addListener(_handleAuthChange);
  }

  @override
  void dispose() {
    widget.apiService.removeListener(_handleAuthChange);
    super.dispose();
  }

  void _handleAuthChange() {
    if (!widget.apiService.isAuthenticated) {
      // Use the navigator key directly to find current route name
      String? currentRouteName;
      try {
        widget.navigatorKey.currentState?.popUntil((route) {
          currentRouteName = route.settings.name;
          return true; // Don't actually pop
        });
      } catch (e) {
        debugPrint('BudolPay: Error getting current route: $e');
      }

      debugPrint('BudolPay: Auth change detected. Authenticated: false. Current route: $currentRouteName');

      // List of routes that DON'T require authentication
      final publicRoutes = [
        Routes.splash,
        Routes.marketing,
        Routes.login,
        Routes.registration,
      ];

      // Ignore redirect if we are already on a public route
      if (currentRouteName != null && publicRoutes.contains(currentRouteName)) {
        debugPrint('BudolPay: Already on a public route ($currentRouteName), ignoring redirect.');
        return;
      }

      debugPrint('BudolPay: Session cleared or expired. Hard redirecting to login UI.');
      
      // Ensure we clear the lock screen state in session service as well
      widget.sessionService.resetInactivityTimer();
      
      widget.navigatorKey.currentState?.pushNamedAndRemoveUntil(
        Routes.login,
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: widget.navigatorKey,
      title: 'budol₱ay',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFF43F5E),
          primary: const Color(0xFFF43F5E),
        ),
        useMaterial3: true,
      ),
      builder: (context, child) {
        // Wrap with SessionOverlay to handle locks and inactivity
        final secureChild = SessionOverlay(child: child ?? const SizedBox());
        
        if (!kIsWeb) return secureChild;
        
        return Container(
          color: const Color(0xFF0F172A),
          child: Center(
            child: Container(
              width: 393,
              height: 780,
              margin: const EdgeInsets.symmetric(vertical: 20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(40),
                border: Border.all(color: Colors.white10, width: 8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.5),
                    blurRadius: 30,
                    offset: const Offset(0, 15),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(32),
                child: SizedBox.expand(
                  child: Material(
                    color: const Color(0xFF0F172A),
                    child: secureChild,
                  ),
                ),
              ),
            ),
          ),
        );
      },
      initialRoute: Routes.splash,
      routes: {
        Routes.splash: (context) => const SplashScreen(),
        Routes.home: (context) => const HomeScreen(),
        Routes.login: (context) => const LoginScreen(),
        Routes.registration: (context) => const RegistrationScreen(),
        Routes.wallet: (context) => const WalletScreen(),
        Routes.sendMoney: (context) => const SendMoneyScreen(),
        Routes.addMoney: (context) => const AddMoneyScreen(),
        Routes.cashIn: (context) => const CashInScreen(),
        Routes.cashOut: (context) => const CashOutScreen(),
        Routes.transfer: (context) => const TransferScreen(),
        Routes.qrScanner: (context) => const QRScannerScreen(),
        Routes.settings: (context) => const SettingsScreen(),
        Routes.kyc: (context) => const KYCVerificationScreen(),
        Routes.transactionHistory: (context) => const TransactionHistoryScreen(),
        Routes.transactionDetails: (context) {
          final args = ModalRoute.of(context)?.settings.arguments;
          return TransactionDetailsScreen(
            transaction: args is Map ? Map<String, dynamic>.from(args) : {},
          );
        },
        Routes.changePhoneNumber: (context) => const ChangePhoneNumberScreen(),
        Routes.editProfile: (context) => const EditProfileScreen(),
        Routes.changeMpin: (context) => const ChangeMpinScreen(),
        Routes.marketing: (context) => const MarketingAdsScreen(),
        Routes.favorites: (context) => const FavoritesScreen(),
        '/payment-status': (context) {
          final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>? ?? {};
          return PaymentStatusScreen(
            initialStatus: args['status'] ?? PaymentStatus.verifying,
            transactionData: args['transactionData'],
            errorMessage: args['errorMessage'],
          );
        },
      },
    );
  }
}
