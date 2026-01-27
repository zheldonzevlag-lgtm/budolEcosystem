import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:budol_pay_mobile/services/api_service.dart';

void main() {
  testWidgets('App shell renders', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SizedBox()));
    expect(find.byType(SizedBox), findsOneWidget);
  });

  test('ApiService URL derivation supports host with and without port', () {
    expect(ApiService.computeBaseUrlFromHost('localhost'), 'http://localhost:8080');
    expect(ApiService.computeAuthUrlFromHost('localhost'), 'http://localhost:8001');

    expect(ApiService.computeBaseUrlFromHost('10.0.2.2:9090'), 'http://10.0.2.2:9090');
    expect(ApiService.computeAuthUrlFromHost('10.0.2.2:9090'), 'http://10.0.2.2:8001');

    expect(ApiService.computeBaseUrlFromHost('http://10.0.2.2:9090/'), 'http://10.0.2.2:9090');
    expect(ApiService.computeAuthUrlFromHost('https://10.0.2.2:9090/'), 'http://10.0.2.2:8001');
  });
}
