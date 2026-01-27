
import 'dart:io';

void main() {
  print('--- Verifying Web Blank Screen Fix (v467) ---');
  
  final sessionOverlayPath = 'd:/IT Projects/budolEcosystem/budolPayMobile/lib/widgets/session_overlay.dart';
  final marketingAdsPath = 'd:/IT Projects/budolEcosystem/budolPayMobile/lib/screens/marketing_ads_screen.dart';
  final indexPath = 'd:/IT Projects/budolEcosystem/budolPayMobile/web/index.html';
  final splashPath = 'd:/IT Projects/budolEcosystem/budolPayMobile/lib/screens/splash_screen.dart';
  final jsHelperPath = 'd:/IT Projects/budolEcosystem/budolPayMobile/lib/utils/js_helper_web.dart';

  _checkFile(sessionOverlayPath, 'SessionOverlay', [
    'Positioned.fill',
    'child: Listener'
  ]);

  _checkFile(marketingAdsPath, 'MarketingAdsScreen', [
    'Layout constraints:',
    'maxWidth == 0 || maxHeight == 0'
  ]);

  _checkFile(indexPath, 'index.html', [
    'removeSplashFromWeb',
    'setTimeout(function()',
    'flutter_bootstrap.js',
    'async'
  ]);

  _checkFile(splashPath, 'SplashScreen', [
    'callJsMethod(\'removeSplashFromWeb\')'
  ]);

  _checkFile(jsHelperPath, 'JSHelper', [
    'js.context.hasProperty(method)'
  ]);

  print('\n--- Verification Complete ---');
}

void _checkFile(String path, String label, List<String> patterns) {
  final file = File(path);
  if (!file.existsSync()) {
    print('[FAIL] $label: File not found at $path');
    return;
  }

  final content = file.readAsStringSync();
  bool allFound = true;
  for (final pattern in patterns) {
    if (!content.contains(pattern)) {
      print('[FAIL] $label: Pattern "$pattern" not found');
      allFound = false;
    }
  }

  if (allFound) {
    print('[PASS] $label: All patterns verified');
  }
}
