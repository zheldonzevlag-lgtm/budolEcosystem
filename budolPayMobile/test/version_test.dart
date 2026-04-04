import 'package:flutter_test/flutter_test.dart';
import 'package:budol_pay_mobile/services/api_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('ApiService version should be 1.3.81', () {
    final apiService = ApiService();
    expect(apiService.appVersion, '1.3.81');
  });
}
