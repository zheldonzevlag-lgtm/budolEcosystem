# Email Setup Guide - Send Emails in Development

## Quick Setup for Gmail

### Step 1: Enable 2-Factor Authentication
1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already enabled

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other (Custom name)" as the device
4. Enter "BudolShap" as the name
5. Click "Generate"
6. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Add to .env File
Add these lines to your `.env` file in the project root:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM=your-email@gmail.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `abcdefghijklmnop` with the 16-character app password (remove spaces)
- Make sure there are no quotes around the values

### Step 4: Restart Dev Server
After updating `.env`, restart your development server:
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## How It Works Now

✅ **If email is configured** (SMTP_USER and SMTP_PASS exist):
- Emails will be **sent** to the user's inbox
- Works in both development and production
- Console will show: `✓ Password reset email sent to: email@example.com`

❌ **If email is NOT configured**:
- Links are logged to console
- Links are shown on the web page
- No emails are sent

## Testing

1. Add your Gmail credentials to `.env`
2. Restart the server
3. Request a password reset
4. Check your email inbox (and spam folder if needed)

## Troubleshooting

### "Invalid login" error
- Make sure you're using an **App Password**, not your regular Gmail password
- Verify 2-Factor Authentication is enabled
- Check that the password has no spaces

### "Connection timeout" error
- Check your firewall settings
- Verify SMTP_PORT is 587 (not 465)
- Try using `SMTP_HOST=smtp.gmail.com` explicitly

### Email goes to spam
- This is normal for development emails
- Check your spam/junk folder
- In production, use a proper email service (SendGrid, AWS SES, etc.)

## Alternative Email Services

### SendGrid (Recommended for Production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

### Mailtrap (For Testing)
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
SMTP_FROM=test@mailtrap.io
```

