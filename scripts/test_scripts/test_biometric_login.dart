import 'dart:io';

Directory _findRepoRoot() {
  var current = Directory.current;
  while (true) {
    final hasBudolPayMobile = Directory('${current.path}\\budolPayMobile').existsSync();
    final hasDocumentation = Directory('${current.path}\\documentation').existsSync();
    if (hasBudolPayMobile && hasDocumentation) {
      return current;
    }
    final parent = current.parent;
    if (parent.path == current.path) {
      return Directory.current;
    }
    current = parent;
  }
}

String _readAppVersion(String repoRoot) {
  final pubspec = File('$repoRoot\\budolPayMobile\\pubspec.yaml');
  if (!pubspec.existsSync()) return 'unknown';
  final content = pubspec.readAsStringSync();
  final match = RegExp(r'^version:\s*([^\s]+)\s*$', multiLine: true).firstMatch(content);
  if (match == null) return 'unknown';
  final full = match.group(1) ?? 'unknown';
  return full.split('+').first;
}

Future<void> main(List<String> args) async {
  final repoRootDir = _findRepoRoot();
  final repoRoot = repoRootDir.path;
  final appVersion = _readAppVersion(repoRoot);
  final apk = File('$repoRoot\\android-installer\\budolpay-$appVersion.apk');

  stdout.writeln('budolPay Release E2E Checklist (v$appVersion)');
  stdout.writeln('Repository: $repoRoot');
  stdout.writeln('APK exists: ${apk.existsSync()}');
  stdout.writeln('APK path: ${apk.path}');
  stdout.writeln('');
  stdout.writeln('New Feature: Login API Configuration');
  stdout.writeln('1) Launch app to Login Screen');
  stdout.writeln('2) Tap Gear/Settings icon in top right');
  stdout.writeln('3) Verify "API Host Configuration" dialog appears');
  stdout.writeln('4) Enter valid host (e.g. 192.168.1.24:8080)');
  stdout.writeln('5) Tap "Save" and verify snackbar "Host updated!"');
  stdout.writeln('6) Verify footer at bottom shows new host');
  stdout.writeln('7) Verify "Scan Network" button works (if gateway is running on local network)');
  stdout.writeln('');
  stdout.writeln('Device prerequisites');
  stdout.writeln('1) Android device/emulator has screen lock enabled (PIN/Pattern/Password)');
  stdout.writeln('2) Android device/emulator has fingerprint/face enrolled');
  stdout.writeln('3) App installed from android-installer/budolPay_$appVersion.apk');
  stdout.writeln('4) App can reach the BudolPay gateway host (Settings -> Gateway Host)');
  stdout.writeln('');
  stdout.writeln('Behavior notes (OS enrollment dependent)');
  stdout.writeln('- Biometric login requires OS-level enrollment. If no biometrics are enrolled, the OS prompt may fail or be unavailable.');
  stdout.writeln('- The app stores the PIN only after a successful manual PIN login while biometrics are enabled.');
  stdout.writeln('- Disabling biometrics clears the stored PIN from secure storage.');
  stdout.writeln('');
  stdout.writeln('Flow: Enable biometrics');
  stdout.writeln('Option A (Settings-first)');
  stdout.writeln('1. Log in normally using OTP + PIN');
  stdout.writeln('2. Open Settings');
  stdout.writeln('3. Enable Biometric Login toggle');
  stdout.writeln('4. Log out');
  stdout.writeln('5. Log in again using OTP + PIN once (stores PIN for biometric use)');
  stdout.writeln('6. Log out');
  stdout.writeln('');
  stdout.writeln('Option B (Prompt-on-login)');
  stdout.writeln('1. Log in normally using OTP + PIN');
  stdout.writeln('2. When asked to enable biometric login, tap Enable');
  stdout.writeln('3. Log out');
  stdout.writeln('');
  stdout.writeln('Flow: Biometric login');
  stdout.writeln('1. On Login screen (PIN step), tap biometric icon');
  stdout.writeln('2. OS biometric prompt appears');
  stdout.writeln('3. Authenticate successfully');
  stdout.writeln('4. PIN auto-fills and login proceeds');
  stdout.writeln('Expected: Navigates to Home screen without typing PIN');
  stdout.writeln('');
  stdout.writeln('Negative: No enrolled biometrics');
  stdout.writeln('1. Remove all enrolled biometrics in Android settings');
  stdout.writeln('2. Return to app and try biometric login');
  stdout.writeln('Expected: OS prompt fails or authentication returns false; user must login with PIN');
  stdout.writeln('');
  stdout.writeln('Flow: Disable biometrics');
  stdout.writeln('1. Open Settings');
  stdout.writeln('2. Disable Biometric Login toggle');
  stdout.writeln('3. Log out');
  stdout.writeln('4. Try biometric login again');
  stdout.writeln('Expected: Icon may still show if hardware supports it, but biometric login is disabled and no stored PIN is used');
}
