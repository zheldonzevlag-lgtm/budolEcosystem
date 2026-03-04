# budolPay Ecosystem Documentation

This document provides a comprehensive guide to the budolPay monorepo, covering setup, database management, and troubleshooting.

## **Project Overview**

budolPay is a fintech monorepo designed for high-performance transactions, security, and scalability. It uses a workspace-based architecture to manage applications, microservices, and shared packages.

### **Architecture**
- **`/apps`**: Front-facing applications (e.g., [admin](file:///d:/IT%20Projects/budolEcosystem/budolpay-0.1.0/apps/admin)).
- **`/services`**: Microservices for specific domains (auth, wallet, transactions).
- **`/packages`**: Shared libraries, including the [database](file:///d:/IT%20Projects/budolEcosystem/budolpay-0.1.0/packages/database) schema and Prisma client.

---

## **Quick Start**

### **Prerequisites**
- Node.js (v18+)
- PostgreSQL (Local or Remote)
- npm or yarn

### **Installation**
1. Clone the repository.
2. Run `npm install` at the root directory to link all workspace packages.
3. Generate the Prisma client:
   ```bash
   npm run db:generate
   ```

---

## **Database Management**

The database is managed via Prisma in the `@budolpay/database` package.

### **Environment Setup**
Ensure your [database .env](file:///d:/IT%20Projects/budolEcosystem/budolpay-0.1.0/packages/database/.env) contains the correct `DATABASE_URL`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/budolpay_db?schema=public"
```

### **Common Commands**
Run these inside `packages/database`:
- **Sync Schema**: `npx prisma db push` (Use for development to sync models without migrations).
- **Run Migrations**: `npx prisma migrate deploy` (Use for production).
- **Seed Data**: `npx prisma db seed` (Populates admin user and system settings).
- **Open Studio**: `npx prisma studio` (Visual database explorer).

---

## **Development Guide**

### **Adding New Packages**
When adding a new workspace package, ensure it is listed in the root [package.json](file:///d:/IT%20Projects/budolEcosystem/budolpay-0.1.0/package.json) `workspaces` array.

### **Next.js Integration**
If an app needs to use a workspace package (like `@budolpay/database`), you must enable transpilation in the app's `next.config.mjs`:
```javascript
const nextConfig = {
  transpilePackages: ['@budolpay/database'],
};
```

---

## **Troubleshooting**

### **"Module Not Found: @budolpay/database"**
This usually means the workspace isn't linked or Next.js isn't transpiling the package.
1. Run `npm install` at the root.
2. Verify `transpilePackages` in `next.config.mjs`.

### **"Table public.Transaction does not exist"**
Your local database is out of sync with the Prisma schema.
1. Run `npx prisma db push` in `packages/database`.
2. Run `npx prisma db seed` to restore initial data.

### **TypeScript Errors in JSX**
Ensure HTML attributes like `colSpan` are passed as numbers `{6}` rather than strings `"6"` to satisfy React's strict typing.

---

## **Seeded Accounts**
- **Admin Email**: `admin@budolpay.com`
- **Admin Password**: `admin123`
"# Build trigger"  
"# Build trigger - updated appRoot"  
"# Build trigger - fix buildspec"  
