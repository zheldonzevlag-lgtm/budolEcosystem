---
name: services
description: "Skill for the Services area of budolEcosystem. 247 symbols across 87 files."
---

# Services

247 symbols | 87 files | Cohesion: 77%

## When to Use

- Working with code in `budolshap-0.1.0/`
- Understanding how syncOrderStatus, generateToken, generateEmailToken work
- Modifying services-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `budolPayMobile/lib/services/api_service.dart` | _addLog, clearDebugLogs, _safeDecode, _deleteSecure, setHasSeenAds (+34) |
| `budolshap-0.1.0/lib/services/cacheService.js` | getCacheConfig, deleteCache, deleteFromRedis, deleteFromVercelEdge, deleteFromMemory (+14) |
| `budolshap-0.1.0/lib/email.js` | createTransporter, formatBrandedText, getHtmlTemplate, sendVerificationEmail, sendPasswordResetEmail (+6) |
| `budolshap-0.1.0/services/lalamove.js` | generateSignature, apiRequest, handleApiError, getQuote, createOrder (+4) |
| `budolshap-0.1.0/lib/services/checkoutService.js` | createCheckoutSession, getCheckoutSession, updateCheckoutSession, markCheckoutAsPaid, expireCheckoutSession (+3) |
| `budolPayMobile/lib/services/session_service.dart` | forceLogout, didChangeAppLifecycleState, _handleResumed, _onAuthChanged, resetInactivityTimer (+2) |
| `budolPayMobile/lib/services/face_embedding_service.dart` | _log, _calculateSHA256, dispose, generateEmbedding, _imageToByteListFloat32 (+1) |
| `budolPayMobile/lib/services/tflite_web_stub.dart` | close, fromFile, reshape, Interpreter, getInputTensors (+1) |
| `budolPayMobile/lib/screens/settings_screen.dart` | _showLogoutDialog, build, _buildSettingsTile, dispose, _clearFace |
| `budolshap-0.1.0/lib/services/shippingService.js` | formatPhone, bookReturnShipping, getShippingQuote, trackShipping, getStatusText |

## Entry Points

Start here when exploring this area:

- **`syncOrderStatus`** (Function) — `budolshap-0.1.0/services/shippingOrderUpdater.js:13`
- **`generateToken`** (Function) — `budolshap-0.1.0/lib/token.js:6`
- **`generateEmailToken`** (Function) — `budolshap-0.1.0/lib/token.js:37`
- **`generateResetToken`** (Function) — `budolshap-0.1.0/lib/token.js:42`
- **`verifyResetToken`** (Function) — `budolshap-0.1.0/lib/token.js:57`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `TimezoneUtils` | Class | `budolPayMobile/lib/utils/timezone_utils.dart` | 0 |
| `Interpreter` | Class | `budolPayMobile/lib/services/tflite_web_stub.dart` | 1 |
| `InterpreterOptions` | Class | `budolPayMobile/lib/services/tflite_web_stub.dart` | 9 |
| `BudolPayApp` | Class | `budolPayMobile/lib/main.dart` | 154 |
| `SocketService` | Class | `budolPayMobile/lib/services/socket_service.dart` | 4 |
| `PusherService` | Class | `budolPayMobile/lib/services/pusher_service.dart` | 5 |
| `ShippingProvider` | Class | `budolshap-0.1.0/services/shippingProvider.js` | 4 |
| `Lalamove` | Class | `budolshap-0.1.0/services/lalamove.js` | 9 |
| `FallbackProvider` | Class | `budolshap-0.1.0/services/fallbackProvider.js` | 8 |
| `syncOrderStatus` | Function | `budolshap-0.1.0/services/shippingOrderUpdater.js` | 13 |
| `generateToken` | Function | `budolshap-0.1.0/lib/token.js` | 6 |
| `generateEmailToken` | Function | `budolshap-0.1.0/lib/token.js` | 37 |
| `generateResetToken` | Function | `budolshap-0.1.0/lib/token.js` | 42 |
| `verifyResetToken` | Function | `budolshap-0.1.0/lib/token.js` | 57 |
| `sendOTPSMS` | Function | `budolshap-0.1.0/lib/sms.js` | 17 |
| `sendSMSNotification` | Function | `budolshap-0.1.0/lib/sms.js` | 140 |
| `getSystemSettings` | Function | `budolshap-0.1.0/lib/settings.js` | 61 |
| `rateLimit` | Function | `budolshap-0.1.0/lib/rate-limit.js` | 12 |
| `sendVerificationEmail` | Function | `budolshap-0.1.0/lib/email.js` | 228 |
| `sendPasswordResetEmail` | Function | `budolshap-0.1.0/lib/email.js` | 291 |

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
| `GET → FindUnique` | cross_community | 6 |
| `POST → FindUnique` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Test_scripts_2 | 33 calls |
| Scripts | 7 calls |
| Test_scripts | 3 calls |
| Components | 3 calls |
| Shipping | 2 calls |
| Categories | 2 calls |
| V2 | 1 calls |
| Legacy | 1 calls |

## How to Explore

1. `gitnexus_context({name: "syncOrderStatus"})` — see callers and callees
2. `gitnexus_query({query: "services"})` — find related execution flows
3. Read key files listed above for implementation details
