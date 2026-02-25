# Admin Setup Guide - BudolShap

This guide explains how to set up and access admin functionality in BudolShap.

## Quick Setup Steps

### 1. Create Admin Account

Run the admin creation script:

```bash
npm run create-admin
```

Or manually:

```bash
node scripts/create-admin.js
```

**Default Admin Credentials:**
- Email: `admin@budolshap.com`
- Password: `admin123`

### 2. Configure Admin Email in `.env`

Add the admin email to your `.env` file:

```env
ADMIN_EMAILS="admin@budolshap.com"
```

Or if you want multiple admins:

```env
ADMIN_EMAILS="admin@budolshap.com,admin2@example.com,admin3@example.com"
```

**Important Notes:**
- Use `ADMIN_EMAILS` for server-side (recommended)
- Or use `NEXT_PUBLIC_ADMIN_EMAILS` for client-side access (optional)
- Multiple emails must be separated by commas
- No spaces around commas
- The email must match exactly (case-sensitive)

### 3. Restart Development Server

After updating `.env`, restart your server:

```bash
# Stop the server (Ctrl+C) and restart:
npm run dev
```

### 4. Login as Admin

1. Go to `http://localhost:3000/admin/login`
2. Enter your admin email and password
3. You'll be redirected to the admin dashboard

## Custom Admin Credentials

To create an admin with custom credentials:

**Windows:**
```cmd
set ADMIN_EMAIL=your-email@example.com
set ADMIN_PASSWORD=yourpassword
set ADMIN_NAME=Admin Name
npm run create-admin
```

**Linux/Mac:**
```bash
ADMIN_EMAIL=your-email@example.com ADMIN_PASSWORD=yourpassword ADMIN_NAME="Admin Name" npm run create-admin
```

Then add the email to `ADMIN_EMAILS` in `.env`:

```env
ADMIN_EMAILS="your-email@example.com"
```

## Troubleshooting

### Issue: "You are not authorized to access this page"

**Solutions:**

1. **Check if admin email is configured:**
   - Open `.env` file
   - Verify `ADMIN_EMAILS` contains your email
   - Make sure there are no extra spaces

2. **Verify your email matches:**
   - Check the email you used during registration
   - It must match exactly (case-sensitive)
   - Check browser console for the exact email being checked

3. **Restart your server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

4. **Check if admin account exists:**
   - Verify the user exists in the database
   - Run `npm run create-admin` to create/update admin account

5. **Verify database connection:**
   - Make sure MySQL is running (WAMP)
   - Check `DATABASE_URL` in `.env` is correct

6. **Check browser console:**
   - Open browser developer tools (F12)
   - Check Console tab for error messages
   - Look for admin check logs

### Issue: "No admin emails configured"

**Solution:**
Add `ADMIN_EMAILS` to your `.env` file:

```env
ADMIN_EMAILS="admin@budolshap.com"
```

Then restart the server.

### Issue: Admin check fails even with correct email

**Solutions:**

1. **Clear browser cache and cookies:**
   - Clear browser data
   - Or use incognito/private mode

2. **Verify token is set:**
   - Check browser DevTools → Application → Cookies
   - Look for `token` cookie

3. **Check server logs:**
   - Look at terminal output for errors
   - Check for admin check logs

4. **Verify JWT_SECRET is set:**
   ```env
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   ```

## Admin Features

Once logged in as admin, you have access to:

- **Dashboard** (`/admin`) - Overview and statistics
- **Users** (`/admin/users`) - Manage all users
- **Products** (`/admin/products`) - Manage all products across all stores
- **Orders** (`/admin/orders`) - View and manage all orders
- **Stores** (`/admin/stores`) - Manage all stores
- **Approve Store** (`/admin/approve`) - Approve/reject store applications
- **Coupons** (`/admin/coupons`) - Create and manage coupons

## Admin Access via Navbar

After logging in as admin:
1. Click on your name in the navbar
2. Select "Admin Dashboard" from the dropdown menu
3. Or go directly to `http://localhost:3000/admin`

## Security Notes

- **Change default password** after first login
- **Use strong passwords** for admin accounts
- **Keep admin emails secure** - don't commit `.env` to git
- **Regularly review** admin email list
- **Limit admin access** to trusted users only

## Verifying Admin Access

To verify admin access is working:

1. **Check browser console:**
   - Open DevTools (F12)
   - Look for "Admin check response" log
   - Should show `isAdmin: true`

2. **Test admin API:**
   - After logging in, visit: `http://localhost:3000/api/auth/admin/check`
   - Should return: `{"isAdmin": true, "email": "your-email@example.com"}`

3. **Check dashboard:**
   - Access `/admin` - should show admin dashboard
   - Should NOT show "unauthorized" message

## Need Help?

If you're still having issues:

1. Check `scripts/README.md` for admin creation script details
2. Review `LOGIN_GUIDE.md` for login instructions
3. Check server logs for detailed error messages
4. Verify all environment variables are set correctly
5. Ensure database migrations have been run

---

**Last Updated:** 2024

