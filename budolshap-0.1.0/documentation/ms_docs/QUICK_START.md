# Quick Start Guide - BudolShap Backend

## 1. Prerequisites Check
- ✅ WAMP Server installed and running
- ✅ MySQL service running in WAMP
- ✅ Node.js and npm installed

## 2. Database Setup (5 minutes)

### Step 1: Create Database
Open phpMyAdmin (http://localhost/phpmyadmin) and create a database:
```sql
CREATE DATABASE budolshap;
```

### Step 2: Configure Environment
1. Create `.env` file in the root directory
2. Add the following:
```env
DATABASE_URL="mysql://root:@localhost:3306/budolshap"
NEXT_PUBLIC_CURRENCY_SYMBOL="$"
```
**Note:** If your MySQL has a password, use: `mysql://root:yourpassword@localhost:3306/budolshap`

## 3. Install Dependencies (2 minutes)
```bash
npm install
```

## 4. Setup Database Schema (1 minute)
```bash
npx prisma generate
npx prisma migrate dev --name init
```

## 5. Start Development Server
```bash
npm run dev
```

## 6. Verify Setup

### Test API Endpoint
Open your browser or use curl:
```
http://localhost:3000/api/products
```

You should see an empty array `[]` if the database is empty, or an error if there's a connection issue.

## Common Issues & Solutions

### Issue: "Can't reach database server"
**Solution:** 
- Check if WAMP MySQL service is running
- Verify database name in `.env` matches the created database
- Check MySQL port (default is 3306)

### Issue: "Prisma Client not generated"
**Solution:**
```bash
npx prisma generate
```

### Issue: "Migration failed"
**Solution:**
- Drop the database and recreate it
- Run migration again: `npx prisma migrate dev --name init`

### Issue: "Access denied for user"
**Solution:**
- Check MySQL username and password in `.env`
- Default WAMP MySQL user is `root` with no password
- If you set a password, include it in the connection string

## Next Steps

1. **Create a test user:**
   ```bash
   POST /api/users
   {
     "id": "test_user_1",
     "name": "Test User",
     "email": "test@example.com"
   }
   ```

2. **Create a test store:**
   ```bash
   POST /api/stores
   {
     "userId": "test_user_1",
     "name": "Test Store",
     "username": "teststore",
     "email": "store@example.com",
     "contact": "1234567890",
     "description": "A test store",
     "address": "123 Test St"
   }
   ```

3. **Approve the store (as admin):**
   ```bash
   PUT /api/stores/[storeId]/approve
   {
     "status": "approved",
     "isActive": true
   }
   ```

4. **Create a product:**
   ```bash
   POST /api/products
   {
     "name": "Test Product",
     "description": "A test product",
     "mrp": 100.00,
     "price": 80.00,
     "images": ["https://example.com/image.jpg"],
     "category": "Electronics",
     "storeId": "[storeId from step 2]"
   }
   ```

## Useful Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Start dev server
npm run dev
```

## Database Management

### View Database in Prisma Studio
```bash
npm run prisma:studio
```
This opens a web interface at http://localhost:5555 where you can view and edit your database.

### View Database in phpMyAdmin
- Open http://localhost/phpmyadmin
- Select `budolshap` database
- Browse tables

## API Testing

You can test the API using:
- **Browser:** For GET requests
- **Postman:** For all request types
- **curl:** Command line tool
- **Thunder Client:** VS Code extension

Example curl command:
```bash
curl http://localhost:3000/api/products
```

## Support

If you encounter issues:
1. Check the `BACKEND_SETUP.md` for detailed setup instructions
2. Check the `API_DOCUMENTATION.md` for API reference
3. Verify all environment variables are set correctly
4. Ensure WAMP services are running

