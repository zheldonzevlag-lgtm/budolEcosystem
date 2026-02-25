# How to Get Your Password Reset Link

## In Development Mode (No Email Configured)

Since email is not configured, the reset link is provided in **two places**:

### 1. Server Console (Terminal)
When you request a password reset, check your **server terminal/console** where `npm run dev` is running. You should see:

```
========================================
📧 PASSWORD RESET (Development Mode)
========================================
To: your-email@example.com
Name: Your Name
Reset Link: http://localhost:3001/reset-password?token=xxxxx
========================================
```

### 2. On the Web Page
After submitting the forgot password form, the reset link will be displayed **on the success page** in a green box.

## To Configure Email (Optional)

If you want to receive actual emails, add these to your `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

### Gmail Setup:
1. Enable 2-Factor Authentication: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character app password in `SMTP_PASS`

After configuring email, restart your dev server and emails will be sent normally.

