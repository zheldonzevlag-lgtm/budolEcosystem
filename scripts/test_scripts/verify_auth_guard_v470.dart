
import 'dart:io';

void main() {
  print('--- Verifying Auth Guard Conflict Fix (v470) ---');
  
  final mainPath = 'd:/IT Projects/budolEcosystem/budolPayMobile/lib/main.dart';
  final splashPath = 'd:/IT Projects/budolEcosystem/budolPayMobile/lib/screens/splash_screen.dart';

  _checkFile(mainPath, 'main.dart', [
    'currentRouteName == Routes.splash',
    'currentRouteName == Routes.marketing',
    'Ignoring redirect'
  ]);

  _checkFile(splashPath, 'splash_screen.dart', [
    'RouteSettings(name: Routes.marketing)',
    'pushReplacement'
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
