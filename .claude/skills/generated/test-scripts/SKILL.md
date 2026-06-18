---
name: test-scripts
description: "Skill for the Test_scripts area of budolEcosystem. 107 symbols across 47 files."
---

# Test_scripts

107 symbols | 47 files | Cohesion: 85%

## When to Use

- Working with code in `scripts/`
- Understanding how PUT, GET, POST work
- Modifying test_scripts-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `scripts/test_scripts/e2e-checkout-flow.mjs` | testResult, apiCall, generateTestOrderId, testServiceHealth, testUserRegistration (+10) |
| `scripts/test_scripts/test-phase16-integration.mjs` | logTest, testBudolShapRates, calculateRate, testAccountingEntries, testAccountingSyncClient (+3) |
| `budolshap-0.1.0/scripts/test_scripts/verify_auth_logic.js` | update, verifyPassword, hashPassword, loginWithBudolId, authenticateUser (+1) |
| `budolshap-0.1.0/scripts/test_scripts/quick-test.js` | generateSignature, sleep, sendWebhook, checkDatabase, showResults (+1) |
| `scripts/test_scripts/test_face_login_v390.dart` | MockBiometricService, setMockState, MockFaceEmbeddingService, MockApiService, main |
| `scripts/test_scripts/verify_settings_biometrics_v475.dart` | MockBiometricService, MockApiService, MockFaceEmbeddingService, main |
| `scripts/test_scripts/update_docs_nav.js` | getDocFolders, buildNavBlock, ensureNavForDoc, main |
| `scripts/test_scripts/test_face_login_v389.dart` | MockBiometricService, MockFaceEmbeddingService, MockApiService, main |
| `scripts/test_scripts/verify_biometric_flow_v474.dart` | MockBiometricService, MockApiService, main |
| `scripts/test_scripts/verify_compliance_v3.2.0.mjs` | maskPII, verifyCompliance, isMasked |

## Entry Points

Start here when exploring this area:

- **`PUT`** (Function) — `budolshap-0.1.0/app/api/cart/route.js:62`
- **`GET`** (Function) — `budolshap-0.1.0/app/api/admin/audit-logs/route.js:4`
- **`POST`** (Function) — `budolshap-0.1.0/app/api/stores/[storeId]/addresses/route.js:29`
- **`DELETE`** (Function) — `budolshap-0.1.0/app/api/admin/users/[userId]/route.js:263`
- **`POST`** (Function) — `budolshap-0.1.0/app/api/admin/users/sync-rbac/route.js:9`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `MockBiometricService` | Class | `scripts/test_scripts/verify_settings_biometrics_v475.dart` | 11 |
| `MockApiService` | Class | `scripts/test_scripts/verify_settings_biometrics_v475.dart` | 12 |
| `MockFaceEmbeddingService` | Class | `scripts/test_scripts/verify_settings_biometrics_v475.dart` | 13 |
| `MockBiometricService` | Class | `scripts/test_scripts/verify_biometric_flow_v474.dart` | 11 |
| `MockApiService` | Class | `scripts/test_scripts/verify_biometric_flow_v474.dart` | 12 |
| `MockBiometricService` | Class | `scripts/test_scripts/test_face_login_v390.dart` | 10 |
| `MockFaceEmbeddingService` | Class | `scripts/test_scripts/test_face_login_v390.dart` | 50 |
| `MockApiService` | Class | `scripts/test_scripts/test_face_login_v390.dart` | 59 |
| `MockApiService` | Class | `budolPayMobile/test/session_test.dart` | 4 |
| `FaceEmbeddingService` | Class | `budolPayMobile/lib/services/face_embedding_service.dart` | 11 |
| `BiometricService` | Class | `budolPayMobile/lib/services/biometric_service.dart` | 9 |
| `ApiService` | Class | `budolPayMobile/lib/services/api_service.dart` | 37 |
| `SettingsScreen` | Class | `budolPayMobile/lib/screens/settings_screen.dart` | 13 |
| `LoginScreen` | Class | `budolPayMobile/lib/screens/login_screen.dart` | 18 |
| `MockBiometricService` | Class | `scripts/test_scripts/test_face_login_v389.dart` | 9 |
| `MockFaceEmbeddingService` | Class | `scripts/test_scripts/test_face_login_v389.dart` | 25 |
| `MockApiService` | Class | `scripts/test_scripts/test_face_login_v389.dart` | 35 |
| `UIUtils` | Class | `budolPayMobile/lib/utils/ui_utils.dart` | 4 |
| `PUT` | Function | `budolshap-0.1.0/app/api/cart/route.js` | 62 |
| `GET` | Function | `budolshap-0.1.0/app/api/admin/audit-logs/route.js` | 4 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `DELETE → FindUnique` | cross_community | 6 |
| `GET → FindUnique` | cross_community | 6 |
| `POST → FindUnique` | cross_community | 6 |
| `POST → FindUnique` | cross_community | 6 |
| `POST → $transaction` | cross_community | 6 |
| `POST → $transaction` | cross_community | 5 |
| `DELETE → VerifyToken` | cross_community | 5 |
| `DELETE → GetPusher` | cross_community | 5 |
| `GET → VerifyToken` | cross_community | 5 |
| `GET → GetPusher` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Test_scripts_2 | 19 calls |
| Categories | 4 calls |
| Paymongo | 2 calls |
| Services | 1 calls |
| Components | 1 calls |
| Adapters | 1 calls |
| Auth | 1 calls |

## How to Explore

1. `gitnexus_context({name: "PUT"})` — see callers and callees
2. `gitnexus_query({query: "test_scripts"})` — find related execution flows
3. Read key files listed above for implementation details
