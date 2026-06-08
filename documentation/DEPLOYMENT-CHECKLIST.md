# Deployment Checklist

## Pre-Deployment

### 1. Environment Variables
- [ ] Copy `.env.example` to `.env` in each service directory
- [ ] Fill in all required values (JWT_SECRET, DATABASE_URL, etc.)
- [ ] Verify no hardcoded secrets remain in source code
- [ ] Run verification script: `bash scripts/verify-no-hardcoded-secrets.sh`

### 2. Secrets Rotation
- [ ] Follow `SECRET-ROTATION-GUIDE.md`
- [ ] Rotate JWT_SECRET (was hardcoded)
- [ ] Rotate database passwords (were hardcoded)
- [ ] Generate INTERNAL_API_KEY for WebSocket
- [ ] Update PayMongo keys
- [ ] Update Cloudinary credentials
- [ ] Update Lalamove credentials

### 3. Dependencies
- [ ] Run `npm install` in all service directories
- [ ] Verify no missing dependencies
- [ ] Run `npm audit fix` to address vulnerabilities

---

## Deployment Steps

### Step 1: Database
```bash
# Run Prisma migrations
cd budolpay-0.1.0
npx prisma migrate deploy

cd ../budolID-0.1.0
npx prisma migrate deploy
```

### Step 2: Backend Services (budolpay)
```bash
cd budolpay-0.1.0

# Build and start with Docker Compose
docker-compose down
docker-compose up -d --build

# Verify all services are running
docker-compose ps
```

### Step 3: WebSocket Server
```bash
cd websocket-server

# Build Docker image
docker build -t budolpay-websocket .

# Run container
docker run -d \
  --name budolpay-websocket \
  -p 4000:4000 \
  --env-file .env \
  budolpay-websocket
```

### Step 4: budolID (SSO Service)
```bash
cd budolID-0.1.0

# Build Docker image
docker build -t budolid-sso .

# Run container
docker run -d \
  --name budolid-sso \
  -p 8000:8000 \
  --env-file .env \
  budolid-sso
```

### Step 5: BudolShap (Frontend)
```bash
cd budolshap-0.1.0

# Build for production
npm run build

# Start production server
npm start
```

### Step 6: BudolPay Admin Dashboard
```bash
cd budolpay-0.1.0/apps/admin

# Build for production
npm run build

# Start production server
npm start
```

---

## Post-Deployment Verification

### 1. Service Health Checks
```bash
# API Gateway
curl http://localhost:8000/health

# Auth Service
curl http://localhost:8001/health

# Wallet Service
curl http://localhost:8002/health

# Transaction Service
curl http://localhost:8003/health

# WebSocket Server
curl http://localhost:4000/

# budolID
curl http://localhost:8000/health
```

### 2. Authentication Flow
- [ ] Register new user with CAPTCHA
- [ ] Login with email/password
- [ ] Login with phone/OTP
- [ ] SSO login between services
- [ ] Token refresh works

### 3. WebSocket Connection
- [ ] Connect with valid JWT
- [ ] Connection rejected without JWT
- [ ] Channel subscription works
- [ ] Real-time events received

### 4. Financial Operations
- [ ] Wallet balance update (requires auth)
- [ ] QR code processing (requires auth)
- [ ] Transaction creation (requires auth)
- [ ] Payment processing

### 5. Security Headers
```bash
# Check for security headers
curl -I http://localhost:3000

# Should include:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000
```

### 6. Rate Limiting
```bash
# Test rate limiting (should get 429 after limit)
for i in {1..10}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

---

## Rollback Plan

If issues occur:

1. **Revert to previous Docker images:**
   ```bash
   docker-compose down
   git checkout <previous-commit>
   docker-compose up -d --build
   ```

2. **Restore database if needed:**
   ```bash
   pg_restore -d budolpay backup.sql
   ```

3. **Revert environment variables:**
   - Restore previous `.env` files
   - Redeploy services

---

## Monitoring

### Logs to Watch
```bash
# Real-time logs
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service
docker-compose logs -f wallet-service
docker-compose logs -f api-gateway
```

### Metrics
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090

### Alerts to Configure
- Service health check failures
- High error rates (>5%)
- Rate limit triggers
- Authentication failures
