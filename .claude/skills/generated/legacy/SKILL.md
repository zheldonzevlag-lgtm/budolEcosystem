---
name: legacy
description: "Skill for the Legacy area of budolEcosystem. 20 symbols across 13 files."
---

# Legacy

20 symbols | 13 files | Cohesion: 93%

## When to Use

- Working with code in `scripts/`
- Understanding how getShippingProvider work
- Modifying legacy-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `scripts/test_scripts/budolShap/legacy/test-lalamove-endpoints.js` | testWebhookHealth, testEndpointStructure, runTests |
| `scripts/test_scripts/budolShap/legacy/test-webhook-manual.js` | generateSignature, sendTestWebhook |
| `scripts/test_scripts/budolShap/legacy/test-lalamove-minimal.js` | generateSignature, testMinimalQuote |
| `scripts/test_scripts/budolShap/legacy/test-lalamove-health.js` | generateSignature, testApiHealth |
| `scripts/test_scripts/budolShap/legacy/test-lalamove-direct.js` | generateSignature, testLalamoveQuote |
| `scripts/test_scripts/budolShap/legacy/test-all-markets.js` | testMarket, main |
| `budolshap-0.1.0/services/shippingFactory.js` | getShippingProvider |
| `budolshap-0.1.0/scripts/test_scripts_2/fetch-driver-info.js` | main |
| `budolshap-0.1.0/scripts/test_scripts/restore-sharelink.js` | restoreShareLink |
| `scripts/test_scripts/budolShap/v2/test-lalamove-driver-api.js` | testLalamoveAPI |

## Entry Points

Start here when exploring this area:

- **`getShippingProvider`** (Function) — `budolshap-0.1.0/services/shippingFactory.js:47`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getShippingProvider` | Function | `budolshap-0.1.0/services/shippingFactory.js` | 47 |
| `main` | Function | `budolshap-0.1.0/scripts/test_scripts_2/fetch-driver-info.js` | 34 |
| `restoreShareLink` | Function | `budolshap-0.1.0/scripts/test_scripts/restore-sharelink.js` | 3 |
| `testLalamoveAPI` | Function | `scripts/test_scripts/budolShap/v2/test-lalamove-driver-api.js` | 3 |
| `testQuoteWithStops` | Function | `scripts/test_scripts/budolShap/legacy/test-quote-stops.js` | 3 |
| `testOrderCreation` | Function | `scripts/test_scripts/budolShap/legacy/test-order-simple.js` | 4 |
| `testCompleteOrderFlow` | Function | `scripts/test_scripts/budolShap/legacy/test-lalamove-order-creation.js` | 24 |
| `testWebhookHealth` | Function | `scripts/test_scripts/budolShap/legacy/test-lalamove-endpoints.js` | 29 |
| `testEndpointStructure` | Function | `scripts/test_scripts/budolShap/legacy/test-lalamove-endpoints.js` | 80 |
| `runTests` | Function | `scripts/test_scripts/budolShap/legacy/test-lalamove-endpoints.js` | 106 |
| `generateSignature` | Function | `scripts/test_scripts/budolShap/legacy/test-webhook-manual.js` | 68 |
| `sendTestWebhook` | Function | `scripts/test_scripts/budolShap/legacy/test-webhook-manual.js` | 78 |
| `generateSignature` | Function | `scripts/test_scripts/budolShap/legacy/test-lalamove-minimal.js` | 17 |
| `testMinimalQuote` | Function | `scripts/test_scripts/budolShap/legacy/test-lalamove-minimal.js` | 26 |
| `generateSignature` | Function | `scripts/test_scripts/budolShap/legacy/test-lalamove-health.js` | 17 |
| `testApiHealth` | Function | `scripts/test_scripts/budolShap/legacy/test-lalamove-health.js` | 26 |
| `generateSignature` | Function | `scripts/test_scripts/budolShap/legacy/test-lalamove-direct.js` | 20 |
| `testLalamoveQuote` | Function | `scripts/test_scripts/budolShap/legacy/test-lalamove-direct.js` | 29 |
| `testMarket` | Function | `scripts/test_scripts/budolShap/legacy/test-all-markets.js` | 7 |
| `main` | Function | `scripts/test_scripts/budolShap/legacy/test-all-markets.js` | 36 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Services | 1 calls |

## How to Explore

1. `gitnexus_context({name: "getShippingProvider"})` — see callers and callees
2. `gitnexus_query({query: "legacy"})` — find related execution flows
3. Read key files listed above for implementation details
