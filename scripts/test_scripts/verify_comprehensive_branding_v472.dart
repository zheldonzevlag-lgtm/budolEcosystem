import 'dart:io';

void main() {
  print('--- Verifying Comprehensive Peso Branding Update (v472 Refinement) ---');
  
  final baseDir = 'd:/IT Projects/budolEcosystem/budolPayMobile/lib';

  final checks = {
    '$baseDir/screens/login_screen.dart': [
      'budol₱ay',
      'New to budol₱ay'
    ],
    '$baseDir/screens/qr_scanner_screen.dart': [
      'budol₱ay Wallet',
      'format for budol₱ay'
    ],
    '$baseDir/services/biometric_service.dart': [
      'log in to budol₱ay',
      'login for budol₱ay'
    ],
    '$baseDir/main.dart': [
      'Booting budol₱ay Engine'
    ],
    '$baseDir/utils/ui_utils.dart': [
      'port of your budol₱ay Gateway'
    ],
    '$baseDir/services/discovery_service.dart': [
      'Discovers the budol₱ay API Gateway'
    ]
  };

  bool overallPass = true;
  checks.forEach((path, patterns) {
    if (!_checkFile(path, patterns)) {
      overallPass = false;
    }
  });

  if (overallPass) {
    print('\n[SUCCESS] All files verified for Philippine Peso branding.');
  } else {
    print('\n[FAILURE] Some files failed verification.');
    exit(1);
  }

  print('\n--- Verification Complete ---');
}

bool _checkFile(String path, List<String> patterns) {
  final file = File(path);
  if (!file.existsSync()) {
    print('[FAIL] ${path.split('/').last}: File not found');
    return false;
  }

  final content = file.readAsStringSync();
  bool allFound = true;
  for (final pattern in patterns) {
    if (!content.contains(pattern)) {
      print('[FAIL] ${path.split('/').last}: Pattern "$pattern" not found');
      allFound = false;
    }
  }

  if (allFound) {
    print('[PASS] ${path.split('/').last}: All patterns verified');
  }
  return allFound;
}
