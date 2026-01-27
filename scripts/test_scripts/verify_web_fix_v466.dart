
import 'dart:io';

void main() {
  print('--- BudolPay Web Blank Screen Fix Verification ---');
  
  final sessionOverlayPath = 'budolPayMobile/lib/widgets/session_overlay.dart';
  final marketingAdsPath = 'budolPayMobile/lib/screens/marketing_ads_screen.dart';
  
  bool allPassed = true;

  // 1. Verify SessionOverlay fix
  if (File(sessionOverlayPath).existsSync()) {
    final content = File(sessionOverlayPath).readAsStringSync();
    if (content.contains('Positioned.fill') && content.contains('child: Listener')) {
      print('[PASS] SessionOverlay: Found Positioned.fill wrapping Listener');
    } else {
      print('[FAIL] SessionOverlay: Positioned.fill not found wrapping Listener');
      allPassed = false;
    }
  } else {
    print('[FAIL] SessionOverlay: File not found at $sessionOverlayPath');
    allPassed = false;
  }

  // 2. Verify MarketingAdsScreen debug logging
  if (File(marketingAdsPath).existsSync()) {
    final content = File(marketingAdsPath).readAsStringSync();
    if (content.contains('debugPrint(\'MarketingAdsScreen: Raw constraints:')) {
      print('[PASS] MarketingAdsScreen: Found raw constraint logging');
    } else {
      print('[FAIL] MarketingAdsScreen: Raw constraint logging not found');
      allPassed = false;
    }
    
    if (content.contains('debugPrint(\'MarketingAdsScreen: Building slide')) {
      print('[PASS] MarketingAdsScreen: Found slide build logging');
    } else {
      print('[FAIL] MarketingAdsScreen: Slide build logging not found');
      allPassed = false;
    }
  } else {
    print('[FAIL] MarketingAdsScreen: File not found at $marketingAdsPath');
    allPassed = false;
  }

  if (allPassed) {
    print('\n[SUCCESS] All verification checks passed for v466.');
    exit(0);
  } else {
    print('\n[ERROR] Verification failed.');
    exit(1);
  }
}
