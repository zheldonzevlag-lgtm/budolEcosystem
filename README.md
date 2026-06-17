# Budol Ecosystem

Welcome to the Budol Ecosystem, a comprehensive suite of interconnected applications for e-commerce, finance, and accounting.

## ### The Budol Ecosystem Map 
 - **budolID-0.1.0** : The Heart. This is your Central Identity & SSO service. It manages users for all other apps. 
 - **budolshap-0.1.0** : The Storefront. This is the e-commerce marketplace where buyers shop and sellers manage stores. 
 - **budolpay-0.1.0** : The Wallet. A complex fintech app with microservices (wallet, settlement, payment gateway) and its own admin dashboard. 
 - **budolLoan-0.1.0** : The Credit. Likely handles lending or credit lines for sellers and buyers within the ecosystem. 
 - **budolAccounting-0.1.0** : The Ledger. Centralized financial tracking for all transactions across the ecosystem.
 - **budolExpress** : The Wheels. Future logistics app for delivery tracking and courier management.

# budolEcosystem

A comprehensive fintech e-commerce ecosystem built for the Philippine market. This monorepo contains all services, applications, and infrastructure for the budolPay platform.

**Last Codebase Audit:** 2026-06-02 | **GitNexus Index:** 26,266 symbols | 35,895 relationships | 300 execution flows

---

## Architecture Overview

```
budolEcosystem/
├── budolshap-0.1.0/          # Next.js 16 e-commerce marketplace (buyers + sellers)
├── budolpay-0.1.0/           # Fintech microservices monorepo (Express.js)
│   ├── apps/admin/           # Admin dashboard (Next.js 14 + TypeScript)
│   ├── services/
│   │   ├── api-gateway/      # Central API gateway with Socket.io + Pusher
│   │   ├── auth-service/     # Authentication, OTP, PIN, biometric
│   │   ├── wallet-service/   # Wallet management, QR payments
│   │   ├── transaction-service/ # P2P transfers, cash-in/out, compliance
│   │   ├── settlement-service/  # Merchant settlement, disputes, reconciliation
│   │   ├── payment-gateway-service/ # External payment provider integrations
│   │   └── verification-service/ # KYC document upload, OCR, face verification
│   └── packages/
│       ├── database/         # Shared Prisma schema & client (@budolpay/database)
│       ├── audit/            # Audit logging
│       ├── notifications/    # Email/SMS notification system
│       └── security/         # Security utilities
├── budolPayMobile/           # Flutter mobile app (Android/iOS/Web) v1.3.93
├── budolID-0.1.0/            # Central Identity & SSO service
├── budolAccounting-0.1.0/    # Double-entry accounting ledger
├── budolloan-0.1.0/          # Loan management (scaffolded, not integrated)
├── websocket-server/         # Standalone Socket.io real-time server
├── scripts/                  # Deployment, backup, and test scripts
├── documentation/            # Project documentation (HTML docs)
└── backup-db/                # Database backup snapshots
```

## The Budol Ecosystem Map

| Service | Port | Role | Technology |
|---------|------|------|------------|
| **budolID** | 8000 | Central Identity & SSO | Express.js 5.2, Prisma 5.14, JWT, bcrypt |
| **budolshap** | 3000 | E-commerce marketplace | Next.js 16, React 19, Prisma 6.19, Tailwind CSS 4 |
| **budolPay API Gateway** | 8080 | Request routing + real-time events | Express.js, Socket.io, Pusher, http-proxy-middleware |
| **budolPay Auth** | 8001 | Login, OTP, PIN, biometric auth | Express.js, Prisma |
| **budolPay Wallet** | 8002 | Balance management, QR payments | Express.js, Prisma |
| **budolPay Transactions** | 8003 | P2P transfers, cash-in/out, compliance | Express.js, Prisma, Decimal.js |
| **budolPay Payment Gateway** | 8004 | External payment provider integration | Express.js (Vercel serverless) |
| **budolAccounting** | 8005 | Double-entry accounting ledger | Express.js, Prisma, Decimal.js |
| **budolPay Verification** | 8006 | KYC document upload, OCR, face verification | Express.js, Tesseract.js, Cloudinary |
| **budolPay Settlement** | 8007 | Merchant settlement, disputes, reconciliation | Express.js, Prisma, Decimal.js |
| **WebSocket Server** | 4000 | Standalone real-time event relay | Express.js, Socket.io |
| **budolPay Admin** | 3000 | Admin dashboard | Next.js 14, TypeScript, Tailwind CSS |
| **budolPayMobile** | -- | Mobile app (Android/iOS/Web) | Flutter/Dart v1.3.93 |

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend (Web)** | Next.js 16 (App Router), React 19, Tailwind CSS 4, Framer Motion, Lucide Icons |
| **Frontend (Mobile)** | Flutter/Dart (cross-platform Android/iOS/Web) |
| **Backend** | Node.js 18+, Express.js (v5.2 in budolID, v4.x elsewhere) |
| **Database** | PostgreSQL (multiple databases with schema isolation) |
| **ORM** | Prisma (v6.19 budolShap, v5.14 budolPay/budolID/budolAccounting) |
| **Connection Pooling** | PgBouncer (transaction mode), Prisma Accelerate |
| **Cache** | Redis 7 (configured, partially integrated) |
| **Real-time** | Socket.io (self-hosted on port 4000) + Pusher (cloud, configurable) |
| **Auth** | JWT (HS256) + bcrypt (12 rounds) + OTP (SMS/Email) + Biometrics (mobile) |
| **Payments** | PayMongo, GCash, Maya, GrabPay, QRPh, Stripe, COD, BudolPay wallet |
| **Shipping** | Lalamove (on-demand delivery with webhook integration) |
| **Image Storage** | Cloudinary |
| **Email** | Nodemailer, Brevo, GMass (configurable via SystemSettings) |
| **SMS** | Zerix, iTextMo, Brevo SMS, Viber Business Messages |
| **Validation** | Zod v4, React Hook Form |
| **OCR** | Tesseract.js (web), Google ML Kit (mobile) |
| **AI** | OpenAI SDK (product description generation) |
| **Background Removal** | @imgly/background-removal + ONNX Runtime |
| **Maps/Geocoding** | Google Maps, Geoapify, Radar, OpenStreetMap (configurable) |
| **Monitoring** | Sentry (error tracking), Prometheus + Grafana (metrics) |
| **Deployment** | Vercel (frontend), AWS ECS (backend), Render (websocket), Docker |

## Codebase Statistics

| Metric | Count |
|--------|-------|
| **GitNexus Symbols** | 26,266 |
| **GitNexus Relationships** | 35,895 |
| **Execution Flows** | 300 |
| **API Routes (budolshap)** | 148+ endpoints |
| **React Components** | 90+ |
| **Flutter Dart Files** | 44 |
| **Microservices** | 8 |
| **Prisma Schemas** | 5 |
| **Prisma Models** | 47 total |
| **Test Scripts** | 1,041 |

## Authentication & Authorization Flow

### SSO Flow (budolID as Identity Provider)

```
User/App                budolID (port 8000)         Target Service
   |                          |                          |
   |-- POST /auth/sso/login ->|                          |
   |   (apiKey + credentials) |                          |
   |                          |-- validate credentials   |
   |                          |-- generate JWT (HS256)   |
   |<-- { token, session } ---|                          |
   |                          |                          |
   |-- Authorization: Bearer <jwt> ---------------------->|
   |                          |                          |
   |                          |<-- GET /auth/verify -----|
   |                          |   (validate JWT)         |
   |                          |--- { valid, user } ----->|
   |<-- protected resource --------------------------------|
```

**JWT Token Payload:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "firstName": "Juan",
  "lastName": "Dela Cruz",
  "role": "USER",
  "phoneNumber": "+639XXXXXXXXX",
  "iss": "budolID",
  "jti": "unique-token-id",
  "loginMethod": "PASSWORD"
}
```

**Token Expiry:** 7 days (web), 30 days (mobile)

### Mobile Auth Flow (GoTyme-inspired Multi-Phase)

1. **Phase 1 - Identify** (`/login/mobile/identify`) - Phone lookup, device trust check, OTP trigger
2. **Phase 2 - Verify OTP** (`/verify-otp`) - OTP validation, device trust update
3. **Phase 3 - PIN Setup** (`/login/mobile/setup-pin`) - 6-digit PIN creation for trusted devices
4. **Biometric** - Optional fingerprint/face via WebAuthn-style challenge/verify

### RBAC System

| Role | Level | Permissions |
|------|-------|-------------|
| `ADMIN` | 4 | Full system access |
| `GENERAL_MANAGER` | 3 | User management, reports, settings |
| `MANAGER` | 3 | User management, reports |
| `MERCHANT` | 2 | Store management, payouts |
| `STAFF` | 2 | Limited admin operations |
| `DRIVER` | 1 | Delivery operations |
| `USER` | 0 | Standard buyer operations |
| `DEACTIVATED` | -1 | No access |

### KYC Tiers

| Tier | Max Balance | Monthly Cash-In | Monthly P2P |
|------|-------------|-----------------|-------------|
| `BASIC` | PHP 10,000 | PHP 5,000 | PHP 5,000 |
| `SEMI_VERIFIED` | PHP 50,000 | PHP 25,000 | PHP 25,000 |
| `FULLY_VERIFIED` | Unlimited | Unlimited | Unlimited |

### Security Features

- bcrypt with 12 salt rounds (BSP/PCI DSS compliance)
- Password complexity: 8+ chars, uppercase, lowercase, number, special char
- PII masking in logs via `maskPII()` helper
- OTP rate limiting (60-second cooldown)
- Device trust management via `trustedDevices` JSON field
- SSO redirect URI validation with environment-aware repair logic

## Database Schema

The ecosystem uses **5 separate Prisma schemas** with PostgreSQL:

### budolShap Schema (24 models, 9 enums)

**File:** `budolshap-0.1.0/prisma/schema.prisma`

| Model | Purpose |
|-------|---------|
| `User` | Buyers/sellers with roles, addresses, orders, chat, ratings |
| `Category` | Hierarchical product categories (self-referencing) |
| `Product` | Items with SKU variations, tier pricing, stock tracking |
| `Order` | Purchase orders with 13-state status workflow |
| `Checkout` | Payment checkout sessions |
| `OrderItem` | Line items in orders |
| `Rating` | Product reviews |
| `Address` | Buyer addresses with geolocation |
| `Coupon` | Discount codes |
| `Store` | Seller storefronts with KYC, verification, penalty system |
| `StoreAddress` | Store pickup/return addresses |
| `Cart` / `CartItem` | Shopping cart |
| `Wallet` | Store wallets (balance, pending, locked) |
| `Transaction` | Wallet transactions (CREDIT/DEBIT) |
| `PayoutRequest` | Seller payout requests |
| `Return` | Return/refund workflow (14 states) |
| `PaymentProof` | Payment verification images |
| `Chat` / `Message` | Buyer-seller messaging |
| `WebhookEvent` | Payment webhook audit trail |
| `SystemSettings` | Global config (realtime, SMTP, SMS, Sentry, maps) |
| `RateLimit` | API rate limiting |
| `VerificationCode` | OTP codes |
| `AuditLog` | Full audit trail with geolocation and device info |

**Enums:** `OrderStatus` (13 states), `PaymentMethod` (7 methods), `AccountType`, `MembershipStatus`, `VerificationStatus`, `TransactionType`, `PayoutStatus`, `ReturnStatus` (14 states), `ReturnType`, `ReturnSellerAction`

### budolPay Schema (16 models, 8 enums)

**File:** `budolpay-0.1.0/packages/database/prisma/schema.prisma`

| Model | Purpose |
|-------|---------|
| `User` | Identity with KYC tiers, biometric keys, PIN, face template |
| `FavoriteRecipient` | Saved P2P transfer recipients |
| `VerificationDocument` | KYC document uploads with OCR data |
| `Session` | App-scoped sessions linked to EcosystemApp |
| `EcosystemApp` | Registered SSO applications with API keys |
| `Wallet` | User wallets (PHP currency, Decimal 18,2 precision) |
| `Transaction` | 6 types: CASH_IN, CASH_OUT, P2P, MERCHANT, REFUND, FEE |
| `Settlement` | Merchant settlement batches |
| `Dispute` | Transaction disputes |
| `AuditLog` | Financial audit trail |
| `ChangeRequest` | Maker/checker workflow for compliance |
| `SystemSetting` | Key-value configuration store |
| `RateLimit` | API rate limiting |

### budolID Schema (3 models, 3 enums)

**File:** `budolID-0.1.0/prisma/schema.prisma`

| Model | Purpose |
|-------|---------|
| `User` | Core identity (email, phone, password, KYC, OTP, biometrics) |
| `Session` | SSO sessions with app association |
| `EcosystemApp` | Registered applications (API key + secret + redirect URI) |

**Enums:** `UserRole` (6 roles), `KYCStatus`, `KYCTier`

### budolAccounting Schema (2 models, 1 enum)

**File:** `budolAccounting-0.1.0/prisma/schema.prisma`

| Model | Purpose |
|-------|---------|
| `ChartOfAccount` | Chart of accounts (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE) |
| `LedgerEntry` | Debit/credit entries with app and transaction tracking |

### budolloan Schema (2 models, 2 enums) -- Scaffolded, Not Integrated

**File:** `budolloan-0.1.0/prisma/schema.prisma`

| Model | Purpose |
|-------|---------|
| `Loan` | Loan records (PENDING, APPROVED, DISBURSED, REJECTED, COMPLETED, DEFAULTED) |
| `Repayment` | Repayment schedule (PENDING, PAID, OVERDUE) |

## Core Features

### Marketplace (budolshap)
- Multi-vendor storefronts with KYC verification
- Product management with SKU variations, tier pricing, and image uploads
- Shopping cart with real-time database sync
- Order management workflow (13 status states from ORDER_PLACED to COMPLETED)
- Coupon/discount system
- Return/refund workflow (14 states)
- Buyer-seller real-time chat
- Rating & reviews system
- Lalamove shipping integration with webhook tracking
- Marketing ads management
- CKEditor for rich product descriptions
- Background removal for product images

### Payments (budolpay)
- **COD** - Cash on Delivery
- **GCash** - Mobile wallet (via PayMongo)
- **Maya** (PayMaya) - Mobile wallet (via PayMongo)
- **GrabPay** - Grab ecosystem wallet (via PayMongo)
- **QRPh** - QR code standard payments
- **Stripe** - International payments
- **BudolPay Wallet** - Internal wallet payment
- Escrow system with 5% platform fee
- P2P transfers with compliance engine
- Cash-in/cash-out workflows
- Merchant settlement with dispute resolution
- Maker/checker workflow for compliance changes

### Mobile App (budolPayMobile)
- Cross-platform (Android, iOS, Web)
- Biometric authentication (fingerprint/face via local_auth)
- PIN-based authentication
- Face recognition via TFLite FaceNet model
- QR code scanning for payments
- Real-time push notifications via Pusher
- mDNS network device discovery
- Secure storage via flutter_secure_storage

### Seller Tools
- Store dashboard with analytics
- Order processing and status management
- Payout requests with bank details
- Product draft system with variation matrix
- KYC verification wizard (3 tiers)
- Coupon management
- Return management
- Real-time order notifications

### Buyer Features
- Multi-address management with Philippine address formatting
- Order tracking with real-time updates
- Return/refund requests
- Real-time chat with sellers
- Rating & reviews
- Favorites/wishlist
- SSO login across ecosystem

### Admin Dashboard (budolpay admin)
- User management with RBAC
- Store verification and KYC approval
- Order oversight and payment verification
- Financial reports and accounting ledger integration
- Security dashboard
- Audit log viewer with geolocation
- Marketing ads management
- System settings configuration
- Compliance monitoring
- Coupon management

### Identity & SSO (budolID)
- Centralized user management across all ecosystem apps
- OAuth2-style SSO flow with API key validation
- Phone number normalization (Philippine E.164 format)
- Cross-service user sync (budolID <-> budolPay <-> budolShap)
- Password reset with OTP verification
- Environment-aware redirect URI repair logic
- NPC Compliance: PII masking helper

### Accounting (budolAccounting)
- Double-entry accounting ledger
- Chart of accounts (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
- Transaction tracking with app and reference IDs
- Balance queries by account code

## API Endpoints

### budolShap API Routes (148+ endpoints)

**Authentication:** `/api/auth/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/sso/callback`, `/check-email`, `/check-phone`, `/me`, `/profile`, `/logout`, `/otp`

**Products & Catalog:** `/api/products`, `/api/products/[id]`, `/api/categories`

**Orders:** `/api/orders`, `/api/orders/[id]`, `/api/orders/[id]/status`, `/api/orders/[id]/cancel`, `/api/orders/[id]/return`

**Payment:** `/api/payment/checkout`, `/api/payment/gcash/create`, `/api/payment/cancel`, `/api/paymongo/create-intent`, `/api/paymongo/status`

**Shipping:** `/api/shipping/lalamove/quote`, `/api/shipping/lalamove/book`, `/api/shipping/lalamove/cancel`, `/api/shipping/lalamove/track`, `/api/shipping/lalamove/webhook`

**Store Management:** `/api/stores`, `/api/store/coupons`, `/api/store/payouts`, `/api/store/returns`, `/api/store/wallet`

**Admin:** `/api/admin/analytics`, `/api/admin/audit-logs`, `/api/admin/categories`, `/api/admin/kyc`, `/api/admin/orders`, `/api/admin/products`, `/api/admin/stores`, `/api/admin/users`, `/api/admin/returns`

**Cron Jobs:** `/api/cron/auto-complete-orders`, `/api/cron/cancel-unpaid-orders`, `/api/cron/returns-sweep`

**System:** `/api/system/settings`, `/api/system/geocode`, `/api/system/realtime`, `/api/system/error-tracking`

**Internal:** `/api/internal/auth/*`, `/api/internal/orders/*`, `/api/internal/payment/*`, `/api/internal/shipping/*`, `/api/internal/system/*`, `/api/internal/cache/*`

### budolPay Microservice Endpoints

**Auth Service** (8001): `/register`, `/login`, `/login/mobile/identify`, `/login/mobile/verify-pin`, `/login/mobile/setup-pin`, `/verify-otp`, `/resend-otp`, `/sso/login`, `/verify`, `/biometric/register-challenge`, `/biometric/login-verify`

**Wallet Service** (8002): `/balance/:userId`, `/update-balance`, `/process-qr`, `/config/:appId`

**Transaction Service** (8003): `/transfer`, `/cash-in`, `/cash-out`, `/resolve`, `/history/:userId`

**Settlement Service** (8007): `/settle/:merchantId`, `/history/:merchantId`, `/disputes/open`, `/disputes/:id/resolve`, `/reconciliation/summary`

**Verification Service** (8006): `/verify`, `/status/:userId`

**budolAccounting** (8005): `POST /ledger/entry`, `GET /balance/:accountCode`

**budolID SSO** (8000): `POST /auth/register`, `POST /auth/register/quick`, `POST /auth/sso/login`, `GET /auth/verify`, `GET /auth/check-email`, `GET /auth/check-phone`, `POST /auth/forgot-password`, `POST /auth/verify-otp`, `POST /auth/reset-password`

## Environment Variables

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."              # Direct connection for Prisma migrations
BUDOLID_DATABASE_URL="postgresql://..."    # Cross-service: budolID
BUDOLSHAP_DATABASE_URL="postgresql://..."  # Cross-service: budolShap
BUDOLACCOUNTING_DATABASE_URL="postgresql://..." # Cross-service: budolAccounting
BUDOLPAY_DATABASE_URL="postgresql://..."   # Cross-service: budolPay
PRISMA_DATABASE_URL="prisma+postgres://..." # Prisma Accelerate

# Authentication
JWT_SECRET="your-secret-key"

# Payment Gateways
PAYMONGO_PUBLIC_KEY="..."
PAYMONGO_SECRET_KEY="..."
STRIPE_SECRET_KEY="..."

# Shipping
LALAMOVE_CLIENT_ID="..."
LALAMOVE_CLIENT_SECRET="..."
LALAMOVE_ENV="sandbox|production"
LALAMOVE_WEBHOOK_SECRET="..."

# Cloud Storage
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Real-time
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="..."
WEBSOCKET_URL="http://localhost:4000"
INTERNAL_WS_URL="http://localhost:4000"

# Service URLs
NEXT_PUBLIC_SSO_URL="http://localhost:8000"
BUDOLACCOUNTING_URL="http://localhost:8005"
PAYMENT_GATEWAY_URL="http://localhost:8004"
AUTH_SERVICE_URL="http://localhost:8001"
WALLET_SERVICE_URL="http://localhost:8002"
TRANSACTION_SERVICE_URL="http://localhost:8003"
SETTLEMENT_SERVICE_URL="http://localhost:8007"
VERIFICATION_SERVICE_URL="http://localhost:8006"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD="..."

# Monitoring
SENTRY_DSN="..."
SENTRY_ENVIRONMENT="production"
SENTRY_TRACES_SAMPLE_RATE=0.1

# Maps
GEOAPIFY_API_KEY="..."
GOOGLE_MAPS_API_KEY="..."
RADAR_API_KEY="..."

# Email
BREVO_API_KEY="..."
SMTP_HOST="..."
SMTP_PORT=587
SMTP_USER="..."
SMTP_PASS="..."

# SMS
ZERIX_API_KEY="..."
ITEXTMO_API_KEY="..."
ITEXTMO_CLIENT_CODE="..."
BREVO_SMS_API_KEY="..."

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_CURRENCY_SYMBOL="₱"
NODE_ENV="development"
LOCAL_IP="192.168.1.x"
PORT=3000
```

## Deployment

### Vercel (Frontend)
```bash
cd budolshap-0.1.0
vercel deploy           # Development
vercel deploy --prod    # Production
```

### Docker (All Services)
```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d

# Local development (budolPay services)
cd budolpay-0.1.0
docker-compose up -d
```

### AWS ECS
```bash
# Build and push to ECR
./scripts/build-and-push.ps1

# Deploy to ECS cluster
./scripts/ecs-deploy-windows.ps1

# Verify deployment
./scripts/ecs-verify.sh
```

### Render (WebSocket)
The WebSocket server is configured for Render deployment via `websocket-server/render.yaml`.

## Development

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/budolEcosystem.git
cd budolEcosystem

# Install main app dependencies
cd budolshap-0.1.0
npm install

# Generate Prisma client
npx prisma generate

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and API keys

# Push schema to database
npx prisma db push

# Seed initial data
npx prisma db seed

# Run development server
npm run dev
```

### Running Microservices

```bash
# Start budolID SSO (port 8000)
cd budolID-0.1.0 && npm start

# Start API Gateway (port 8080)
cd budolpay-0.1.0/services/api-gateway && npm start

# Start Auth Service (port 8001)
cd budolpay-0.1.0/services/auth-service && npm start

# Start WebSocket Server (port 4000)
cd websocket-server && npm start

# Start Accounting Service (port 8005)
cd budolAccounting-0.1.0 && npm start
```

### Testing

```bash
# budolshap unit tests
cd budolshap-0.1.0 && npm test

# budolpay unit tests
cd budolpay-0.1.0 && npm test

# E2E verification scripts
node scripts/test_scripts/e2e-checkout-flow.mjs
node scripts/test_scripts/budolShap/v2/test-phase3.mjs
```

### Code Quality Tools

- **GitNexus** - Code intelligence (26K symbols indexed)
- **Graphify** - Knowledge graph generation
- **Prisma Studio** - Database visualization (`npx prisma studio`)
- **Sentry** - Error tracking
- **Prometheus + Grafana** - Metrics collection
- **ESLint 9** - Linting
- **Jest 30** - Unit testing

## Known Issues

See [ISSUES.md](ISSUES.md) for a comprehensive list of discovered issues including security vulnerabilities, code quality problems, and architectural concerns.

**Summary:** 5 Critical, 9 High, 8 Medium, 4 Low + 10 Code Quality issues identified during codebase review (2026-06-02).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Run `npx gitnexus analyze` before making changes to understand code relationships
- Run impact analysis before modifying shared code
- Run `gitnexus_detect_changes()` before committing
- Follow existing code patterns and conventions

## License

Proprietary - All rights reserved.

## Support

For support, email support@budolpay.com or create an issue in the repository.

---

*This README was last updated on 2026-06-02 based on a comprehensive codebase audit using GitNexus code intelligence (26,266 symbols, 35,895 relationships, 300 execution flows).*
