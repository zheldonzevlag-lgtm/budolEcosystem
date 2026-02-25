# Admin-Managed Product Categories System

## Overview
A fully admin-managed product category system where administrators can create, edit, delete, and organize categories through the admin panel. Categories are stored in the database and served via API. Supports **3 levels of hierarchy** (Level 1 → Level 2 → Level 3), matching Shopee's category structure.

---

## Menu Structure

### Admin Sidebar
```
Products & Order Management
├── Products
├── Product Categories    ← NEW (Submenu)
├── Returns
└── Orders
```

---

## Architecture

### Database Schema
```prisma
model Category {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  parentId    String?
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  level       Int       // 1 = Primary, 2 = Secondary, 3 = Tertiary
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  products    Product[]

  @@index([parentId])
  @@index([level])
  @@index([isActive])
}
```

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/categories` | List all categories (tree structure) |
| GET | `/api/admin/categories/[id]` | Get single category |
| POST | `/api/admin/categories` | Create category |
| PUT | `/api/admin/categories/[id]` | Update category |
| DELETE | `/api/admin/categories/[id]` | Delete category |
| GET | `/api/categories` | Public endpoint for category tree |

---

## Shopee-Style 3-Level Structure

| Level | Example | Description |
|-------|---------|-------------|
| **Level 1** | Electronics | Primary category |
| **Level 2** | Mobile Devices & Gadgets | Sub-category |
| **Level 3** | Smartphones | Specific category |

### Visual Representation
```
Electronics (L1)
├── Mobile Devices & Gadgets (L2)
│   ├── Smartphones (L3)
│   ├── Tablets (L3)
│   ├── Smartwatches (L3)
│   └── Mobile Accessories (L3)
├── Computers & Laptops (L2)
│   ├── Laptops (L3)
│   ├── Desktops (L3)
│   └── Computer Components (L3)
└── Audio (L2)
    ├── Headphones & Headsets (L3)
    ├── Speakers (L3)
    └── Home Audio (L3)
```

---

## Admin Panel UI Design

### Category Management Page
```
┌─────────────────────────────────────────────────────────────────┐
│  Product Categories                                           │
├─────────────────────────────────────────────────────────────────┤
│  [+ Add Category]                         [Search: ________]  │
├─────────────────────────────────────────────────────────────────┤
│  ▼ Electronics (Level 1)                                      │
│    ▼ Mobile Devices & Gadgets (Level 2)                       │
│      • Smartphones              [Edit] [Delete] [⬆⬇]         │
│      • Tablets                 [Edit] [Delete] [⬆⬇]         │
│      • Smartwatches            [Edit] [Delete] [⬆⬇]         │
│      • Mobile Accessories      [Edit] [Delete] [⬆⬇]         │
│    ▼ Computers & Laptops (Level 2)                            │
│      • Laptops                [Edit] [Delete] [⬆⬇]         │
│      • Desktops                [Edit] [Delete] [⬆⬇]         │
│  ▼ Fashion (Level 1)                                          │
│    ▼ Women's Fashion (Level 2)                                │
│      • Dresses                [Edit] [Delete] [⬆⬇]         │
│      • Tops & Blouses         [Edit] [Delete] [⬆⬇]         │
│  ...                                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Add/Edit Category Modal
```
┌────────────────────────────────────┐
│  Add Category                 [X]  │
├────────────────────────────────────┤
│  Category Name:                    │
│  [______________________________]  │
│                                     │
│  Parent Category:                   │
│  [Select Parent Category     ▼]     │
│  (Leave empty for Level 1)          │
│                                     │
│  Level: Auto-detected (1, 2, or 3) │
│                                     │
│  Sort Order:                        │
│  [____] (Optional, default: 0)     │
│                                     │
│  Status:                            │
│  [x] Active                        │
│                                     │
│  [Cancel]        [Save Category]   │
└────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Database & API
1. **Prisma Schema**
   - Add `Category` model to `schema.prisma`
   - Add relation to `Product` model
   - Update product schema to store categoryId

2. **API Routes**
   - `app/api/admin/categories/route.js` - CRUD operations
   - `app/api/admin/categories/[id]/route.js` - Single category
   - `app/api/categories/route.js` - Public category tree

### Phase 2: Admin UI
1. **Admin Sidebar**
   - Add "Product Categories" **under** "Products & Order Management"

2. **Category List Page**
   - `app/admin/products/categories/page.jsx` (or `app/admin/categories/page.jsx`)
   - Tree view with expand/collapse
   - Drag-to-reorder (optional)
   - Quick actions: Edit, Delete, Move Up/Down

3. **Category Form**
   - Modal for Add/Edit
   - Parent category selector
   - Auto-detect level based on parent

### Phase 3: Frontend Integration
1. **CategorySelector Component**
   - Load categories from API
   - Three-level cascading dropdown
   - Cache results for performance

2. **Update AddProductWizard**
   - Replace hardcoded categories with API-driven selector

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Add Category model |
| `app/api/admin/categories/route.js` | Category CRUD API |
| `app/api/admin/categories/[id]/route.js` | Single category API |
| `app/api/categories/route.js` | Public category tree |
| `app/admin/categories/page.jsx` | Admin category list |
| `components/admin/CategoryForm.jsx` | Add/Edit form modal |

### Modified Files
| File | Changes |
|------|---------|
| `components/admin/AdminSidebar.jsx` | Add submenu "Product Categories" |
| `lib/validations/categorySchema.js` | Zod validation |
| `components/ui/CategorySelector.jsx` | Load from API |
| `components/store/add-product/AddProductWizard.jsx` | Use selector |

---

## Initial Category Data (Seed)

The system will be pre-seeded with Shopee-style categories:

### Level 1 Categories (10)
1. Electronics
2. Fashion
3. Home & Living
4. Beauty & Personal Care
5. Sports & Outdoors
6. Toys, Games & Collectibles
7. Food & Beverages
8. Pet Supplies
9. Books & Stationery
10. Health & Wellness

Each with Level 2 and Level 3 subcategories (similar to Shopee).

---

## Benefits

| Benefit | Description |
|---------|-------------|
| **Admin Control** | Full CRUD via admin panel |
| **Shopee-Compatible** | 3-level structure matching Shopee |
| **Scalable** | Add unlimited categories |
| **Maintainable** | No code changes needed for updates |
| **Searchable** | Products filterable by any level |

---

## Next Steps

1. **Approve this plan** → Move to Code mode to implement
2. **Database first** → Create Prisma migration
3. **Then API** → Build CRUD endpoints
4. **Then Admin UI** → Category management page
5. **Finally Integration** → Update product forms
