import 'package:flutter_test/flutter_test.dart';
import 'package:budol_pay_mobile/services/biometric_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';

@GenerateNiceMocks([MockSpec<FlutterSecureStorage>()])
import 'biometric_service_test.mocks.dart';

void main() {
  late BiometricService biometricService;
  late MockFlutterSecureStorage mockStorage;

  setUp(() {
    mockStorage = MockFlutterSecureStorage();
    biometricService = BiometricService();
    // We need to inject the mock storage, but BiometricService creates it internally.
    // For testing, we might need to modify BiometricService to accept a storage instance.
  });

  test('isEnabled returns true when storage has true', () async {
    // This test will fail currently because we can't inject the mock.
    // I will modify BiometricService to allow injection.
  });
}
