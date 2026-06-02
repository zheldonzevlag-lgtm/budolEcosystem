---
name: test-scripts-2
description: "Skill for the Test_scripts_2 area of budolEcosystem. 460 symbols across 382 files."
---

# Test_scripts_2

460 symbols | 382 files | Cohesion: 97%

## When to Use

- Working with code in `budolshap-0.1.0/`
- Understanding how verifyTokenEdge, createGCashSource, getEscrowSummary work
- Modifying test_scripts_2-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `budolshap-0.1.0/lib/services/returnsService.js` | resolveDispute, respondToReturn, receiveReturn, processOverdueReturns, buyerRespondToProposal (+1) |
| `budolshap-0.1.0/lib/services/shippingService.js` | cancelShipping, updateShippingStatus, generateShippingDocuments, getOrdersNeedingArrangement, getOrdersNeedingBooking |
| `budolshap-0.1.0/app/api/products/[productId]/route.js` | getImageUrl, GET, PUT, DELETE |
| `budolshap-0.1.0/scripts/test_scripts_2/simulate-v3-webhook.js` | generateSignature, sendWebhook, req, main |
| `budolshap-0.1.0/scripts/test_scripts_2/simulate-driver-webhook.js` | generateSignature, sendWebhook, req, main |
| `budolshap-0.1.0/scripts/test_scripts_2/simulate-lalamove-webhook.js` | createDummyOrder, sendWebhook, verifyOrderStatus, main |
| `budolshap-0.1.0/lib/escrow.js` | getEscrowSummary, refundFromLocked, releaseFromLocked |
| `scripts/test_scripts/budolShap/v2/test-escrow-service.js` | creditPendingBalance, releaseFunds, testEscrowService |
| `budolshap-0.1.0/app/api/store/payouts/route.js` | getAuthenticatedStore, GET, POST |
| `budolshap-0.1.0/app/api/store/coupons/route.js` | getAuthenticatedStore, GET, POST |

## Entry Points

Start here when exploring this area:

- **`verifyTokenEdge`** (Function) — `budolshap-0.1.0/lib/token-edge.js:6`
- **`createGCashSource`** (Function) — `budolshap-0.1.0/lib/paymongo.js:13`
- **`getEscrowSummary`** (Function) — `budolshap-0.1.0/lib/escrow.js:253`
- **`refundFromLocked`** (Function) — `budolshap-0.1.0/lib/escrow.js:352`
- **`releaseFromLocked`** (Function) — `budolshap-0.1.0/lib/escrow.js:402`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `verifyTokenEdge` | Function | `budolshap-0.1.0/lib/token-edge.js` | 6 |
| `createGCashSource` | Function | `budolshap-0.1.0/lib/paymongo.js` | 13 |
| `getEscrowSummary` | Function | `budolshap-0.1.0/lib/escrow.js` | 253 |
| `refundFromLocked` | Function | `budolshap-0.1.0/lib/escrow.js` | 352 |
| `releaseFromLocked` | Function | `budolshap-0.1.0/lib/escrow.js` | 402 |
| `proxy` | Function | `budolshap-0.1.0/scripts/test_scripts/proxy.js` | 15 |
| `cancelShipping` | Function | `budolshap-0.1.0/lib/services/shippingService.js` | 741 |
| `updateShippingStatus` | Function | `budolshap-0.1.0/lib/services/shippingService.js` | 827 |
| `generateShippingDocuments` | Function | `budolshap-0.1.0/lib/services/shippingService.js` | 1011 |
| `resolveDispute` | Function | `budolshap-0.1.0/lib/services/returnsService.js` | 244 |
| `respondToReturn` | Function | `budolshap-0.1.0/lib/services/returnsService.js` | 344 |
| `receiveReturn` | Function | `budolshap-0.1.0/lib/services/returnsService.js` | 461 |
| `processOverdueReturns` | Function | `budolshap-0.1.0/lib/services/returnsService.js` | 556 |
| `buyerRespondToProposal` | Function | `budolshap-0.1.0/lib/services/returnsService.js` | 628 |
| `updateStorePerformance` | Function | `budolshap-0.1.0/lib/services/performanceService.js` | 12 |
| `updateBuyerPerformance` | Function | `budolshap-0.1.0/lib/services/performanceService.js` | 70 |
| `getUserById` | Function | `budolshap-0.1.0/lib/services/authService.js` | 132 |
| `getUserByEmail` | Function | `budolshap-0.1.0/lib/services/authService.js` | 161 |
| `GET` | Function | `budolshap-0.1.0/app/auth/callback/route.js` | 4 |
| `GET` | Function | `budolshap-0.1.0/app/api/users/route.js` | 9 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `PUT → FindUnique` | cross_community | 6 |
| `POST → FindUnique` | cross_community | 6 |
| `GET → FindUnique` | cross_community | 6 |
| `DELETE → FindUnique` | cross_community | 6 |
| `GET → FindUnique` | cross_community | 6 |
| `POST → FindUnique` | cross_community | 6 |
| `GET → FindUnique` | cross_community | 6 |
| `GET → FindUnique` | cross_community | 6 |
| `POST → FindUnique` | cross_community | 6 |
| `POST → FindUnique` | cross_community | 6 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Test_scripts | 6 calls |
| Shipping | 5 calls |
| Kyc | 3 calls |
| Services | 1 calls |
| Budolpay | 1 calls |
| Settings | 1 calls |
| Chats | 1 calls |
| Categories | 1 calls |

## How to Explore

1. `gitnexus_context({name: "verifyTokenEdge"})` — see callers and callees
2. `gitnexus_query({query: "test_scripts_2"})` — find related execution flows
3. Read key files listed above for implementation details
