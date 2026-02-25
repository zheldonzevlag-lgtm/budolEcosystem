# Login Guide - BudolShap

This guide explains how to login for different user roles in BudolShap.

## 📋 Table of Contents

- [Overview](#overview)
- [User Types](#user-types)
- [Regular User Login](#regular-user-login)
- [Store Owner (Seller) Login](#store-owner-seller-login)
- [Admin Login](#admin-login)
- [Troubleshooting](#troubleshooting)

---

## Overview

BudolShap supports three types of user accounts:

1. **Regular Users** - Customers who browse and purchase products
2. **Store Owners (Sellers)** - Vendors who manage their own stores and products
3. **Administrators** - Platform admins who manage stores, coupons, and approvals

Each user type has a dedicated login page for easier access to their respective dashboards.

---

## User Types

### 1. Regular Users 👤
- Browse products
- Add items to cart
- Place orders
- View order history
- Rate and review products

### 2. Store Owners (Sellers) 🏪
- Manage store details
- Add/edit/delete products
- View and manage orders
- Track sales and revenue
- Update store settings

### 3. Administrators 🔐
- Approve/reject store applications
- Manage all stores
- Create and manage coupons
- View platform-wide analytics
- Control store active status

---

## Regular User Login

### Accessing the Login Page

**Option 1: Direct URL**
```
http://localhost:3000/login
```

**Option 2: From Homepage**
1. Click the "Login" button in the navigation bar
2. You will be redirected to `/login`

**Option 3: Clicking Protected Links**
- If you try to access `/cart` or `/orders` without logging in, you'll be automatically redirected to `/login`

### Steps to Login

1. Navigate to the login page (`/login`)
2. Enter your **email address**
3. Enter your **password**
4. Click the "Login" button
5. Upon successful login, you'll be redirected to the homepage or the page you originally tried to access

### Registration (New Users)

If you don't have an account yet:

1. Click "Sign Up" link on the login page
2. Fill in your:
   - Name
   - Email address
   - Password (minimum 6 characters)
   - Confirm Password
3. Click "Sign Up"
4. Check your email for a verification link
5. Click the verification link to verify your account
6. Return to the login page and sign in

### Login Credentials Example

```
Email: customer@example.com
Password: yourpassword
```

---

## Store Owner (Seller) Login

### Accessing the Login Page

**Option 1: Direct URL**
```
http://localhost:3000/store/login
```

**Option 2: From Regular Login Page**
1. Go to `/login`
2. Scroll down to find the "Login as Store Owner" link
3. Click the link to navigate to `/store/login`

**Option 3: Direct Access Attempt**
- If you try to access `/store/*` without logging in, you'll be redirected to login

### Steps to Login as Store Owner

1. Navigate to `/store/login`
2. Enter your **email address** (must be associated with a store)
3. Enter your **password**
4. Click "Login to Store Dashboard"
5. If you have a store:
   - You'll be redirected to `/store` (Store Dashboard)
   - You can now manage products, orders, and store settings
6. If you don't have a store:
   - You'll see a message prompting you to create a store
   - You'll be redirected to `/create-store` after 2 seconds

### Creating a Store (First Time)

If you're logging in as a store owner for the first time:

1. Login with your regular account credentials at `/store/login`
2. Fill in your store details:
   - Store Name
   - Store Username (unique)
   - Store Email
   - Contact Number
   - Store Description
   - Store Logo (image)
   - Store Address
3. Submit the form
4. Wait for admin approval
5. Once approved, you'll have full access to the store dashboard

### Store Owner Login Credentials Example

```
Email: seller@example.com
Password: yourpassword
```

**Note:** You must use the same email you used when registering as a regular user. Store ownership is linked to your user account.

---

## Admin Login

### Accessing the Login Page

**Option 1: Direct URL**
```
http://localhost:3000/admin/login
```

**Option 2: From Regular Login Page**
1. Go to `/login`
2. Scroll down to find the "Login as Admin" link
3. Click the link to navigate to `/admin/login`

**Option 3: Direct Access Attempt**
- If you try to access `/admin/*` without proper credentials, you'll be redirected or see an unauthorized message

### Steps to Login as Admin

1. Navigate to `/admin/login`
2. Enter your **admin email address** (must be configured as admin)
3. Enter your **password**
4. Click "Login to Admin Dashboard"
5. If you're authorized as admin:
   - You'll be redirected to `/admin` (Admin Dashboard)
   - You can now manage stores, coupons, and approvals
6. If you're not authorized:
   - You'll see an "Access denied" error
   - You'll be redirected back to the homepage

### Setting Up Admin Access

To configure admin users, you need to set environment variables:

1. Open your `.env` file
2. Add the following line:

```env
ADMIN_EMAILS=admin@example.com,admin2@example.com
```

Or for client-side access:

```env
NEXT_PUBLIC_ADMIN_EMAILS=admin@example.com,admin2@example.com
```

**Important Notes:**
- Multiple admin emails can be separated by commas
- Admin emails must match the email used during user registration
- Changes to admin emails require a server restart
- Admin users must first register as regular users before accessing admin features

### Admin Login Credentials Example

```
Email: admin@example.com
Password: yourpassword
```

**Note:** The admin email must be configured in your `.env` file (see above).

---

## Login URLs Summary

| User Type | Login URL | Dashboard URL |
|-----------|-----------|---------------|
| Regular User | `/login` | `/` (Homepage) |
| Store Owner | `/store/login` | `/store` |
| Admin | `/admin/login` | `/admin` |

---

## Troubleshooting

### Problem: "Invalid email or password"

**Solutions:**
- Double-check your email and password
- Ensure you've verified your email (check your inbox)
- Try resetting your password using "Forgot Password?"
- Make sure you're using the correct email address (check for typos)

### Problem: "You are not authorized to access this page" (Store Owner)

**Solutions:**
- Ensure you've created a store at `/create-store`
- Check if your store has been approved by an admin
- Verify your store is active
- Contact support if your store application was rejected

### Problem: "Access denied. You are not an administrator" (Admin)

**Solutions:**
- Verify your email is listed in `ADMIN_EMAILS` or `NEXT_PUBLIC_ADMIN_EMAILS` in `.env`
- Ensure you used the exact same email during registration
- Restart your development server after updating `.env`
- Check that the email is correctly formatted (no extra spaces)

### Problem: Password reset link not working

**Solutions:**
- Check if the link has expired (links expire after 1 hour)
- Ensure the full URL was copied (including the token parameter)
- Try requesting a new password reset link
- Check your spam/junk folder for the email

### Problem: Can't access protected routes after login

**Solutions:**
- Clear your browser cookies and try again
- Ensure JavaScript is enabled in your browser
- Check browser console for errors
- Try logging out and logging back in

### Problem: Store dashboard shows "Store not found"

**Solutions:**
- Make sure you've created a store at `/create-store`
- Verify the store was created with the correct user account
- Check if the store was accidentally deleted
- Contact support for assistance

### Problem: Login works but redirects to wrong page

**Solutions:**
- Clear your browser's localStorage: `localStorage.clear()`
- Logout and login again
- Check if there's a `redirect` parameter in the URL

---

## Security Best Practices

1. **Use Strong Passwords**
   - Minimum 6 characters (recommended: 8+ characters)
   - Mix of letters, numbers, and special characters
   - Don't reuse passwords from other accounts

2. **Keep Credentials Secure**
   - Never share your login credentials
   - Use different passwords for different roles (if applicable)
   - Logout when using shared computers

3. **Email Verification**
   - Always verify your email after registration
   - Check spam folder if verification email doesn't arrive

4. **Admin Access**
   - Only grant admin access to trusted users
   - Regularly review admin email list in `.env`
   - Use strong passwords for admin accounts

---

## Quick Reference

### Registration Flow
```
Homepage → Login → Sign Up → Verify Email → Login → Access Features
```

### Store Owner Flow
```
Register → Login → Create Store → Wait for Approval → Login to Store Dashboard
```

### Admin Setup Flow
```
Register → Add Email to ADMIN_EMAILS in .env → Restart Server → Login to Admin Dashboard
```

---

## Need Help?

If you encounter issues not covered in this guide:

1. Check the main [README.md](README.md) for setup instructions
2. Review [AUTHENTICATION_COMPLETE.md](AUTHENTICATION_COMPLETE.md) for authentication details
3. Check server logs for error messages
4. Verify your `.env` file configuration
5. Ensure database migrations have been run

---

**Last Updated:** 2024
**Version:** 1.0

