# Environment Setup

Since the `.env` file is protected, please create it manually:

## Steps:

1. **Create a file named `.env` in the root directory** (same level as `package.json`)

2. **Add the following content:**

```env
DATABASE_URL="mysql://root:@localhost:3306/budolshap"
NEXT_PUBLIC_CURRENCY_SYMBOL="$"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Admin Configuration (comma-separated emails)
ADMIN_EMAILS="admin@example.com,admin2@example.com"
# Or use NEXT_PUBLIC_ADMIN_EMAILS for client-side access (optional)
NEXT_PUBLIC_ADMIN_EMAILS="admin@example.com,admin2@example.com"

# Email Configuration (for email verification and password reset)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

3. **If your MySQL has a password**, update the DATABASE_URL:
```env
DATABASE_URL="mysql://root:yourpassword@localhost:3306/budolshap"
```

4. **If your MySQL uses a different port**, update accordingly:
```env
DATABASE_URL="mysql://root:@localhost:3307/budolshap"
```

## After creating .env file:

1. **Create the database** in phpMyAdmin (http://localhost/phpmyadmin):
   - Click "New" in the left sidebar
   - Database name: `budolshap`
   - Collation: `utf8mb4_unicode_ci` (or leave default)
   - Click "Create"

2. **Run the migration:**
   ```bash
   npx prisma migrate dev --name init
   ```

This will create all the necessary tables in your database.

## Admin Access Setup

To grant admin access to specific users:

1. **Register the user** as a regular user first (via `/login` → Sign Up)

2. **Add their email to ADMIN_EMAILS** in `.env`:
   ```env
   ADMIN_EMAILS="admin@example.com,admin2@example.com"
   ```
   - Multiple admin emails can be separated by commas
   - Admin emails must match the email used during registration
   - Make sure there are no extra spaces around commas

3. **Restart your development server** after updating `.env`:
   ```bash
   # Stop the server (Ctrl+C) and restart:
   npm run dev
   ```

4. **Login as admin** at `/admin/login` using the configured admin email

**Note:** Admin users must first register as regular users before accessing admin features. The admin email configuration only grants access to the admin dashboard; the user account must already exist in the database.

For more details, see [LOGIN_GUIDE.md](LOGIN_GUIDE.md).
