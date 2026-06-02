---
name: address
description: "Skill for the Address area of budolEcosystem. 24 symbols across 5 files."
---

# Address

24 symbols | 5 files | Cohesion: 88%

## When to Use

- Working with code in `budolshap-0.1.0/`
- Understanding how useMapSettings work
- Modifying address-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `budolshap-0.1.0/components/address/AddressFormManager.jsx` | AddressFormManager, formatPhoneNumber, formatInitialPhone, isPhoneNumberLike, splitName (+8) |
| `budolshap-0.1.0/components/address/MapPicker.jsx` | MapPicker, getTileLayer, reverseGeocode, handleMoveEnd, handleMapClick (+1) |
| `budolshap-0.1.0/components/address/GoogleMapView.jsx` | zoomIn, zoomOut |
| `budolshap-0.1.0/components/address/AddressAutocomplete.jsx` | AddressAutocomplete, handleSelect |
| `budolshap-0.1.0/hooks/useMapSettings.js` | useMapSettings |

## Entry Points

Start here when exploring this area:

- **`useMapSettings`** (Function) — `budolshap-0.1.0/hooks/useMapSettings.js:4`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `useMapSettings` | Function | `budolshap-0.1.0/hooks/useMapSettings.js` | 4 |
| `AddressFormManager` | Function | `budolshap-0.1.0/components/address/AddressFormManager.jsx` | 30 |
| `formatPhoneNumber` | Function | `budolshap-0.1.0/components/address/AddressFormManager.jsx` | 41 |
| `formatInitialPhone` | Function | `budolshap-0.1.0/components/address/AddressFormManager.jsx` | 49 |
| `isPhoneNumberLike` | Function | `budolshap-0.1.0/components/address/AddressFormManager.jsx` | 70 |
| `splitName` | Function | `budolshap-0.1.0/components/address/AddressFormManager.jsx` | 81 |
| `checkMobile` | Function | `budolshap-0.1.0/components/address/AddressFormManager.jsx` | 140 |
| `toggleSection` | Function | `budolshap-0.1.0/components/address/AddressFormManager.jsx` | 154 |
| `handlePhonePartChange` | Function | `budolshap-0.1.0/components/address/AddressFormManager.jsx` | 307 |
| `handleChange` | Function | `budolshap-0.1.0/components/address/AddressFormManager.jsx` | 332 |
| `MapPicker` | Function | `budolshap-0.1.0/components/address/MapPicker.jsx` | 74 |
| `getTileLayer` | Function | `budolshap-0.1.0/components/address/MapPicker.jsx` | 246 |
| `zoomIn` | Function | `budolshap-0.1.0/components/address/GoogleMapView.jsx` | 33 |
| `zoomOut` | Function | `budolshap-0.1.0/components/address/GoogleMapView.jsx` | 38 |
| `AddressAutocomplete` | Function | `budolshap-0.1.0/components/address/AddressAutocomplete.jsx` | 6 |
| `handleSelect` | Function | `budolshap-0.1.0/components/address/AddressAutocomplete.jsx` | 82 |
| `reverseGeocode` | Function | `budolshap-0.1.0/components/address/MapPicker.jsx` | 103 |
| `handleMoveEnd` | Function | `budolshap-0.1.0/components/address/MapPicker.jsx` | 206 |
| `handleMapClick` | Function | `budolshap-0.1.0/components/address/MapPicker.jsx` | 217 |
| `getCurrentLocation` | Function | `budolshap-0.1.0/components/address/MapPicker.jsx` | 228 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Components | 2 calls |

## How to Explore

1. `gitnexus_context({name: "useMapSettings"})` — see callers and callees
2. `gitnexus_query({query: "address"})` — find related execution flows
3. Read key files listed above for implementation details
