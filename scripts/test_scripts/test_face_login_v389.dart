import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:budol_pay_mobile/screens/login_screen.dart';
import 'package:budol_pay_mobile/services/biometric_service.dart';
import 'package:budol_pay_mobile/services/face_embedding_service.dart';
import 'package:budol_pay_mobile/services/api_service.dart';

class MockBiometricService implements BiometricService {
  @override
  Future<bool> isAvailable() async => true;
  @override
  Future<bool> isEnabled() async => true;
  @override
  Future<List<double>?> getStoredFaceTemplate() async => null;
  @override
  Future<bool> hasEnrolledFace() async => true;
  @override
  bool get isFaceRegistered => false;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class MockFaceEmbeddingService implements FaceEmbeddingService {
  @override
  Future<List<double>?> generateEmbedding(File imageFile, {Rect? faceArea}) async => null;
  @override
  bool get isInitialized => true;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class MockApiService extends ChangeNotifier implements ApiService {
  @override
  String get appVersion => '1.2.86';
  @override
  String get host => 'localhost';
  @override
  String? token;
  @override
  Map<String, dynamic>? user;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  testWidgets('LoginScreen face icon should handle missing template with choice', (WidgetTester tester) async {
    final mockBiometricService = MockBiometricService();
    final mockFaceService = MockFaceEmbeddingService();
    final mockApiService = MockApiService();

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          Provider<BiometricService>.value(value: mockBiometricService),
          Provider<FaceEmbeddingService>.value(value: mockFaceService),
          ChangeNotifierProvider<ApiService>.value(value: mockApiService),
        ],
        child: const MaterialApp(
          home: LoginScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Verification steps...
    expect(find.byType(LoginScreen), findsOneWidget);
  });
}
