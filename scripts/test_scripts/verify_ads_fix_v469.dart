
import 'dart:io';

void main() {
  print('--- Verifying Marketing Ads Logic (v469) ---');
  
  final mainPath = 'd:/IT Projects/budolEcosystem/budolPayMobile/lib/main.dart';
  final splashPath = 'd:/IT Projects/budolEcosystem/budolPayMobile/lib/screens/splash_screen.dart';

  _checkFile(mainPath, 'main.dart', [
    'apiService.resetAdsStatus()',
    'Force reset ads status'
  ]);

  _checkFile(splashPath, 'splash_screen.dart', [
    'hasSeenAds is FALSE',
    'Navigating to Routes.marketing'
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
