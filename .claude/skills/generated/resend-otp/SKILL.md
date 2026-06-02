---
name: resend-otp
description: "Skill for the Resend-otp area of budolEcosystem. 26 symbols across 20 files."
---

# Resend-otp

26 symbols | 20 files | Cohesion: 90%

## When to Use

- Working with code in `budolpay-0.1.0/`
- Understanding how getNowUTC, sendDualChannelNotification, createAuditLog work
- Modifying resend-otp-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `budolpay-0.1.0/apps/admin/app/api/auth/login/resend-otp/route.ts` | maskEmail, maskPhone, POST |
| `budolpay-0.1.0/apps/admin/app/api/employees/route.ts` | normalizePhone, POST |
| `budolpay-0.1.0/apps/admin/app/settings/security/page.tsx` | getCurrentUser, saveSecuritySettings |
| `budolpay-0.1.0/apps/admin/app/settings/notifications/page.tsx` | getCurrentUser, updateSetting |
| `budolpay-0.1.0/apps/admin/app/settings/location/page.tsx` | getCurrentUser, saveMapSettings |
| `budolpay-0.1.0/apps/admin/lib/utils.ts` | getNowUTC |
| `budolpay-0.1.0/apps/admin/lib/notifications.ts` | sendDualChannelNotification |
| `budolpay-0.1.0/apps/admin/lib/audit.ts` | createAuditLog |
| `budolpay-0.1.0/apps/admin/app/api/users/route.ts` | POST |
| `budolpay-0.1.0/apps/admin/app/api/security/route.ts` | POST |

## Entry Points

Start here when exploring this area:

- **`getNowUTC`** (Function) — `budolpay-0.1.0/apps/admin/lib/utils.ts:57`
- **`sendDualChannelNotification`** (Function) — `budolpay-0.1.0/apps/admin/lib/notifications.ts:9`
- **`createAuditLog`** (Function) — `budolpay-0.1.0/apps/admin/lib/audit.ts:15`
- **`POST`** (Function) — `budolpay-0.1.0/apps/admin/app/api/users/route.ts:34`
- **`POST`** (Function) — `budolpay-0.1.0/apps/admin/app/api/security/route.ts:70`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `getNowUTC` | Function | `budolpay-0.1.0/apps/admin/lib/utils.ts` | 57 |
| `sendDualChannelNotification` | Function | `budolpay-0.1.0/apps/admin/lib/notifications.ts` | 9 |
| `createAuditLog` | Function | `budolpay-0.1.0/apps/admin/lib/audit.ts` | 15 |
| `POST` | Function | `budolpay-0.1.0/apps/admin/app/api/users/route.ts` | 34 |
| `POST` | Function | `budolpay-0.1.0/apps/admin/app/api/security/route.ts` | 70 |
| `POST` | Function | `budolpay-0.1.0/apps/admin/app/api/employees/route.ts` | 40 |
| `POST` | Function | `budolpay-0.1.0/apps/admin/app/api/auth/verify-otp/route.ts` | 11 |
| `POST` | Function | `budolpay-0.1.0/apps/admin/app/api/auth/resend-otp/route.ts` | 12 |
| `POST` | Function | `budolpay-0.1.0/apps/admin/app/api/auth/logout/route.ts` | 13 |
| `GET` | Function | `budolpay-0.1.0/apps/admin/app/api/auth/callback/route.ts` | 5 |
| `PATCH` | Function | `budolpay-0.1.0/apps/admin/app/api/disputes/[id]/resolve/route.ts` | 7 |
| `POST` | Function | `budolpay-0.1.0/apps/admin/app/api/auth/login/verify-otp/route.ts` | 6 |
| `POST` | Function | `budolpay-0.1.0/apps/admin/app/api/auth/login/resend-otp/route.ts` | 20 |
| `POST` | Function | `budolpay-0.1.0/apps/admin/app/api/auth/login/mobile/verify-pin/route.ts` | 14 |
| `POST` | Function | `budolpay-0.1.0/apps/admin/app/api/auth/login/mobile/setup-pin/route.ts` | 15 |
| `POST` | Function | `budolpay-0.1.0/apps/admin/app/api/auth/login/mobile/reset-pin/route.ts` | 12 |
| `updateSetting` | Function | `budolpay-0.1.0/apps/admin/app/settings-orig/page.tsx` | 62 |
| `saveSecuritySettings` | Function | `budolpay-0.1.0/apps/admin/app/settings/security/page.tsx` | 57 |
| `updateSetting` | Function | `budolpay-0.1.0/apps/admin/app/settings/notifications/page.tsx` | 62 |
| `saveMapSettings` | Function | `budolpay-0.1.0/apps/admin/app/settings/location/page.tsx` | 63 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `DisputesPage → GetNowUTC` | cross_community | 3 |

## How to Explore

1. `gitnexus_context({name: "getNowUTC"})` — see callers and callees
2. `gitnexus_query({query: "resend-otp"})` — find related execution flows
3. Read key files listed above for implementation details
