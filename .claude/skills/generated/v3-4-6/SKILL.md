---
name: v3-4-6
description: "Skill for the V3.4.6 area of budolEcosystem. 17 symbols across 2 files."
---

# V3.4.6

17 symbols | 2 files | Cohesion: 92%

## When to Use

- Working with code in `scripts/`
- Understanding how MockDatabase, createUser, createStore work
- Modifying v3.4.6-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-mock.mjs` | MockDatabase, createUser, createStore, createProduct, createAddress (+8) |
| `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-sqlite.mjs` | MockPrismaClient, create, update, main |

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `MockDatabase` | Class | `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-mock.mjs` | 6 |
| `MockPrismaClient` | Class | `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-sqlite.mjs` | 7 |
| `main` | Function | `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-mock.mjs` | 85 |
| `create` | Function | `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-sqlite.mjs` | 23 |
| `update` | Function | `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-sqlite.mjs` | 53 |
| `main` | Function | `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-sqlite.mjs` | 107 |
| `createUser` | Method | `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-mock.mjs` | 16 |
| `createStore` | Method | `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-mock.mjs` | 22 |
| `createProduct` | Method | `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-mock.mjs` | 28 |
| `createAddress` | Method | `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-mock.mjs` | 34 |
| `createCheckout` | Method | `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-mock.mjs` | 40 |
| `createOrder` | Method | `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-mock.mjs` | 46 |
| `updateCheckout` | Method | `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-mock.mjs` | 52 |
| `updateOrder` | Method | `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-mock.mjs` | 60 |
| `updateProductStock` | Method | `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-mock.mjs` | 68 |
| `findOrdersByCheckout` | Method | `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-mock.mjs` | 76 |
| `findProductById` | Method | `scripts/test_scripts/budolShap/v3.4.6/verify-multi-store-checkout-mock.mjs` | 80 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Test_scripts_2 | 2 calls |
| Test_scripts | 1 calls |

## How to Explore

1. `gitnexus_context({name: "MockDatabase"})` — see callers and callees
2. `gitnexus_query({query: "v3.4.6"})` — find related execution flows
3. Read key files listed above for implementation details
