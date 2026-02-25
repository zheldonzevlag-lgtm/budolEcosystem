# BudolShap - Multi-Vendor E-Commerce Platform

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Frontend Pages](#frontend-pages)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [User Roles](#user-roles)
- [Workflows](#workflows)
- [Security](#security)

---

## Overview

BudolShap is a comprehensive multi-vendor e-commerce platform built with Next.js, allowing multiple sellers to create stores, manage products, and process orders while buyers can shop across different stores in a single checkout experience.

### Key Capabilities
- **Multi-Vendor Support**: Multiple sellers with individual stores
- **Unified Checkout**: Buy from multiple stores in one transaction
- **Wallet System**: Seller earnings management with payout requests
- **Commission Model**: 10% platform commission on all sales
- **Returns & Refunds**: Complete return request workflow
- **Real-time Chat**: Buyer-seller communication
- **Email Notifications**: Order updates and notifications
- **Admin Dashboard**: Platform management and analytics

---

## Features

### Phase 1: Foundation
- ✅ Multi-store checkout system
- ✅ Wallet system for sellers
- ✅ Commission deduction (10%)
- ✅ Transaction tracking

### Phase 2: Seller Empowerment
- ✅ Shipping profile management
- ✅ Coupon creation and management
- ✅ Financial dashboard
- ✅ Payout request system

### Phase 3: Customer Experience
- ✅ Returns & refunds workflow
- ✅ Real-time chat between buyers and sellers
- ✅ Email notifications (order placed, shipped, delivered)
- ✅ Return request notifications

### Phase 4: Admin & Polish
- ✅ Admin dashboard
- ✅ Payout approval system
- ✅ Store verification/KYC
- ✅ Platform analytics

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Vanilla CSS
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **State Management**: React Hooks

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Database**: MySQL (via Prisma ORM)
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer

### Database
- **ORM**: Prisma
- **Database**: MySQL
- **Migrations**: Prisma Migrate

---

## Database Schema

### Core Models

#### User
```prisma
model User {
  id               String      @id
  name             String
  email            String      @unique
  password         String
  image            String      @db.LongText
  cart             Json        @default("{}")
  accountType      AccountType @default(BUYER)
  emailVerified    Boolean     @default(false)
  isAdmin          Boolean     @default(false)
  emailVerifyToken String?
  resetToken       String?
  resetTokenExpiry DateTime?
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  
  // Relations
  orders       Order[]
  store        Store?
  buyerChats   Chat[]    @relation("BuyerChats")
  sellerChats  Chat[]    @relation("SellerChats")
  messages     Message[]
}
```

#### Store
```prisma
model Store {
  id                 String             @id @default(cuid())
  userId             String             @unique
  name               String
  description        String
  username           String             @unique
  address            String
  status             String             @default("pending")
  isActive           Boolean            @default(false)
  logo               String             @db.LongText
  email              String
  contact            String
  kycDocuments       Json?              @default("[]")
  verificationStatus VerificationStatus @default(PENDING)
  verificationNotes  String?
  shippingProfile    Json?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
  
  // Relations
  Product Product[]
  Order   Order[]
  user    User      @relation(fields: [userId], references: [id])
  wallet  Wallet?
  chats   Chat[]
}
```

#### Product
```prisma
model Product {
  id          String   @id @default(cuid())
  storeId     String
  name        String
  description String   @db.Text
  price       Float
  category    String
  subCategory String
  sizes       Json
  bestseller  Boolean  @default(false)
  images      Json
  date        DateTime @default(now())
  
  // Relations
  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)
}
```

#### Order
```prisma
model Order {
  orderId      String      @id @default(cuid())
  userId       String
  storeId      String
  items        Json
  amount       Float
  address      Json
  status       OrderStatus @default(ORDER_PLACED)
  paymentMethod String     @default("COD")
  payment      Boolean     @default(false)
  date         DateTime    @default(now())
  shippingCost Float       @default(0)
  discount     Float       @default(0)
  total        Float
  
  // Relations
  user    User     @relation(fields: [userId], references: [id])
  store   Store    @relation(fields: [storeId], references: [id])
  returns Return[]
}
```

#### Wallet
```prisma
model Wallet {
  id        String   @id @default(cuid())
  storeId   String   @unique
  balance   Float    @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  store            Store            @relation(fields: [storeId], references: [id], onDelete: Cascade)
  transactions     Transaction[]
  payoutRequests   PayoutRequest[]
}
```

#### Return
```prisma
model Return {
  id        String       @id @default(cuid())
  orderId   String
  reason    String
  images    Json         @default("[]")
  status    ReturnStatus @default(PENDING)
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  
  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
}
```

#### Chat & Message
```prisma
model Chat {
  id        String    @id @default(cuid())
  buyerId   String
  sellerId  String
  storeId   String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  messages  Message[]
  
  buyer  User  @relation("BuyerChats", fields: [buyerId], references: [id], onDelete: Cascade)
  seller User  @relation("SellerChats", fields: [sellerId], references: [id], onDelete: Cascade)
  store  Store @relation(fields: [storeId], references: [id], onDelete: Cascade)
  
  @@unique([buyerId, storeId])
}

model Message {
  id        String   @id @default(cuid())
  chatId    String
  senderId  String
  content   String   @db.Text
  createdAt DateTime @default(now())
  
  chat   Chat @relation(fields: [chatId], references: [id], onDelete: Cascade)
  sender User @relation(fields: [senderId], references: [id], onDelete: Cascade)
}
```

### Enums

```prisma
enum AccountType {
  BUYER
  SELLER
}

enum OrderStatus {
  ORDER_PLACED
  PROCESSING
  SHIPPED
  DELIVERED
  RETURN_REQUESTED
  RETURN_APPROVED
  REFUNDED
}

enum ReturnStatus {
  PENDING
  APPROVED
  REJECTED
}

enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
}

enum PayoutStatus {
  PENDING
  APPROVED
  REJECTED
}
```

---

## API Documentation

### Authentication

#### POST `/api/register`
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully"
}
```

#### POST `/api/login`
Login user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { "id": "...", "name": "John Doe", "email": "..." }
}
```

---

### Products

#### GET `/api/products`
Get all products with optional filters.

**Query Parameters:**
- `storeId` - Filter by store
- `category` - Filter by category
- `search` - Search by name

#### POST `/api/products`
Create a new product (seller only).

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "category": "Electronics",
  "subCategory": "Phones",
  "sizes": ["S", "M", "L"],
  "images": ["base64..."],
  "bestseller": false
}
```

---

### Orders

#### POST `/api/orders`
Create new order(s) from cart.

**Request Body:**
```json
{
  "items": [
    {
      "storeId": "store123",
      "products": [
        { "productId": "prod1", "quantity": 2, "size": "M" }
      ]
    }
  ],
  "address": {
    "firstName": "John",
    "lastName": "Doe",
    "street": "123 Main St",
    "city": "Manila",
    "state": "NCR",
    "zipcode": "1000",
    "country": "Philippines",
    "phone": "09123456789"
  },
  "paymentMethod": "COD"
}
```

#### GET `/api/orders`
Get user's orders.

#### PUT `/api/orders/[id]/status`
Update order status (seller only).

**Request Body:**
```json
{
  "status": "SHIPPED"
}
```

---

### Wallet & Payouts

#### GET `/api/wallet`
Get seller's wallet balance and transactions.

#### POST `/api/wallet/payout`
Request a payout (seller only).

**Request Body:**
```json
{
  "amount": 1000
}
```

---

### Returns

#### POST `/api/returns`
Create a return request (buyer only).

**Request Body:**
```json
{
  "orderId": "order123",
  "reason": "Product defective",
  "images": ["base64..."]
}
```

#### GET `/api/returns`
Get return requests.

**Query Parameters:**
- `userId` - Filter by user
- `storeId` - Filter by store

#### PUT `/api/returns/[id]`
Update return status (seller only).

**Request Body:**
```json
{
  "status": "APPROVED"
}
```

---

### Chat

#### GET `/api/chats`
Get user's chats.

#### POST `/api/chats`
Create a new chat.

**Request Body:**
```json
{
  "storeId": "store123"
}
```

#### GET `/api/chats/[id]/messages`
Get messages for a chat.

#### POST `/api/chats/[id]/messages`
Send a message.

**Request Body:**
```json
{
  "content": "Hello, I have a question about this product."
}
```

---

### Admin Routes

All admin routes require `isAdmin: true` in user record.

#### GET `/api/admin/analytics`
Get platform-wide analytics.

**Response:**
```json
{
  "overview": {
    "totalGMV": 50000,
    "totalCommission": 5000,
    "totalOrders": 150,
    "totalUsers": 500,
    "totalStores": 25,
    "activeStores": 20
  },
  "users": { "total": 500, "buyers": 475, "sellers": 25 },
  "stores": { "total": 25, "active": 20, "pendingVerification": 5 },
  "payouts": { "pending": 10, "pendingAmount": 15000 },
  "orders": {
    "byStatus": [...],
    "last30Days": 45,
    "last30DaysGMV": 12000
  }
}
```

#### GET `/api/admin/payouts`
Get all payout requests.

**Query Parameters:**
- `status` - Filter by status (PENDING, APPROVED, REJECTED)

#### PUT `/api/admin/payouts`
Approve/reject payout.

**Request Body:**
```json
{
  "payoutId": "payout123",
  "status": "APPROVED"
}
```

#### GET `/api/admin/stores`
Get all stores.

**Query Parameters:**
- `verificationStatus` - Filter by verification status

#### PUT `/api/admin/stores/[id]/verify`
Verify a store.

**Request Body:**
```json
{
  "verificationStatus": "APPROVED",
  "verificationNotes": "All documents verified"
}
```

---

## Frontend Pages

### Public Pages

- `/` - Home page
- `/collection` - Product listing
- `/product/[id]` - Product details
- `/cart` - Shopping cart
- `/place-order` - Checkout
- `/orders` - User's orders
- `/chat` - Buyer chat interface
- `/login` - Login page
- `/register` - Registration page

### Seller Dashboard (`/store/*`)

- `/store` - Dashboard overview
- `/store/add-product` - Add new product
- `/store/manage-product` - Manage products
- `/store/orders` - Store orders
- `/store/shipping` - Shipping profile
- `/store/coupons` - Coupon management
- `/store/wallet` - Wallet & financials
- `/store/returns` - Return requests
- `/store/chat` - Seller chat interface
- `/store/settings` - Store settings

### Admin Dashboard (`/admin/*`)

- `/admin` - Admin dashboard
- `/admin/users` - User management
- `/admin/products` - Product management
- `/admin/orders` - Order management
- `/admin/stores` - Store management
- `/admin/approve` - Store approval
- `/admin/payouts` - Payout management
- `/admin/analytics` - Platform analytics
- `/admin/coupons` - Platform coupons

---

## Setup & Installation

### Prerequisites
- Node.js 18+ 
- MySQL database
- npm or yarn

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd budolshap
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
Create a `.env` file in the root directory (see [Environment Variables](#environment-variables))

4. **Setup database**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Run development server**
```bash
npm run dev
```

6. **Access the application**
Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/budolshap"

# JWT Secret
JWT_SECRET="your-secret-key-here"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# SMTP Configuration (for email notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@budolshap.com"

# Cloudinary (if using for image uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

---

## User Roles

### Buyer
- Browse products across all stores
- Add products to cart
- Checkout with multiple stores
- Track orders
- Request returns
- Chat with sellers
- Manage profile

### Seller
- Create and manage store
- Add/edit/delete products
- Manage orders
- Set shipping profiles
- Create coupons
- View wallet balance
- Request payouts
- Handle return requests
- Chat with buyers

### Admin
- View platform analytics
- Manage all users
- Manage all stores
- Approve/reject store verification
- Approve/reject payout requests
- View all orders
- Platform-wide oversight

---

## Workflows

### Multi-Store Checkout Flow

1. Buyer adds products from multiple stores to cart
2. Cart is organized by store
3. At checkout, system creates separate orders for each store
4. Each order calculates:
   - Product total
   - Store's shipping cost
   - Coupon discount (if applicable)
   - Final total
5. Platform deducts 10% commission from product total
6. Remaining amount credited to seller's wallet
7. Email notifications sent to buyer and sellers

### Payout Flow

1. Seller requests payout from wallet
2. Payout request created with PENDING status
3. Admin reviews payout request
4. Admin approves/rejects payout
5. If approved, seller receives payment (external process)
6. Payout status updated

### Return & Refund Flow

1. Buyer requests return with reason and images
2. Order status updated to RETURN_REQUESTED
3. Seller receives email notification
4. Seller reviews return request
5. Seller approves/rejects return
6. If approved:
   - Order status updated to REFUNDED
   - Refund amount deducted from seller's wallet
   - Transaction recorded
7. Buyer notified of decision

### Chat Flow

1. Buyer initiates chat with store
2. Chat record created (or existing chat retrieved)
3. Messages exchanged in real-time (polling every 3 seconds)
4. Both parties can view message history
5. Chat updates timestamp on new messages

---

## Security

### Authentication
- JWT tokens stored in HTTP-only cookies
- Tokens expire after 7 days
- Password hashing with bcrypt

### Authorization
- Route-level protection via middleware
- API routes verify user authentication
- Ownership checks for sensitive operations
- Admin routes require `isAdmin: true`

### Data Validation
- Input validation on all API routes
- Prisma schema constraints
- Client-side validation

### Best Practices
- Environment variables for secrets
- SQL injection prevention via Prisma
- XSS prevention via React
- CSRF protection via same-site cookies

---

## Commission Model

The platform operates on a **10% commission model**:

- Platform takes 10% of product total (excluding shipping)
- Seller receives 90% of product total
- Shipping cost goes 100% to seller
- Commission calculated per order
- Deducted automatically during order creation

**Example:**
- Product Total: ₱1,000
- Shipping: ₱100
- Platform Commission: ₱100 (10% of ₱1,000)
- Seller Receives: ₱900 + ₱100 = ₱1,000

---

## Email Notifications

### Automated Emails

1. **Order Placed**
   - Sent to: Buyer and Seller
   - Trigger: Order creation
   - Contains: Order details, items, total

2. **Order Shipped**
   - Sent to: Buyer
   - Trigger: Order status updated to SHIPPED
   - Contains: Tracking info, expected delivery

3. **Order Delivered**
   - Sent to: Buyer
   - Trigger: Order status updated to DELIVERED
   - Contains: Delivery confirmation

4. **Return Request**
   - Sent to: Seller
   - Trigger: Buyer requests return
   - Contains: Return reason, order details

### Email Configuration

Emails require SMTP configuration in `.env`. If not configured, emails are logged to console instead.

---

## Future Enhancements

### Recommended Features

1. **Payment Gateway Integration**
   - PayPal, Stripe, PayMaya
   - Online payment processing
   - Automatic payout disbursement

2. **Real-time Chat with WebSockets**
   - Replace polling with Socket.io
   - Instant message delivery
   - Typing indicators

3. **Advanced Analytics**
   - Charts and graphs
   - Revenue trends
   - Top products/stores
   - Customer insights

4. **Mobile App**
   - React Native app
   - Push notifications
   - Mobile-optimized experience

5. **Product Reviews & Ratings**
   - Customer reviews
   - Star ratings
   - Review moderation

6. **Inventory Management**
   - Stock tracking
   - Low stock alerts
   - Automatic stock updates

7. **Advanced Search**
   - Elasticsearch integration
   - Faceted search
   - Search suggestions

8. **Multi-language Support**
   - i18n implementation
   - Multiple currencies
   - Regional settings

---

## Support & Maintenance

### Database Migrations

When schema changes:
```bash
npx prisma migrate dev --name description_of_change
npx prisma generate
```

### Prisma Studio

View/edit database:
```bash
npx prisma studio
```

### Creating Admin User

```sql
UPDATE User SET isAdmin = true WHERE email = 'admin@example.com';
```

Or use Prisma Studio to toggle the `isAdmin` field.

---

## License

[Your License Here]

## Contributors

[Your Team/Contributors Here]

---

**Built with ❤️ using Next.js, Prisma, and MySQL**
