
import 'dart:io';

void main() {
  print('--- Verifying Philippine Peso Branding Fix (v472) ---');
  
  final uiUtilsPath = 'd:/IT Projects/budolEcosystem/budolPayMobile/lib/utils/ui_utils.dart';
  final mainPath = 'd:/IT Projects/budolEcosystem/budolPayMobile/lib/main.dart';
  final homePath = 'd:/IT Projects/budolEcosystem/budolPayMobile/lib/screens/home_screen.dart';
  final marketingPath = 'd:/IT Projects/budolEcosystem/budolPayMobile/lib/screens/marketing_ads_screen.dart';

  _checkFile(uiUtilsPath, 'ui_utils.dart', [
    'suffixPart = "₱ay";',
    'r\'(budol)(_?)([a-zA-Z\\₱]+)\''
  ]);

  _checkFile(mainPath, 'main.dart', [
    'title: \'budol₱ay\','
  ]);

  _checkFile(homePath, 'home_screen.dart', [
    '\'budol₱ay\','
  ]);

  _checkFile(marketingPath, 'marketing_ads_screen.dart', [
    'suffix = \'₱ay\';'
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
