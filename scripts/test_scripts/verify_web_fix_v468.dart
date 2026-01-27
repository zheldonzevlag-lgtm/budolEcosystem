
import 'dart:io';

void main() {
  print('--- Verifying Web Engine Config Fix (v468) ---');
  
  final indexPath = 'd:/IT Projects/budolEcosystem/budolPayMobile/web/index.html';

  _checkFile(indexPath, 'index.html', [
    '20000', // Increased timeout
    'removeSplashFromWeb',
    'flutter_bootstrap.js'
  ]);

  // Ensure window.flutterConfiguration is REMOVED
  final content = File(indexPath).readAsStringSync();
  if (content.contains('window.flutterConfiguration')) {
    print('[FAIL] index.html: window.flutterConfiguration still present!');
  } else {
    print('[PASS] index.html: window.flutterConfiguration removed successfully');
  }

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
