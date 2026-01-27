import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/foundation.dart' show kIsWeb, kDebugMode;
import '../utils/js_helper.dart';
import '../services/api_service.dart';
import '../constants/routes.dart';
import '../utils/ui_utils.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  String _navStatus = 'Initializing...';

  @override
  void initState() {
    super.initState();
    _navigateToNext();
  }

  Future<void> _navigateToNext() async {
    debugPrint('SplashScreen: Starting navigation logic...');
    setState(() => _navStatus = 'Checking configuration...');
    
    await Future.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;

    final apiService = context.read<ApiService>();
    
    try {
      setState(() => _navStatus = 'Loading session...');
      await apiService.init().timeout(const Duration(seconds: 10));
      
      if (apiService.isAuthenticated) {
        setState(() => _navStatus = 'Syncing profile...');
        await apiService.waitForFullInit().timeout(const Duration(seconds: 10));
      }
      
      setState(() => _navStatus = 'Ready');
      await Future.delayed(const Duration(milliseconds: 1000));
    } catch (e) {
      debugPrint('SplashScreen: Initialization error: $e');
      setState(() => _navStatus = 'Init Timeout - Proceeding');
    }

    if (!mounted) return;
    
    final isAuthenticated = apiService.isAuthenticated;
    final hasSeenAds = apiService.hasSeenAds;
    
    debugPrint('SplashScreen: Navigation State - hasSeenAds: $hasSeenAds, isAuthenticated: $isAuthenticated');

    if (mounted) {
      // Signal web engine to remove splash
      if (kIsWeb) {
        debugPrint('SplashScreen: Signaling web splash removal');
        callJsMethod('removeSplashFromWeb');
      }

      if (!hasSeenAds) {
        debugPrint('SplashScreen: hasSeenAds is FALSE. Navigating to Routes.marketing');
        setState(() => _navStatus = 'Navigating to Ads...');
        await Future.delayed(const Duration(milliseconds: 1000)); // Increased delay for stability
        if (mounted) Navigator.pushReplacementNamed(context, Routes.marketing);
      } else if (isAuthenticated) {
        debugPrint('SplashScreen: hasSeenAds is TRUE and Authenticated. Navigating to Routes.home');
        setState(() => _navStatus = 'Navigating to Home...');
        await Future.delayed(const Duration(milliseconds: 500));
        if (mounted) Navigator.pushReplacementNamed(context, Routes.home);
      } else {
        debugPrint('SplashScreen: hasSeenAds is TRUE but NOT Authenticated. Navigating to Routes.login');
        setState(() => _navStatus = 'Navigating to Login...');
        await Future.delayed(const Duration(milliseconds: 500));
        if (mounted) Navigator.pushReplacementNamed(context, Routes.login);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final appVersion = context.watch<ApiService>().appVersion;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Stack(
        children: [
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _buildLogo(),
                const SizedBox(height: 24),
                const CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFF43F5E)),
                  strokeWidth: 2,
                ),
                const SizedBox(height: 16),
                Text(
                  _navStatus,
                  style: const TextStyle(
                    color: Colors.white38,
                    fontSize: 12,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
          
          // Debug/Force Controls
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Column(
              children: [
                Text(
                  'v$appVersion',
                  style: const TextStyle(color: Colors.white10, fontSize: 10),
                ),
                if (kDebugMode) ...[
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      TextButton(
                        onPressed: () {
                          context.read<ApiService>().resetAdsStatus();
                          Navigator.pushReplacementNamed(context, Routes.marketing);
                        },
                        child: const Text('FORCE ADS', style: TextStyle(color: Colors.white24, fontSize: 10)),
                      ),
                      const SizedBox(width: 20),
                      TextButton(
                        onPressed: () {
                          Navigator.pushReplacementNamed(context, Routes.login);
                        },
                        child: const Text('FORCE LOGIN', style: TextStyle(color: Colors.white24, fontSize: 10)),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLogo() {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFFF43F5E).withValues(alpha: 0.15),
            shape: BoxShape.circle,
          ),
          child: const Text(
            '₱',
            style: TextStyle(
              color: Color(0xFFF43F5E),
              fontSize: 70,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(height: 24),
        UIUtils.formatBudolPayText(
          'budol₱ay',
          baseStyle: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }
}
