# Quick Fix: Admin Access Denied

## Problem
You're seeing: **"Access denied. Email 'admin@budolshap.com' is not in the admin list."**

## Solution

### Step 1: Open your `.env` file
Located at: `c:\wamp64\www\gocart\.env`

### Step 2: Add or Update ADMIN_EMAILS

Add this line to your `.env` file:

```env
ADMIN_EMAILS="admin@budolshap.com"
```

Or if you already have other admin emails:

```env
ADMIN_EMAILS="admin@budolshap.com,other-admin@example.com"
```

### Step 3: Restart Your Server

**IMPORTANT:** After updating `.env`, you MUST restart your server:

1. Stop the current server (press `Ctrl+C` in the terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

### Step 4: Login Again

1. Go to `http://localhost:3000/admin/login`
2. Enter your email: `admin@budolshap.com`
3. Enter your password
4. You should now have admin access!

## Complete .env Example

Your `.env` file should look like this:

```env
DATABASE_URL="mysql://root:@localhost:3306/budolshap"
NEXT_PUBLIC_CURRENCY_SYMBOL="$"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Admin Configuration (comma-separated emails)
ADMIN_EMAILS="admin@budolshap.com"

# Email Configuration (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Still Not Working?

1. **Verify the email matches exactly:**
   - Check if there are any typos in the email
   - Make sure it's the exact email you used when creating the admin account

2. **Check server logs:**
   - Look at your terminal/console
   - You should see admin check logs with your email

3. **Clear browser cache:**
   - Clear cookies and cache
   - Or use incognito/private mode

4. **Verify admin account exists:**
   - Run: `npm run create-admin`
   - This will create/update the admin account

---

**Note:** Always restart your server after changing `.env` file!

