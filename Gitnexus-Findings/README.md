# budolEcosystem

A comprehensive fintech e-commerce ecosystem built for the Philippine market. This monorepo contains all services, applications, and infrastructure for the budolPay platform.

**Last Codebase Audit:** 2026-06-02 | **GitNexus Index:** 26,266 symbols, 35,895 relationships, 300 execution flows

---

## Architecture Overview

```
budolEcosystem/
├── budolshap-0.1.0/          # Next.js 14 web application (marketplace + admin)
├── budolpay-0.1.0/           # Payment microservices (Express.js)
│   ├── apps/admin/           # Admin dashboard (Next.js)
│   ├── services/
│   │   ├── api-gateway/      # Central API gateway with Socket.io
│   │   ├── auth-service/     # Authentication & OTP
│   │   ├── wallet-service/   # Wallet management
│   │   ├── transaction-service/ # Transaction processing
│   │   ├── settlement-service/  # Settlement & payouts
│   │   ├── payment-gateway-service/ # External payment integrations
│   │   └── verification-service/ # KYC verification
│   └── packages/             # Shared packages (database, audit, notifications, security)
├── budolPayMobile/           # Flutter mobile app (Android/iOS/Web)
├── budolID-0.1.0/            # Identity & SSO service
├── budolAccounting-0.1.0/    # Double-entry accounting ledger
├── budolloan-0.1.0/          # Loan service (scaffolded)
├── websocket-server/         # Socket.io real-time server
├── scripts/                  # Deployment, backup, and test scripts
├── documentation/            # Project documentation (HTML docs)
└── graphify-out/             # Knowledge graph output
```

## The Budol Ecosystem Map

| Service | Role | Port | Tech |
|---------|------|------|------|
| **budolID-0.1.0** | Central Identity & SSO | 8002 | Express.js, Prisma |
| **budolshap-0.1.0** | E-commerce marketplace | 3000 | Next.js 14 (App Router) |
| **budolpay-0.1.0** | Fintech microservices | 8080 (gateway) | Express.js, Next.js admin |
| **budolAccounting-0.1.0** | Double-entry ledger | 8005 | Express.js, Prisma |
| **budolPayMobile** | Mobile app | - | Flutter (Dart) |
| **websocket-server** | Real-time events | 4000 | Socket.io |

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS |
| **Mobile** | Flutter 3.x (Dart) |
| **Backend** | Node.js 18+, Express.js |
| **Database** | PostgreSQL (Neon / Vercel Postgres) |
| **ORM** | Prisma (with Accelerate connection pooling) |
| **Real-time** | Socket.io, Pusher |
| **Auth** | JWT (HS256), bcrypt (12 rounds), OTP (SMS via Zerix, Email via Brevo) |
| **Payments** | PayMongo, GCash, Maya, GrabPay, QRPh, BudolPay (internal) |
| **Shipping** | Lalamove API |
| **Storage** | Cloudinary (images) |
| **Deployment** | Vercel (frontend), AWS ECS (services), Docker |
| **Monitoring** | Sentry, Prometheus |
| **CI/CD** | GitHub Actions (Vercel auto-deploy) |

## Codebase Statistics

| Metric | Count |
|--------|-------|
| **API Routes (budolshap)** | 148 endpoints |
| **React Components** | 90+ components |
| **Flutter Dart Files** | 44 files |
| **Microservices** | 7 services |
| **Test Scripts** | 1,041 test/verification scripts |
| **GitNexus Symbols** | 26,266 indexed |
| **Execution Flows** | 300 traced |

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Neon serverless)
- Flutter SDK 3.x (for mobile app)
- npm or yarn

### Installation

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

# Run development server
npm run dev
```

### Database Setup

```bash
cd budolshap-0.1.0

# Push schema to database (development)
npx prisma db push

# Seed initial data
npx prisma db seed

# Open Prisma Studio (visual database explorer)
npx prisma studio
```

### Running Microservices

```bash
# Start API Gateway (port 8080)
cd budolpay-0.1.0/services/api-gateway
npm start

# Start Auth Service (port 8001)
cd budolpay-0.1.0/services/auth-service
npm start

# Start WebSocket Server (port 4000)
cd websocket-server
npm start

# Start budolID SSO (port 8002)
cd budolID-0.1.0
npm start

# Start Accounting Service (port 8005)
cd budolAccounting-0.1.0
npm start
```

## Core Features

### Marketplace (budolshap)
- Multi-vendor storefronts with seller verification
- Product management with SKU variations and image uploads
- Shopping cart with real-time sync via Pusher/Socket.io
- Order management workflow (pending -> confirmed -> shipped -> delivered)
- Coupon/discount system
- Category management with icons
- Marketing ads system

### Payments (budolpay)
- **COD** - Cash on Delivery
- **GCASH** - Mobile wallet (via PayMongo)
- **Maya** (PayMaya) - via PayMongo
- **GrabPay** - via PayMongo
- **QRPh** - QR code payments
- **BudolPay** - Internal payment gateway
- Escrow system with 5% platform fee
- P2P wallet transfers
- Settlement & payout processing

### Seller Tools
- Store dashboard with analytics
- Order processing and status management
- Payout requests with bank details
- Product draft system
- KYC verification wizard
- Real-time order notifications

### Buyer Features
- Multi-address management with Philippine address formatting
- Order tracking with real-time updates
- Return/refund requests
- Real-time chat with sellers
- Rating & reviews
- Favorites/wishlist
- SSO login via budolID

### Admin Dashboard (budolpay admin)
- User management with RBAC
- Store verification workflow
- Order oversight and payment verification
- Financial reports and accounting ledger
- KYC review system
- Coupon management
- Marketing ads management
- Security dashboard
- System settings
- Audit logs

### Identity & SSO (budolID)
- Centralized user management across all ecosystem apps
- OAuth2-style SSO flow with API key validation
- Phone number normalization (Philippine E.164 format)
- Cross-service user sync (budolID <-> budolPay <-> budolShap)
- Password reset with OTP verification

### Mobile App (budolPayMobile)
- Cross-platform (Android, iOS, Web)
- Biometric authentication (fingerprint/face)
- QR code scanner for payments
- Push notifications via Pusher
- Wallet management
- Transaction history
- Face embedding service for KYC

## Authentication & Authorization Flow

### SSO Flow (budolID as Identity Provider)

```
User/App                budolID                 Target Service
   |                       |                          |
   |--- POST /auth/sso/login -->|                      |
   |    (apiKey + creds)        |                      |
   |                       |-- validate creds         |
   |                       |-- generate JWT           |
   |<-- { token, session } --|                         |
   |                       |                          |
   |--- Authorization: Bearer <jwt> ---------------->|
   |                       |                          |
   |                       |<-- GET /auth/verify -----|
   |                       |    (validate JWT)        |
   |                       |--- { valid, user } ----->|
   |<-- protected resource ----------------------------|
```

- **budolID** (port 8002) is the central identity provider
- All ecosystem apps register with budolID using API keys (`bp_key_2025`, `bs_key_2025`, etc.)
- JWT tokens are signed with HS256 and include: `sub`, `email`, `firstName`, `lastName`, `role`, `phoneNumber`, `iss: 'budolID'`
- Tokens expire after 7 days (web) or 30 days (mobile)
- Cross-service user sync: budolID syncs user records to budolPay database on registration

### Mobile Auth Flow (Multi-Phase)

1. **Identify** - Phone number lookup, device trust check, OTP trigger
2. **Verify OTP** - OTP validation, device trust update
3. **PIN Setup** - 6-digit PIN creation for trusted devices
4. **Biometric** - Optional fingerprint/face via WebAuthn-style challenge

### RBAC (Role-Based Access Control)

| Role | Permissions |
|------|-------------|
| `ADMIN` | Full system access |
| `MANAGER` | User management, reports, settings |
| `MERCHANT` | Store management, payouts |
| `USER` | Standard buyer operations |
| `STAFF` | Limited admin operations |
| `DRIVER` | Delivery operations |

### Security Features

- bcrypt with 12 salt rounds (BSP/PCI DSS compliance)
- Password complexity: 8+ chars, uppercase, lowercase, number, special char
- PII masking in logs via `maskPII()` helper
- OTP rate limiting (60-second cooldown)
- Device trust management via `trustedDevices` JSON field

## Database Schema

Key models (PostgreSQL via Prisma):

| Schema | Models | Notes |
|--------|--------|-------|
| **public** (budolshap) | Product, Store, Order, OrderItem, Cart, CartItem, Category, Coupon, Return, Review, Rating, Chat, Message, Address, StoreAddress, Wallet, Transaction, PayoutRequest, PaymentProof, WebhookEvent, SystemSettings, RateLimit, VerificationCode, AuditLog | 24 models, e-commerce marketplace |
| **budolid** | User, Session, EcosystemApp | 3 models, identity & SSO |
| **budolpay** | User, Wallet, Transaction, Settlement, Dispute, AuditLog, ChartOfAccount, LedgerEntry, Session, EcosystemApp, FavoriteRecipient, VerificationDocument, ChangeRequest, SystemSetting, RateLimit | 16 models, fintech services |
| **budolaccounting** | ChartOfAccount, LedgerEntry | 2 models, double-entry accounting (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE) |
| **budolloan** | Loan, Repayment | 2 models, loan management (scaffolded, not yet integrated) |

## API Endpoints

### Authentication (budolshap)
- `POST /api/auth/login` - Email/phone + password login
- `POST /api/auth/register` - New user registration
- `POST /api/auth/forgot-password` - Password reset
- `POST /api/auth/verify-otp` - OTP verification
- `GET /api/auth/me` - Current user profile
- `GET /api/auth/sso/callback` - SSO callback handler

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product (seller)
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - List orders
- `PUT /api/orders/[id]/status` - Update order status

### Payments
- `POST /api/payment/checkout` - Initialize checkout
- `POST /api/payment/cancel` - Cancel payment
- `POST /api/webhooks/budolpay` - BudolPay webhook
- `POST /api/webhooks/paymongo` - PayMongo webhook

### Admin
- `GET/POST /api/admin/users` - User management
- `GET/POST /api/admin/stores` - Store management
- `GET/POST /api/admin/orders` - Order oversight
- `GET/POST /api/admin/products` - Product management
- `GET/POST /api/admin/coupons` - Coupon management
- `GET/POST /api/admin/kyc` - KYC review

### budolPay Microservices
- `POST /api/auth/login` - Auth service login
- `GET/POST /api/wallet/*` - Wallet operations
- `GET/POST /api/transactions/*` - Transaction management
- `POST /api/transactions/transfer` - P2P transfers
- `GET/POST /api/settlements/*` - Settlement operations
- `GET/POST /api/verification/*` - KYC verification

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
BUDOLPAY_DATABASE_URL="postgresql://..."

# Authentication
JWT_SECRET="your-secret-key"

# Payment Gateways
PAYMONGO_PUBLIC_KEY="..."
PAYMONGO_SECRET_KEY="..."
LALAMOVE_CLIENT_ID="..."
LALAMOVE_CLIENT_SECRET="..."

# Cloud Storage
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Real-time
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
WEBSOCKET_URL="http://localhost:4000"

# External Services
BUDOLACCOUNTING_URL="http://localhost:8005"
BUDOLID_URL="http://localhost:8002"
INTERNAL_WS_URL="http://localhost:4000"

# Email
BREVO_API_KEY="..."
NOTIFICATION_EMAIL_FROM="..."
```

## Deployment

### Vercel (Frontend)
```bash
cd budolshap-0.1.0
vercel deploy
```

### Docker
```bash
# Build and run all services
docker-compose up -d
```

### AWS ECS
```bash
# Deploy to ECS cluster
./scripts/ecs-deploy-windows.ps1
```

## Development

### Code Structure

```
budolshap-0.1.0/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (148 endpoints)
│   ├── admin/             # Admin dashboard pages
│   ├── store/             # Seller storefront pages
│   ├── (public)/          # Public pages (login, register, etc.)
│   └── payment/           # Payment flow pages
├── components/            # React components (90+)
│   ├── auth/              # Authentication components
│   ├── store/             # Store management components
│   ├── address/           # Address management
│   └── ...                # Feature-specific components
├── lib/                   # Utility functions & services
│   ├── auth.js           # Authentication helpers
│   ├── escrow.js         # Escrow/fund management
│   ├── prisma.js         # Database client
│   ├── payment/          # Payment adapters
│   ├── services/         # Business logic services
│   └── utils/            # Utility functions
├── prisma/               # Database schema
├── scripts/              # Build and test scripts
└── __tests__/            # Unit tests
```

### Testing

```bash
# Run unit tests
npm test

# Run specific test suite
npm test -- --grep "auth"

# Run verification scripts
node scripts/test_scripts/e2e-checkout-flow.mjs
```

### Code Quality Tools

- **GitNexus** - Code intelligence (26K symbols indexed)
- **Graphify** - Knowledge graph generation
- **Prisma Studio** - Database visualization
- **Sentry** - Error tracking
- **Prometheus** - Metrics collection

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Run `npx gitnexus analyze` before making changes to understand code relationships
- Run impact analysis before modifying shared code: `gitnexus_impact({target: "symbolName", direction: "upstream"})`
- Run `gitnexus_detect_changes()` before committing
- Follow existing code patterns and conventions
- Test all changes against the verification scripts

## Known Issues

See [issues.md](issues.md) for a comprehensive list of discovered issues, security findings, and technical debt.

**Summary:**
- **Critical:** 5 issues (exposed secrets, hardcoded credentials)
- **High:** 9 issues (XSS, unauthenticated endpoints, CORS)
- **Medium:** 8 issues (rate limiting, weak JWT, logging)
- **Low:** 4 issues (weak defaults, debug scripts)

## License

Proprietary - All rights reserved.

## Support

For support, email support@budolpay.com or create an issue in the repository.

---

*This README was last updated on 2026-06-02 based on a comprehensive codebase audit using GitNexus code intelligence.*
