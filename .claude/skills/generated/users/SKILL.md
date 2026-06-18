---
name: users
description: "Skill for the Users area of budolEcosystem. 28 symbols across 8 files."
---

# Users

28 symbols | 8 files | Cohesion: 78%

## When to Use

- Working with code in `budolshap-0.1.0/`
- Understanding how normalizeAccountType, updateUserProfile, POST work
- Modifying users-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `budolpay-0.1.0/apps/admin/app/users/page.tsx` | UsersPage, handleRotate, timeout, renderOcrData, fetchUsers (+4) |
| `budolshap-0.1.0/app/admin/users/page.jsx` | AdminUsers, fetchUsers, handleDeleteUser, openEditModal, handleInputChange (+3) |
| `budolshap-0.1.0/app/api/admin/users/route.js` | GET, usersWithAdminFlag, POST |
| `budolshap-0.1.0/lib/accountTypes.js` | normalizeAccountType, getAccountTypeMeta |
| `budolshap-0.1.0/app/api/users/route.js` | POST, PUT |
| `budolshap-0.1.0/app/api/admin/users/utils.js` | getAdminEmailSet, attachAdminFlag |
| `budolshap-0.1.0/lib/api/budolIdClient.js` | updateUserProfile |
| `budolshap-0.1.0/app/api/admin/users/[userId]/route.js` | PUT |

## Entry Points

Start here when exploring this area:

- **`normalizeAccountType`** (Function) — `budolshap-0.1.0/lib/accountTypes.js:28`
- **`updateUserProfile`** (Function) — `budolshap-0.1.0/lib/api/budolIdClient.js:146`
- **`POST`** (Function) — `budolshap-0.1.0/app/api/users/route.js:56`
- **`PUT`** (Function) — `budolshap-0.1.0/app/api/users/route.js:92`
- **`getAdminEmailSet`** (Function) — `budolshap-0.1.0/app/api/admin/users/utils.js:24`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `normalizeAccountType` | Function | `budolshap-0.1.0/lib/accountTypes.js` | 28 |
| `updateUserProfile` | Function | `budolshap-0.1.0/lib/api/budolIdClient.js` | 146 |
| `POST` | Function | `budolshap-0.1.0/app/api/users/route.js` | 56 |
| `PUT` | Function | `budolshap-0.1.0/app/api/users/route.js` | 92 |
| `getAdminEmailSet` | Function | `budolshap-0.1.0/app/api/admin/users/utils.js` | 24 |
| `attachAdminFlag` | Function | `budolshap-0.1.0/app/api/admin/users/utils.js` | 28 |
| `GET` | Function | `budolshap-0.1.0/app/api/admin/users/route.js` | 10 |
| `usersWithAdminFlag` | Function | `budolshap-0.1.0/app/api/admin/users/route.js` | 45 |
| `POST` | Function | `budolshap-0.1.0/app/api/admin/users/route.js` | 58 |
| `PUT` | Function | `budolshap-0.1.0/app/api/admin/users/[userId]/route.js` | 12 |
| `UsersPage` | Function | `budolpay-0.1.0/apps/admin/app/users/page.tsx` | 28 |
| `handleRotate` | Function | `budolpay-0.1.0/apps/admin/app/users/page.tsx` | 62 |
| `timeout` | Function | `budolpay-0.1.0/apps/admin/app/users/page.tsx` | 80 |
| `renderOcrData` | Function | `budolpay-0.1.0/apps/admin/app/users/page.tsx` | 117 |
| `fetchUsers` | Function | `budolpay-0.1.0/apps/admin/app/users/page.tsx` | 150 |
| `updateKycStatus` | Function | `budolpay-0.1.0/apps/admin/app/users/page.tsx` | 172 |
| `getStatusColor` | Function | `budolpay-0.1.0/apps/admin/app/users/page.tsx` | 194 |
| `getTierColor` | Function | `budolpay-0.1.0/apps/admin/app/users/page.tsx` | 203 |
| `getDocUrl` | Function | `budolpay-0.1.0/apps/admin/app/users/page.tsx` | 212 |
| `getAccountTypeMeta` | Function | `budolshap-0.1.0/lib/accountTypes.js` | 36 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `PUT → FindUnique` | cross_community | 6 |
| `POST → FindUnique` | cross_community | 6 |
| `GET → FindUnique` | cross_community | 6 |
| `PUT → VerifyToken` | cross_community | 5 |
| `PUT → GetPusher` | cross_community | 5 |
| `POST → VerifyToken` | cross_community | 5 |
| `POST → GetPusher` | cross_community | 5 |
| `GET → VerifyToken` | cross_community | 5 |
| `GET → GetPusher` | cross_community | 5 |
| `AdminUsers → NormalizeAccountType` | cross_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Test_scripts_2 | 4 calls |
| Services | 3 calls |
| Categories | 3 calls |
| Components | 2 calls |
| Check | 2 calls |
| Returns | 1 calls |
| Transactions | 1 calls |

## How to Explore

1. `gitnexus_context({name: "normalizeAccountType"})` — see callers and callees
2. `gitnexus_query({query: "users"})` — find related execution flows
3. Read key files listed above for implementation details
