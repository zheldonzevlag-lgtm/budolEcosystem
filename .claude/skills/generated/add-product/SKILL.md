---
name: add-product
description: "Skill for the Add-product area of budolEcosystem. 23 symbols across 3 files."
---

# Add-product

23 symbols | 3 files | Cohesion: 98%

## When to Use

- Working with code in `budolshap-0.1.0/`
- Understanding how AddProductWizard, handleStepClick, handleNext work
- Modifying add-product-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx` | normalizeMedia, AddProductWizard, handleStepClick, handleNext, getFieldsForStep (+6) |
| `budolshap-0.1.0/components/store/add-product/CategorySelector.jsx` | CategorySelector, fetchCategories, getDisplayText, handleLevel1Select, handleLevel2Select (+3) |
| `budolshap-0.1.0/components/store/add-product/DraftListModal.jsx` | DraftListModal, handleRestore, handleDelete, formatDate |

## Entry Points

Start here when exploring this area:

- **`AddProductWizard`** (Function) — `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx:52`
- **`handleStepClick`** (Function) — `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx:118`
- **`handleNext`** (Function) — `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx:144`
- **`getFieldsForStep`** (Function) — `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx:169`
- **`handleSaveDraft`** (Function) — `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx:215`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `AddProductWizard` | Function | `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx` | 52 |
| `handleStepClick` | Function | `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx` | 118 |
| `handleNext` | Function | `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx` | 144 |
| `getFieldsForStep` | Function | `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx` | 169 |
| `handleSaveDraft` | Function | `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx` | 215 |
| `loadDraftsList` | Function | `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx` | 243 |
| `handleDeleteDraft` | Function | `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx` | 284 |
| `unsubscribe` | Function | `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx` | 324 |
| `checkDraft` | Function | `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx` | 359 |
| `restoreDraft` | Function | `budolshap-0.1.0/components/store/add-product/AddProductWizard.jsx` | 368 |
| `CategorySelector` | Function | `budolshap-0.1.0/components/store/add-product/CategorySelector.jsx` | 6 |
| `fetchCategories` | Function | `budolshap-0.1.0/components/store/add-product/CategorySelector.jsx` | 31 |
| `getDisplayText` | Function | `budolshap-0.1.0/components/store/add-product/CategorySelector.jsx` | 58 |
| `handleLevel1Select` | Function | `budolshap-0.1.0/components/store/add-product/CategorySelector.jsx` | 73 |
| `handleLevel2Select` | Function | `budolshap-0.1.0/components/store/add-product/CategorySelector.jsx` | 86 |
| `handleLevel3Select` | Function | `budolshap-0.1.0/components/store/add-product/CategorySelector.jsx` | 98 |
| `handleSearchSelect` | Function | `budolshap-0.1.0/components/store/add-product/CategorySelector.jsx` | 104 |
| `clearSelection` | Function | `budolshap-0.1.0/components/store/add-product/CategorySelector.jsx` | 129 |
| `DraftListModal` | Function | `budolshap-0.1.0/components/store/add-product/DraftListModal.jsx` | 5 |
| `handleRestore` | Function | `budolshap-0.1.0/components/store/add-product/DraftListModal.jsx` | 10 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `AddProductWizard → LoadDraftsList` | intra_community | 3 |
| `AddProductWizard → NormalizeMedia` | intra_community | 3 |
| `CategorySelector → SetLoading` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Components | 1 calls |

## How to Explore

1. `gitnexus_context({name: "AddProductWizard"})` — see callers and callees
2. `gitnexus_query({query: "add-product"})` — find related execution flows
3. Read key files listed above for implementation details
