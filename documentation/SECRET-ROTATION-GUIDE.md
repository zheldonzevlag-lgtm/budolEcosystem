# Secret Rotation Guide

## CRITICAL — Rotate Immediately

These secrets were hardcoded in the codebase and MUST be rotated:

### 1. JWT Secret
**Was:** `GJ7Lxn0/kdV/KuZJ5xJ7Ip0RvMerrGW5n0gf44mfHgc=`

**How to rotate:**
```bash
# Generate new secret
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Update in:
# - .env (all services)
# - docker-compose.yml (auth-service)
# - Vercel/AWS environment variables
```

### 2. Database Passwords
**Was:** `r00tPassword2026!` and `r00t`

**How to rotate:**
```sql
-- Connect to PostgreSQL
ALTER USER budolpostgres WITH PASSWORD 'new_secure_password_here';
ALTER USER postgres WITH PASSWORD 'new_secure_password_here';
```

**Update in:**
- `.env` files (all services)
- `docker-compose.yml`
- `budolpay-0.1.0/services/*/Dockerfile`

### 3. Internal API Key (WebSocket)
**Was:** Not set (now required)

**How to generate:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Update in:**
- WebSocket server `.env`
- All backend services that call `/trigger` endpoint

---

## HIGH — Rotate When Possible

### 4. PayMongo Keys
**Location:** `budolID-0.1.0/.env`

**How to rotate:**
1. Log in to PayMongo dashboard
2. Go to API Keys
3. Regenerate keys
4. Update `.env` files

### 5. Cloudinary Credentials
**Location:** `budolID-0.1.0/.env`

**How to rotate:**
1. Log in to Cloudinary dashboard
2. Go to API Keys
3. Regenerate keys
4. Update `.env` files

### 6. Lalamove Credentials
**Location:** `budolID-0.1.0/.env`

**How to rotate:**
1. Log in to Lalamove developer portal
2. Regenerate API keys
3. Update `.env` files

### 7. Pusher Keys
**Location:** `budolID-0.1.0/.env`

**How to rotate:**
1. Log in to Pusher dashboard
2. Go to App Keys
3. Regenerate keys
4. Update `.env` files

---

## MEDIUM — Rotate During Maintenance

### 8. Brevo API Key
**Location:** `budolID-0.1.0/.env`

### 9. Zerix API Key
**Location:** `budolID-0.1.0/.env`

### 10. iTextMo Credentials
**Location:** `budolID-0.1.0/.env`

### 11. Prisma Accelerate URL
**Location:** `budolID-0.1.0/.env`

---

## Docker Compose Secrets

**File:** `budolpay-0.1.0/docker-compose.yml`

**Lines to update:**
- Line 60: `JWT_SECRET=budolpay-secret-key-123`
- Line 140: `GF_SECURITY_ADMIN_PASSWORD=admin`

**Fix:**
```yaml
environment:
  - JWT_SECRET=${JWT_SECRET}  # Use env var instead of hardcoded
  - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
```

---

## Verification Script

After rotation, run this to verify no hardcoded secrets remain:

```bash
# Search for known hardcoded values
grep -r "GJ7Lxn0/kdV" --include="*.js" --include="*.ts" --include="*.env*"
grep -r "r00tPassword2026" --include="*.js" --include="*.ts" --include="*.env*"
grep -r "budolpay-secret-key-123" --include="*.yml" --include="*.yaml"
grep -r "bp_key_2025" --include="*.js" --include="*.ts"
grep -r "bs_key_2025" --include="*.js" --include="*.ts"

# Should return empty (no matches)
```
