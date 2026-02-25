# Authentication Setup Guide

## Environment Variables

Add these to your `.env` file:

```env
# JWT Secret (change this to a random string in production)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Email Configuration (for email verification and password reset)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# App URL (for email links)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Email Setup

### Gmail Setup:
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `SMTP_PASS`

### Other Email Services:
- **SendGrid**: Use `smtp.sendgrid.net` with port 587
- **AWS SES**: Configure with AWS credentials
- **Mailgun**: Use their SMTP settings

## Features Implemented

### ✅ Password Hashing
- Uses bcryptjs for secure password hashing
- Salt rounds: 10

### ✅ JWT Tokens
- Secure token generation and verification
- 7-day expiration (configurable)
- Stored in HTTP-only cookies

### ✅ Protected Routes
- Middleware automatically protects routes
- Protected routes: `/store`, `/admin`, `/orders`, `/cart`
- Redirects to login if not authenticated

### ✅ Password Reset
- Forgot password functionality
- Secure token-based reset links
- 1-hour token expiration
- Email notifications

### ✅ Email Verification
- Email verification on signup
- 24-hour token expiration
- Verification page at `/verify-email`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/verify-email?token=xxx` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

## Pages

- `/verify-email?token=xxx` - Email verification page
- `/forgot-password` - Forgot password page
- `/reset-password?token=xxx` - Password reset page

## Usage

### Register New User
```javascript
const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
    })
})
```

### Login
```javascript
const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'john@example.com',
        password: 'password123'
    })
})
```

### Get Current User
```javascript
const response = await fetch('/api/auth/me', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
})
```

## Security Notes

1. **Change JWT_SECRET** in production to a strong random string
2. **Use HTTPS** in production for secure cookie transmission
3. **Rate limiting** should be added for login/register endpoints
4. **Email verification** is required but can be bypassed for testing
5. **Password requirements** - minimum 6 characters (consider adding more requirements)

## Testing

For testing without email setup, you can:
1. Comment out email sending in the API routes
2. Use a service like Mailtrap for development
3. Check console logs for verification tokens

