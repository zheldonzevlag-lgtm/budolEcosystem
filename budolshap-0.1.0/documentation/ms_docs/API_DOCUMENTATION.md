# BudolShap API Documentation

## Base URL
All API endpoints are prefixed with `/api`

## Authentication
Currently, the API does not include authentication middleware. You should implement authentication based on your requirements (e.g., NextAuth, JWT tokens).

## Response Format

### Success Response
```json
{
  "id": "...",
  "name": "...",
  ...
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

## Endpoints

### Products

#### Get All Products
```
GET /api/products
```

**Query Parameters:**
- `category` (string, optional) - Filter by category
- `search` (string, optional) - Search in name and description
- `storeId` (string, optional) - Filter by store ID
- `limit` (number, optional) - Limit number of results

**Response:** Array of products with store and ratings

#### Get Single Product
```
GET /api/products/[productId]
```

**Response:** Product object with store, ratings, and reviews

#### Create Product
```
POST /api/products
```

**Body:**
```json
{
  "name": "Product Name",
  "description": "Product Description",
  "mrp": 100.00,
  "price": 80.00,
  "images": ["url1", "url2"],
  "category": "Electronics",
  "storeId": "store_id"
}
```

#### Update Product
```
PUT /api/products/[productId]
```

**Body:** (All fields optional)
```json
{
  "name": "Updated Name",
  "price": 75.00,
  "inStock": true
}
```

#### Delete Product
```
DELETE /api/products/[productId]
```

---

### Stores

#### Get All Stores
```
GET /api/stores
```

**Query Parameters:**
- `status` (string, optional) - Filter by status (e.g., "pending", "approved")
- `isActive` (boolean, optional) - Filter by active status
- `username` (string, optional) - Get store by username

#### Get Single Store
```
GET /api/stores/[storeId]
```

#### Get Store by User ID
```
GET /api/stores/user/[userId]
```

#### Create Store
```
POST /api/stores
```

**Body:**
```json
{
  "userId": "user_id",
  "name": "Store Name",
  "username": "store_username",
  "email": "store@example.com",
  "contact": "1234567890",
  "description": "Store Description",
  "address": "Store Address",
  "logo": "logo_url"
}
```

#### Update Store
```
PUT /api/stores/[storeId]
```

#### Approve/Activate Store
```
PUT /api/stores/[storeId]/approve
```

**Body:**
```json
{
  "status": "approved",
  "isActive": true
}
```

---

### Orders

#### Get All Orders
```
GET /api/orders
```

**Query Parameters:**
- `userId` (string, optional) - Filter by user ID
- `storeId` (string, optional) - Filter by store ID
- `status` (string, optional) - Filter by status

#### Get Single Order
```
GET /api/orders/[orderId]
```

#### Create Order
```
POST /api/orders
```

**Body:**
```json
{
  "userId": "user_id",
  "storeId": "store_id",
  "addressId": "address_id",
  "orderItems": [
    {
      "productId": "product_id",
      "quantity": 2,
      "price": 80.00
    }
  ],
  "total": 160.00,
  "paymentMethod": "COD",
  "isCouponUsed": false,
  "coupon": {}
}
```

**Note:** This automatically clears the user's cart after order creation.

#### Update Order Status
```
PUT /api/orders/[orderId]
```

**Body:**
```json
{
  "status": "PROCESSING",
  "isPaid": true
}
```

---

### Addresses

#### Get User Addresses
```
GET /api/addresses?userId=user_id
```

#### Get Single Address
```
GET /api/addresses/[addressId]
```

#### Create Address
```
POST /api/addresses
```

**Body:**
```json
{
  "userId": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "street": "123 Main St",
  "city": "City",
  "state": "State",
  "zip": "12345",
  "country": "Country",
  "phone": "1234567890"
}
```

#### Update Address
```
PUT /api/addresses/[addressId]
```

#### Delete Address
```
DELETE /api/addresses/[addressId]
```

---

### Ratings

#### Get Ratings
```
GET /api/ratings
```

**Query Parameters:**
- `productId` (string, optional)
- `userId` (string, optional)
- `orderId` (string, optional)

#### Create Rating
```
POST /api/ratings
```

**Body:**
```json
{
  "userId": "user_id",
  "productId": "product_id",
  "orderId": "order_id",
  "rating": 5,
  "review": "Great product!"
}
```

**Note:** Rating must be between 1-5. User must have ordered the product.

---

### Coupons

#### Get All Coupons
```
GET /api/coupons
```

**Query Parameters:**
- `code` (string, optional)
- `isPublic` (boolean, optional)
- `forNewUser` (boolean, optional)

**Note:** Expired coupons are automatically filtered out.

#### Get Single Coupon
```
GET /api/coupons/[code]
```

#### Validate Coupon
```
POST /api/coupons/validate
```

**Body:**
```json
{
  "code": "DISCOUNT10",
  "userId": "user_id"
}
```

#### Create Coupon
```
POST /api/coupons
```

**Body:**
```json
{
  "code": "DISCOUNT10",
  "description": "10% off",
  "discount": 10.0,
  "forNewUser": false,
  "forMember": false,
  "isPublic": true,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

#### Update Coupon
```
PUT /api/coupons/[code]
```

#### Delete Coupon
```
DELETE /api/coupons/[code]
```

---

### Cart

#### Get User Cart
```
GET /api/cart?userId=user_id
```

**Response:** JSON object with product IDs as keys and quantities as values
```json
{
  "product_id_1": 2,
  "product_id_2": 1
}
```

#### Update Cart
```
PUT /api/cart
```

**Body:**
```json
{
  "userId": "user_id",
  "cart": {
    "product_id_1": 2,
    "product_id_2": 1
  }
}
```

---

### Dashboard

#### Store Dashboard
```
GET /api/dashboard/store?storeId=store_id
```

**Response:**
```json
{
  "totalProducts": 50,
  "totalEarnings": 5000.00,
  "totalOrders": 100,
  "ratings": [...]
}
```

#### Admin Dashboard
```
GET /api/dashboard/admin
```

**Response:**
```json
{
  "products": 500,
  "revenue": 50000.00,
  "orders": 1000,
  "stores": 50,
  "allOrders": [...]
}
```

---

### Users

#### Get User
```
GET /api/users?id=user_id
GET /api/users?email=user@example.com
```

#### Create User
```
POST /api/users
```

**Body:**
```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "image": "image_url",
  "cart": {}
}
```

#### Update User
```
PUT /api/users
```

**Body:**
```json
{
  "id": "user_id",
  "name": "Updated Name",
  "cart": {...}
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Notes

1. All monetary values should be in float format
2. Dates should be in ISO 8601 format
3. Image URLs should be provided as strings or arrays of strings
4. The cart is stored as JSON in the User model
5. Order creation automatically clears the user's cart
6. Store must be active before products can be created
7. Ratings can only be created for products that were ordered by the user

