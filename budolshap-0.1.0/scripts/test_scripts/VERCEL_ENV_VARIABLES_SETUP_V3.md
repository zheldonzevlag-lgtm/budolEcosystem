# Vercel Environment Variables Setup for budolshap-v3

## 🚀 Deployment Status
- **Project Name**: budolshap-v3
- **Scope**: Jon's projects

## 📋 Required Environment Variables

Please add these variables in **Vercel Dashboard → Settings → Environment Variables**.

### 1. Database Configuration (Automated)
Go to the **Storage** tab in your Vercel project and create/connect a **Vercel Postgres** database.
This will automatically set:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### 2. Application Secrets (Manual Setup Required)

**JWT_SECRET**
- **Description**: Secret key for signing JSON Web Tokens.
- **Value**: Generate a random string (e.g. `openssl rand -base64 32`)
- **Environments**: Production, Preview, Development

**NEXT_PUBLIC_BASE_URL**
- **Description**: The URL of your deployed application.
- **Value**: `https://budolshap-v3.vercel.app` (or your assigned domain)
- **Environments**: Production

**NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME**
- **Value**: `dasfwpg7x`
- **Environments**: Production, Preview, Development

**CLOUDINARY_API_KEY**
- **Value**: `537684148625265`
- **Environments**: Production, Preview, Development

**CLOUDINARY_API_SECRET**
- **Value**: `USb6SDEDehMLyw9_HlFC1wDqlDE`
- **Environments**: Production, Preview, Development

**PAYMONGO_SECRET_KEY**
- **Value**: (Your PayMongo Live Secret Key)
- **Environments**: Production

**PAYMONGO_PUBLIC_KEY**
- **Value**: (Your PayMongo Live Public Key)
- **Environments**: Production

**NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY**
- **Value**: (Same as PAYMONGO_PUBLIC_KEY)
- **Environments**: Production

**LALAMOVE_API_KEY**
- **Value**: (Your Lalamove Production API Key)
- **Environments**: Production

**LALAMOVE_API_SECRET**
- **Value**: (Your Lalamove Production API Secret)
- **Environments**: Production

**LALAMOVE_ENVIRONMENT**
- **Value**: `production`
- **Environments**: Production

**EMAIL_HOST**
- **Value**: `smtp.gmail.com`
- **Environments**: Production

**EMAIL_USER**
- **Value**: (Your Gmail Address)
- **Environments**: Production

**EMAIL_PASSWORD**
- **Value**: (Your Gmail App Password)
- **Environments**: Production
