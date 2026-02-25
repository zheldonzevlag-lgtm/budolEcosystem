# Backend Setup Guide for BudolShap

This guide will help you set up the backend for BudolShap using MySQL and WAMP.

## Prerequisites

1. WAMP Server installed and running
2. Node.js and npm installed
3. MySQL database created

## Database Setup

1. **Create MySQL Database:**
   - Open phpMyAdmin (usually at http://localhost/phpmyadmin)
   - Create a new database named `budolshap`
   - Or use MySQL command line:
     ```sql
     CREATE DATABASE budolshap;
     ```

2. **Configure Database Connection:**
   - Copy `.env.example` to `.env` in the root directory
   - Update the `DATABASE_URL` in `.env`:
     ```
     DATABASE_URL="mysql://root:@localhost:3306/budolshap"
     ```
     - Replace `root` with your MySQL username if different
     - Add password if your MySQL user has one: `mysql://username:password@localhost:3306/budolshap`

## Installation Steps

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Run Database Migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```
   This will create all the necessary tables in your MySQL database.

4. **Start Development Server:**
   ```bash
   npm run dev
   ```

## API Endpoints

### Products
- `GET /api/products` - Get all products (query params: category, search, storeId, limit)
- `GET /api/products/[productId]` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/[productId]` - Update product
- `DELETE /api/products/[productId]` - Delete product

### Stores
- `GET /api/stores` - Get all stores (query params: status, isActive, username)
- `GET /api/stores/[storeId]` - Get single store
- `GET /api/stores/user/[userId]` - Get store by user ID
- `POST /api/stores` - Create store
- `PUT /api/stores/[storeId]` - Update store
- `PUT /api/stores/[storeId]/approve` - Approve/activate store

### Orders
- `GET /api/orders` - Get all orders (query params: userId, storeId, status)
- `GET /api/orders/[orderId]` - Get single order
- `POST /api/orders` - Create order
- `PUT /api/orders/[orderId]` - Update order status

### Addresses
- `GET /api/addresses?userId=xxx` - Get user addresses
- `GET /api/addresses/[addressId]` - Get single address
- `POST /api/addresses` - Create address
- `PUT /api/addresses/[addressId]` - Update address
- `DELETE /api/addresses/[addressId]` - Delete address

### Ratings
- `GET /api/ratings` - Get all ratings (query params: productId, userId, orderId)
- `POST /api/ratings` - Create rating

### Coupons
- `GET /api/coupons` - Get all coupons (query params: code, isPublic, forNewUser)
- `GET /api/coupons/[code]` - Get single coupon
- `POST /api/coupons` - Create coupon
- `POST /api/coupons/validate` - Validate coupon code
- `PUT /api/coupons/[code]` - Update coupon
- `DELETE /api/coupons/[code]` - Delete coupon

### Cart
- `GET /api/cart?userId=xxx` - Get user cart
- `PUT /api/cart` - Update user cart

### Dashboard
- `GET /api/dashboard/store?storeId=xxx` - Get store dashboard data
- `GET /api/dashboard/admin` - Get admin dashboard data

### Users
- `GET /api/users?id=xxx` or `?email=xxx` - Get user
- `POST /api/users` - Create user
- `PUT /api/users` - Update user

## Database Schema

The database includes the following models:
- **User** - User accounts
- **Store** - Store information
- **Product** - Product listings
- **Order** - Customer orders
- **OrderItem** - Items in an order
- **Address** - Shipping addresses
- **Rating** - Product ratings and reviews
- **Coupon** - Discount coupons

## Notes

- All API routes return JSON responses
- Error responses include an `error` field with the error message
- Success responses include the requested data
- The cart is stored as JSON in the User model
- Orders automatically clear the user's cart upon creation
- Store approval is handled through the `/api/stores/[storeId]/approve` endpoint

## Troubleshooting

1. **Connection Error:**
   - Ensure WAMP MySQL service is running
   - Check database credentials in `.env`
   - Verify database exists

2. **Prisma Errors:**
   - Run `npx prisma generate` again
   - Check Prisma schema syntax
   - Ensure MySQL is compatible with Prisma

3. **Migration Issues:**
   - Drop and recreate database if needed
   - Check for existing tables that might conflict

