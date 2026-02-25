# 🔐 Admin Account Setup Guide - Vercel Production

## ✅ Admin Account Created Successfully!

Your admin account has been created in the Vercel Postgres database.

### 📋 Admin Credentials

```
📧 Email: admin@budolshap.com
🔑 Password: admin123
```

⚠️ **IMPORTANT**: Change this password immediately after first login!

---

## 🎯 Configuration Steps Completed

### 1. ✅ Admin User Created in Database
- **User ID**: `admin_1763970603684_1a041tu9r`
- **Name**: Admin User
- **Email**: admin@budolshap.com
- **Email Verified**: Yes
- **Account Type**: ADMIN
- **Is Admin**: true

### 2. ✅ Environment Variable Added to Vercel
- **Variable**: `ADMIN_EMAILS`
- **Value**: `admin@budolshap.com`
- **Environment**: Production

---

## 🚀 How to Access Admin Panel

### Option 1: Direct Login (Recommended)
1. Visit: `https://budolshap.vercel.app/admin/login`
2. Enter credentials:
   - Email: `admin@budolshap.com`
   - Password: `admin123`
3. Click **Login**

### Option 2: Via Main Site
1. Visit: `https://budolshap.vercel.app`
2. Navigate to Admin Login
3. Enter admin credentials

---

## 📝 Next Steps

### 1. Change Your Password
After logging in for the first time:
1. Go to Admin Profile/Settings
2. Change password from `admin123` to a secure password
3. Save changes

### 2. Verify Admin Access
Test these admin features:
- [ ] Dashboard access
- [ ] User management
- [ ] Product management
- [ ] Order management
- [ ] Store verification
- [ ] Analytics/Reports

### 3. Create Additional Admins (Optional)
If you need more admin accounts:

```bash
# Set custom admin details
$env:ADMIN_EMAIL="newadmin@example.com"
$env:ADMIN_PASSWORD="securepassword"
$env:ADMIN_NAME="New Admin Name"

# Run the script
npx dotenv -e .env.production -- node scripts/create-admin.js

# Add to Vercel environment variable
# Go to: https://vercel.com/derflanoj2s-projects/budolshap/settings/environment-variables
# Edit ADMIN_EMAILS and add: admin@budolshap.com,newadmin@example.com
```

---

## 🔧 Troubleshooting

### Cannot Login?
1. **Check email is correct**: `admin@budolshap.com`
2. **Verify ADMIN_EMAILS in Vercel**:
   - Go to: Settings → Environment Variables
   - Confirm `ADMIN_EMAILS` contains `admin@budolshap.com`
3. **Redeploy if needed**:
   ```bash
   vercel --prod
   ```

### "Access Denied" Error?
1. Verify the user has `isAdmin: true` in database
2. Check `accountType` is set to `ADMIN`
3. Ensure `emailVerified` is `true`

### Need to Reset Password?
Run the create-admin script again:
```bash
npx dotenv -e .env.production -- node scripts/create-admin.js
```
This will update the existing admin account with the default password.

---

## 📊 Admin Panel Features

Once logged in, you'll have access to:

### Dashboard
- Overview statistics
- Recent orders
- Revenue analytics
- User activity

### User Management
- View all users
- Edit user details
- Manage user roles
- View user orders

### Product Management
- Approve/reject products
- Edit product details
- Manage categories
- Monitor inventory

### Store Management
- Verify seller stores
- Review KYC documents
- Approve/reject stores
- Monitor store performance

### Order Management
- View all orders
- Update order status
- Process returns
- Handle disputes

### Financial Management
- View transactions
- Process payouts
- Monitor revenue
- Generate reports

---

## 🔒 Security Best Practices

1. **Change Default Password**: Never use `admin123` in production
2. **Use Strong Passwords**: Minimum 12 characters, mixed case, numbers, symbols
3. **Enable 2FA**: If available, enable two-factor authentication
4. **Limit Admin Access**: Only create admin accounts for trusted users
5. **Regular Audits**: Review admin actions periodically
6. **Secure Email**: Use a secure email account for admin access

---

## 📚 Useful Links

- **Production Site**: https://budolshap.vercel.app
- **Admin Login**: https://budolshap.vercel.app/admin/login
- **Vercel Dashboard**: https://vercel.com/derflanoj2s-projects/budolshap
- **Environment Variables**: https://vercel.com/derflanoj2s-projects/budolshap/settings/environment-variables
- **Database**: https://vercel.com/derflanoj2s-projects/budolshap/stores

---

## 🎉 Setup Complete!

Your admin account is ready to use. Login now and start managing your Budolshap marketplace!

**Created**: November 24, 2025
**Environment**: Vercel Production (Postgres)
