---
name: screens
description: "Skill for the Screens area of budolEcosystem. 172 symbols across 27 files."
---

# Screens

172 symbols | 27 files | Cohesion: 85%

## When to Use

- Working with code in `budolPayMobile/`
- Understanding how Tooltip, PhoneNumberFormatter, CurrencyInputFormatter work
- Modifying screens-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `budolPayMobile/lib/screens/login_screen.dart` | initState, _startResendTimer, _handleResendOtp, didChangeAppLifecycleState, _checkBiometrics (+22) |
| `budolPayMobile/lib/screens/registration_screen.dart` | _handleRegister, _showError, build, _buildProgressIndicator, _buildPhoneStep (+10) |
| `budolPayMobile/lib/services/biometric_service.dart` | _readSecure, isAvailable, getAvailableBiometricTypes, hasEnrolledBiometrics, hasEnrolledFace (+9) |
| `budolPayMobile/lib/screens/kyc_verification_screen.dart` | _selectDate, _pickImage, build, _buildStepIndicator, _buildStepDivider (+8) |
| `budolPayMobile/lib/screens/payment_status_screen.dart` | _buildTransactionDetails, _buildDetailRow, PaymentStatusScreen, initState, _performVerification (+4) |
| `budolPayMobile/lib/screens/home_screen.dart` | initState, _fetchData, _formatBalance, _initRealtime, _fetchBalance (+4) |
| `budolPayMobile/lib/screens/kyc_capture_screen.dart` | KYCCaptureScreen, initState, dispose, didChangeAppLifecycleState, _initializeCamera (+3) |
| `budolPayMobile/lib/services/api_service.dart` | addFavorite, removeFavorite, getBalance, checkEmail, getFavorites (+3) |
| `budolPayMobile/lib/screens/qr_scanner_screen.dart` | build, _handlePayment, _onDetect, _pickImage, _processQRCode (+2) |
| `budolPayMobile/lib/screens/marketing_ads_screen.dart` | initState, importJsMethod, _startTimer, _onNext, build (+2) |

## Entry Points

Start here when exploring this area:

- **`Tooltip`** (Function) — `budolshap-0.1.0/app/store/settings/page.jsx:45`
- **`PhoneNumberFormatter`** (Class) — `budolPayMobile/lib/utils/formatters.dart:3`
- **`CurrencyInputFormatter`** (Class) — `budolPayMobile/lib/utils/formatters.dart:24`
- **`AmountUtils`** (Class) — `budolPayMobile/lib/utils/formatters.dart:55`
- **`KYCCaptureScreen`** (Class) — `budolPayMobile/lib/screens/kyc_capture_screen.dart:8`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `PhoneNumberFormatter` | Class | `budolPayMobile/lib/utils/formatters.dart` | 3 |
| `CurrencyInputFormatter` | Class | `budolPayMobile/lib/utils/formatters.dart` | 24 |
| `AmountUtils` | Class | `budolPayMobile/lib/utils/formatters.dart` | 55 |
| `KYCCaptureScreen` | Class | `budolPayMobile/lib/screens/kyc_capture_screen.dart` | 8 |
| `SendMoneyScreen` | Class | `budolPayMobile/lib/screens/send_money_screen.dart` | 8 |
| `SessionOverlay` | Class | `budolPayMobile/lib/widgets/session_overlay.dart` | 7 |
| `TransactionDetailsScreen` | Class | `budolPayMobile/lib/screens/transaction_details_screen.dart` | 7 |
| `PaymentStatusScreen` | Class | `budolPayMobile/lib/screens/payment_status_screen.dart` | 9 |
| `PaymentSummaryScreen` | Class | `budolPayMobile/lib/screens/qr_scanner_screen.dart` | 235 |
| `Tooltip` | Function | `budolshap-0.1.0/app/store/settings/page.jsx` | 45 |
| `isAvailable` | Method | `budolPayMobile/lib/services/biometric_service.dart` | 69 |
| `getAvailableBiometricTypes` | Method | `budolPayMobile/lib/services/biometric_service.dart` | 80 |
| `hasEnrolledBiometrics` | Method | `budolPayMobile/lib/services/biometric_service.dart` | 89 |
| `hasEnrolledFace` | Method | `budolPayMobile/lib/services/biometric_service.dart` | 100 |
| `isEnabled` | Method | `budolPayMobile/lib/services/biometric_service.dart` | 110 |
| `getStoredPin` | Method | `budolPayMobile/lib/services/biometric_service.dart` | 123 |
| `getStoredFaceTemplate` | Method | `budolPayMobile/lib/services/biometric_service.dart` | 135 |
| `authenticate` | Method | `budolPayMobile/lib/services/biometric_service.dart` | 150 |
| `initState` | Method | `budolPayMobile/lib/screens/settings_screen.dart` | 38 |
| `initState` | Method | `budolPayMobile/lib/screens/login_screen.dart` | 58 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Build → TimezoneUtils` | cross_community | 9 |
| `Build → GetManilaNow` | cross_community | 8 |
| `Build → SetLoading` | cross_community | 8 |
| `Build → InterpreterOptions` | cross_community | 7 |
| `Build → GetInputTensors` | cross_community | 6 |
| `Build → Img` | cross_community | 6 |
| `Build → NotifyListeners` | cross_community | 6 |
| `Build → _ensureInitialized` | cross_community | 6 |
| `InitState → _ensureInitialized` | cross_community | 6 |
| `Build → FromFile` | cross_community | 5 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Services | 30 calls |
| Widgets | 6 calls |
| V2 | 1 calls |

## How to Explore

1. `gitnexus_context({name: "Tooltip"})` — see callers and callees
2. `gitnexus_query({query: "screens"})` — find related execution flows
3. Read key files listed above for implementation details
