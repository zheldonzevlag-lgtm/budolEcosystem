
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:budol_pay_mobile/screens/login_screen.dart';
import 'package:budol_pay_mobile/services/biometric_service.dart';
import 'package:budol_pay_mobile/services/face_embedding_service.dart';
import 'package:budol_pay_mobile/services/api_service.dart';

// Manual Mocks
class MockBiometricService implements BiometricService {
  bool _enabled = false;
  List<double>? _template;
  
  void setMockState({required bool enabled, List<double>? template}) {
    _enabled = enabled;
    _template = template;
  }

  @override
  Future<bool> isAvailable() async => true;
  @override
  Future<bool> isEnabled() async => _enabled;
  @override
  Future<List<double>?> getStoredFaceTemplate() async => _template;
  @override
  Future<bool> hasEnrolledFace() async => true;
  @override
  Future<bool> hasEnrolledBiometrics() async => true;
  @override
  Future<void> setEnabled(bool enabled) async => _enabled = enabled;
  @override
  Future<String?> getStoredPin() async => '123456';
  @override
  Future<void> storeFaceTemplate(List<double> template) async => _template = template;
  @override
  Future<void> clearFaceTemplate() async => _template = null;
  @override
  Future<void> storePin(String pin) async {}
  @override
  Future<void> clearStoredPin() async {}
  @override
  Future<bool> authenticate() async => true;
  @override
  void Function(String)? onLogUpdate;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class MockFaceEmbeddingService implements FaceEmbeddingService {
  @override
  Stream<String> get logStream => const Stream.empty();
  @override
  double compare(List<double> e1, List<double> e2) => 0.9;
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class MockApiService extends ChangeNotifier implements ApiService {
  @override
  String get appVersion => '1.2.87';
  @override
  Map<String, dynamic>? get user => {'id': 1};
  @override
  Map<String, dynamic>? get currentUser => user;
  @override
  String get host => 'localhost';
  
  @override
  Future<Map<String, dynamic>> identifyMobile(String phone) async {
    return {'status': 'AUTH_REQUIRED', 'userId': '1'};
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  testWidgets('LoginScreen allows face login when toggle is OFF but face is registered', (WidgetTester tester) async {
    final mockBiometric = MockBiometricService();
    final mockFace = MockFaceEmbeddingService();
    final mockApi = MockApiService();

    // Scenario: Toggle OFF, Face Registered
    mockBiometric.setMockState(enabled: false, template: [0.1, 0.2, 0.3]);

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          Provider<BiometricService>.value(value: mockBiometric),
          Provider<FaceEmbeddingService>.value(value: mockFace),
          ChangeNotifierProvider<ApiService>.value(value: mockApi),
        ],
        child: const MaterialApp(
          home: LoginScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // 1. Enter Phone to get to PIN step (Mocking identify to skip OTP)
    final phoneField = find.byType(TextField).first;
    await tester.enterText(phoneField, '09123456789');
    await tester.pump(); // Trigger onChanged
    
    final continueButton = find.text('Continue');
    expect(continueButton, findsOneWidget);
    await tester.tap(continueButton);
    await tester.pumpAndSettle();

    // Now we should be on the PIN step
    if (find.text('Enter your 6-digit PIN').evaluate().isEmpty) {
      print('DEBUG: PIN Step not found. Printing widget tree:');
      debugDumpApp();
      
      // Check if there is an error message visible
      final errorFinder = find.byType(SnackBar);
      if (errorFinder.evaluate().isNotEmpty) {
        final snackBar = tester.widget<SnackBar>(errorFinder);
        final text = (snackBar.content as Text).data;
        print('DEBUG: SnackBar error found: $text');
      }
    }
    expect(find.text('Enter your 6-digit PIN'), findsOneWidget);

    // Verify face icon is present
    expect(find.byIcon(Icons.face), findsOneWidget);

    // Tap face icon
    await tester.tap(find.byIcon(Icons.face));
    await tester.pump();

    // Verify we DON'T see the error "Face login is not enabled"
    expect(find.textContaining('Face login is not enabled'), findsNothing);
    
    print('Test Passed: Face login proceeded despite biometric toggle being OFF.');
  });
}
