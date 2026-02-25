# API Reference Guide

Complete API documentation for BudolShap Multi-Vendor E-Commerce Platform.

## Base URL
```
http://localhost:3000/api
```

## Authentication

All authenticated routes require a JWT token stored in HTTP-only cookie named `token`.

### Headers
```
Cookie: token=<jwt_token>
```

---

## Authentication Endpoints

### Register User
**POST** `/api/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "User registered successfully"
}
```

**Errors:**
- `400` - Missing required fields
- `409` - Email already exists

---

### Login
**POST** `/api/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "id": "user123",
    "name": "John Doe",
    "email": "john@example.com",
    "accountType": "BUYER",
    "isAdmin": false
  }
}
```

**Errors:**
- `400` - Missing credentials
- `401` - Invalid credentials

---

### Logout
**POST** `/api/logout`

Clear authentication token.

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

### Get Current User
**GET** `/api/user`

Get authenticated user's information.

**Response:** `200 OK`
```json
{
  "id": "user123",
  "name": "John Doe",
  "email": "john@example.com",
  "accountType": "BUYER",
  "isAdmin": false,
  "emailVerified": true
}
```

**Errors:**
- `401` - Not authenticated

---

## Product Endpoints

### Get All Products
**GET** `/api/products`

Retrieve all products with optional filters.

**Query Parameters:**
- `storeId` (optional) - Filter by store ID
- `category` (optional) - Filter by category
- `search` (optional) - Search by product name

**Response:** `200 OK`
```json
[
  {
    "id": "prod123",
    "storeId": "store456",
    "name": "Wireless Headphones",
    "description": "High-quality wireless headphones",
    "price": 2999.99,
    "category": "Electronics",
    "subCategory": "Audio",
    "sizes": ["One Size"],
    "bestseller": true,
    "images": ["image1.jpg", "image2.jpg"],
    "date": "2024-01-15T10:30:00Z",
    "store": {
      "id": "store456",
      "name": "Tech Store",
      "logo": "logo.jpg"
    }
  }
]
```

---

### Get Single Product
**GET** `/api/products/[id]`

Get details of a specific product.

**Response:** `200 OK`
```json
{
  "id": "prod123",
  "storeId": "store456",
  "name": "Wireless Headphones",
  "description": "High-quality wireless headphones with noise cancellation",
  "price": 2999.99,
  "category": "Electronics",
  "subCategory": "Audio",
  "sizes": ["One Size"],
  "bestseller": true,
  "images": ["image1.jpg", "image2.jpg"],
  "date": "2024-01-15T10:30:00Z",
  "store": {
    "id": "store456",
    "name": "Tech Store",
    "username": "techstore",
    "logo": "logo.jpg"
  }
}
```

**Errors:**
- `404` - Product not found

---

### Create Product
**POST** `/api/products`

Create a new product (seller only).

**Authentication:** Required (Seller)

**Request Body:**
```json
{
  "name": "Wireless Headphones",
  "description": "High-quality wireless headphones",
  "price": 2999.99,
  "category": "Electronics",
  "subCategory": "Audio",
  "sizes": ["One Size"],
  "images": ["base64_image_data"],
  "bestseller": false
}
```

**Response:** `201 Created`
```json
{
  "id": "prod123",
  "storeId": "store456",
  "name": "Wireless Headphones",
  "price": 2999.99,
  "date": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not a seller
- `400` - Missing required fields

---

### Update Product
**PUT** `/api/products/[id]`

Update an existing product (seller only, own products).

**Authentication:** Required (Seller)

**Request Body:**
```json
{
  "name": "Updated Product Name",
  "price": 3499.99,
  "bestseller": true
}
```

**Response:** `200 OK`
```json
{
  "id": "prod123",
  "name": "Updated Product Name",
  "price": 3499.99
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not authorized (not product owner)
- `404` - Product not found

---

### Delete Product
**DELETE** `/api/products/[id]`

Delete a product (seller only, own products).

**Authentication:** Required (Seller)

**Response:** `200 OK`
```json
{
  "message": "Product deleted successfully"
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not authorized
- `404` - Product not found

---

## Order Endpoints

### Create Order
**POST** `/api/orders`

Create new order(s) from cart items.

**Authentication:** Required

**Request Body:**
```json
{
  "items": [
    {
      "storeId": "store123",
      "products": [
        {
          "productId": "prod456",
          "quantity": 2,
          "size": "M"
        }
      ],
      "couponCode": "SAVE10"
    }
  ],
  "address": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
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

**Response:** `201 Created`
```json
[
  {
    "orderId": "order789",
    "storeId": "store123",
    "userId": "user456",
    "items": [...],
    "amount": 5000,
    "shippingCost": 100,
    "discount": 500,
    "total": 4600,
    "status": "ORDER_PLACED",
    "date": "2024-01-15T10:30:00Z"
  }
]
```

**Errors:**
- `401` - Not authenticated
- `400` - Invalid request data
- `404` - Product not found

---

### Get User Orders
**GET** `/api/orders`

Get all orders for authenticated user.

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "orderId": "order789",
    "storeId": "store123",
    "items": [...],
    "amount": 5000,
    "total": 4600,
    "status": "SHIPPED",
    "date": "2024-01-15T10:30:00Z",
    "store": {
      "name": "Tech Store",
      "logo": "logo.jpg"
    }
  }
]
```

---

### Get Store Orders
**GET** `/api/orders/store`

Get all orders for seller's store.

**Authentication:** Required (Seller)

**Response:** `200 OK`
```json
[
  {
    "orderId": "order789",
    "userId": "user456",
    "items": [...],
    "total": 4600,
    "status": "ORDER_PLACED",
    "date": "2024-01-15T10:30:00Z",
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
]
```

**Errors:**
- `401` - Not authenticated
- `403` - Not a seller

---

### Update Order Status
**PUT** `/api/orders/[id]/status`

Update order status (seller only).

**Authentication:** Required (Seller)

**Request Body:**
```json
{
  "status": "SHIPPED"
}
```

**Valid Statuses:**
- `ORDER_PLACED`
- `PROCESSING`
- `SHIPPED`
- `DELIVERED`

**Response:** `200 OK`
```json
{
  "orderId": "order789",
  "status": "SHIPPED",
  "updatedAt": "2024-01-16T10:30:00Z"
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not authorized
- `400` - Invalid status

---

## Store Endpoints

### Get Store by Username
**GET** `/api/stores/[username]`

Get store details by username.

**Response:** `200 OK`
```json
{
  "id": "store123",
  "userId": "user456",
  "name": "Tech Store",
  "username": "techstore",
  "description": "Your one-stop tech shop",
  "logo": "logo.jpg",
  "email": "store@example.com",
  "contact": "09123456789",
  "address": "123 Tech Street, Manila",
  "isActive": true,
  "verificationStatus": "APPROVED",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- `404` - Store not found

---

### Create Store
**POST** `/api/stores`

Create a new store (converts user to seller).

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Tech Store",
  "username": "techstore",
  "description": "Your one-stop tech shop",
  "logo": "base64_image_data",
  "email": "store@example.com",
  "contact": "09123456789",
  "address": "123 Tech Street, Manila"
}
```

**Response:** `201 Created`
```json
{
  "id": "store123",
  "name": "Tech Store",
  "username": "techstore",
  "status": "pending",
  "isActive": false
}
```

**Errors:**
- `401` - Not authenticated
- `409` - Username already taken
- `400` - User already has a store

---

### Update Store
**PUT** `/api/stores/[id]`

Update store details (owner only).

**Authentication:** Required (Store Owner)

**Request Body:**
```json
{
  "name": "Updated Store Name",
  "description": "New description",
  "contact": "09987654321"
}
```

**Response:** `200 OK`
```json
{
  "id": "store123",
  "name": "Updated Store Name",
  "updatedAt": "2024-01-16T10:30:00Z"
}
```

---

## Wallet Endpoints

### Get Wallet
**GET** `/api/wallet`

Get seller's wallet balance and transactions.

**Authentication:** Required (Seller)

**Response:** `200 OK`
```json
{
  "wallet": {
    "id": "wallet123",
    "storeId": "store456",
    "balance": 15000.50,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-16T10:30:00Z"
  },
  "transactions": [
    {
      "id": "txn789",
      "amount": 4500,
      "type": "CREDIT",
      "description": "Order #order789",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "payoutRequests": [
    {
      "id": "payout123",
      "amount": 10000,
      "status": "PENDING",
      "createdAt": "2024-01-14T10:00:00Z"
    }
  ]
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not a seller

---

### Request Payout
**POST** `/api/wallet/payout`

Request a payout from wallet.

**Authentication:** Required (Seller)

**Request Body:**
```json
{
  "amount": 10000
}
```

**Response:** `201 Created`
```json
{
  "id": "payout123",
  "walletId": "wallet456",
  "amount": 10000,
  "status": "PENDING",
  "createdAt": "2024-01-16T10:30:00Z"
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not a seller
- `400` - Insufficient balance
- `400` - Amount must be positive

---

## Coupon Endpoints

### Get Store Coupons
**GET** `/api/coupons`

Get all coupons for seller's store.

**Authentication:** Required (Seller)

**Response:** `200 OK`
```json
[
  {
    "id": "coupon123",
    "storeId": "store456",
    "code": "SAVE10",
    "type": "PERCENTAGE",
    "value": 10,
    "minPurchase": 500,
    "maxDiscount": 1000,
    "expiryDate": "2024-12-31T23:59:59Z",
    "isActive": true,
    "usageCount": 25,
    "usageLimit": 100
  }
]
```

---

### Create Coupon
**POST** `/api/coupons`

Create a new coupon (seller only).

**Authentication:** Required (Seller)

**Request Body:**
```json
{
  "code": "SAVE10",
  "type": "PERCENTAGE",
  "value": 10,
  "minPurchase": 500,
  "maxDiscount": 1000,
  "expiryDate": "2024-12-31T23:59:59Z",
  "usageLimit": 100
}
```

**Coupon Types:**
- `PERCENTAGE` - Percentage discount (value: 1-100)
- `FIXED` - Fixed amount discount

**Response:** `201 Created`
```json
{
  "id": "coupon123",
  "code": "SAVE10",
  "type": "PERCENTAGE",
  "value": 10,
  "isActive": true
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not a seller
- `409` - Coupon code already exists

---

### Validate Coupon
**POST** `/api/coupons/validate`

Validate a coupon code for a store.

**Request Body:**
```json
{
  "code": "SAVE10",
  "storeId": "store456",
  "orderAmount": 1000
}
```

**Response:** `200 OK`
```json
{
  "valid": true,
  "discount": 100,
  "coupon": {
    "id": "coupon123",
    "code": "SAVE10",
    "type": "PERCENTAGE",
    "value": 10
  }
}
```

**Errors:**
- `400` - Invalid or expired coupon
- `400` - Minimum purchase not met

---

## Return Endpoints

### Create Return Request
**POST** `/api/returns`

Create a return request for an order.

**Authentication:** Required (Buyer)

**Request Body:**
```json
{
  "orderId": "order789",
  "reason": "Product defective",
  "images": ["base64_image1", "base64_image2"]
}
```

**Response:** `201 Created`
```json
{
  "id": "return123",
  "orderId": "order789",
  "reason": "Product defective",
  "images": ["image1.jpg", "image2.jpg"],
  "status": "PENDING",
  "createdAt": "2024-01-16T10:30:00Z"
}
```

**Errors:**
- `401` - Not authenticated
- `404` - Order not found
- `400` - Return already requested

---

### Get Returns
**GET** `/api/returns`

Get return requests.

**Authentication:** Required

**Query Parameters:**
- `userId` - Filter by user (buyer)
- `storeId` - Filter by store (seller)

**Response:** `200 OK`
```json
[
  {
    "id": "return123",
    "orderId": "order789",
    "reason": "Product defective",
    "images": ["image1.jpg"],
    "status": "PENDING",
    "createdAt": "2024-01-16T10:30:00Z",
    "order": {
      "orderId": "order789",
      "total": 4600,
      "user": {
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  }
]
```

---

### Update Return Status
**PUT** `/api/returns/[id]`

Approve or reject a return request (seller only).

**Authentication:** Required (Seller)

**Request Body:**
```json
{
  "status": "APPROVED"
}
```

**Valid Statuses:**
- `APPROVED` - Approve return and process refund
- `REJECTED` - Reject return request

**Response:** `200 OK`
```json
{
  "id": "return123",
  "status": "APPROVED",
  "updatedAt": "2024-01-17T10:30:00Z"
}
```

**Note:** When approved, the refund amount is automatically deducted from the seller's wallet.

**Errors:**
- `401` - Not authenticated
- `403` - Not authorized
- `404` - Return not found

---

## Chat Endpoints

### Get Chats
**GET** `/api/chats`

Get all chats for authenticated user.

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "chat123",
    "buyerId": "user456",
    "sellerId": "user789",
    "storeId": "store123",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-16T10:30:00Z",
    "buyer": {
      "id": "user456",
      "name": "John Doe",
      "image": "avatar.jpg"
    },
    "seller": {
      "id": "user789",
      "name": "Jane Smith",
      "image": "avatar2.jpg"
    },
    "store": {
      "id": "store123",
      "name": "Tech Store",
      "logo": "logo.jpg"
    },
    "messages": [
      {
        "id": "msg999",
        "content": "Last message",
        "createdAt": "2024-01-16T10:30:00Z"
      }
    ]
  }
]
```

---

### Create Chat
**POST** `/api/chats`

Create a new chat with a store.

**Authentication:** Required

**Request Body:**
```json
{
  "storeId": "store123"
}
```

**Response:** `201 Created`
```json
{
  "id": "chat123",
  "buyerId": "user456",
  "sellerId": "user789",
  "storeId": "store123",
  "createdAt": "2024-01-16T10:30:00Z"
}
```

**Note:** If chat already exists, returns existing chat.

**Errors:**
- `401` - Not authenticated
- `404` - Store not found

---

### Get Chat Messages
**GET** `/api/chats/[id]/messages`

Get all messages for a specific chat.

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "msg123",
    "chatId": "chat456",
    "senderId": "user789",
    "content": "Hello! How can I help you?",
    "createdAt": "2024-01-16T10:30:00Z",
    "sender": {
      "id": "user789",
      "name": "Jane Smith",
      "image": "avatar.jpg"
    }
  }
]
```

**Errors:**
- `401` - Not authenticated
- `403` - Not a participant in this chat
- `404` - Chat not found

---

### Send Message
**POST** `/api/chats/[id]/messages`

Send a message in a chat.

**Authentication:** Required

**Request Body:**
```json
{
  "content": "I have a question about this product."
}
```

**Response:** `201 Created`
```json
{
  "id": "msg124",
  "chatId": "chat456",
  "senderId": "user456",
  "content": "I have a question about this product.",
  "createdAt": "2024-01-16T10:35:00Z",
  "sender": {
    "id": "user456",
    "name": "John Doe",
    "image": "avatar.jpg"
  }
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not a participant in this chat
- `400` - Empty message

---

## Admin Endpoints

All admin endpoints require `isAdmin: true` in the user record.

### Get Analytics
**GET** `/api/admin/analytics`

Get platform-wide analytics.

**Authentication:** Required (Admin)

**Response:** `200 OK`
```json
{
  "overview": {
    "totalGMV": 500000,
    "totalCommission": 50000,
    "totalOrders": 1500,
    "totalUsers": 5000,
    "totalStores": 250,
    "activeStores": 200,
    "totalProducts": 10000
  },
  "users": {
    "total": 5000,
    "buyers": 4750,
    "sellers": 250
  },
  "stores": {
    "total": 250,
    "active": 200,
    "pendingVerification": 50
  },
  "payouts": {
    "pending": 25,
    "pendingAmount": 150000
  },
  "orders": {
    "byStatus": [
      { "status": "ORDER_PLACED", "_count": 300 },
      { "status": "SHIPPED", "_count": 500 },
      { "status": "DELIVERED", "_count": 700 }
    ],
    "last30Days": 450,
    "last30DaysGMV": 120000
  }
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not an admin

---

### Get All Payouts
**GET** `/api/admin/payouts`

Get all payout requests.

**Authentication:** Required (Admin)

**Query Parameters:**
- `status` (optional) - Filter by status (PENDING, APPROVED, REJECTED)

**Response:** `200 OK`
```json
[
  {
    "id": "payout123",
    "walletId": "wallet456",
    "amount": 10000,
    "status": "PENDING",
    "createdAt": "2024-01-16T10:00:00Z",
    "store": {
      "id": "store789",
      "name": "Tech Store",
      "email": "store@example.com",
      "user": {
        "name": "Jane Smith",
        "email": "jane@example.com"
      }
    }
  }
]
```

---

### Update Payout Status
**PUT** `/api/admin/payouts`

Approve or reject a payout request.

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "payoutId": "payout123",
  "status": "APPROVED"
}
```

**Valid Statuses:**
- `APPROVED`
- `REJECTED`

**Response:** `200 OK`
```json
{
  "id": "payout123",
  "status": "APPROVED",
  "updatedAt": "2024-01-17T10:30:00Z"
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not an admin
- `400` - Invalid status

---

### Get All Stores
**GET** `/api/admin/stores`

Get all stores with details.

**Authentication:** Required (Admin)

**Query Parameters:**
- `verificationStatus` (optional) - Filter by verification status

**Response:** `200 OK`
```json
[
  {
    "id": "store123",
    "name": "Tech Store",
    "username": "techstore",
    "email": "store@example.com",
    "verificationStatus": "APPROVED",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "user": {
      "id": "user456",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "wallet": {
      "balance": 15000
    },
    "_count": {
      "Product": 50,
      "Order": 120
    }
  }
]
```

---

### Verify Store
**PUT** `/api/admin/stores/[id]/verify`

Update store verification status.

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "verificationStatus": "APPROVED",
  "verificationNotes": "All documents verified successfully"
}
```

**Valid Statuses:**
- `APPROVED` - Approve and activate store
- `REJECTED` - Reject verification
- `PENDING` - Reset to pending

**Response:** `200 OK`
```json
{
  "id": "store123",
  "verificationStatus": "APPROVED",
  "verificationNotes": "All documents verified successfully",
  "isActive": true,
  "updatedAt": "2024-01-17T10:30:00Z"
}
```

**Errors:**
- `401` - Not authenticated
- `403` - Not an admin
- `404` - Store not found
- `400` - Invalid verification status

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Currently, no rate limiting is implemented. Consider adding rate limiting for production:

- Authentication endpoints: 5 requests per minute
- API endpoints: 100 requests per minute
- Admin endpoints: 200 requests per minute

---

## Pagination

Currently, no pagination is implemented. For large datasets, consider adding pagination:

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

**Response Headers:**
```
X-Total-Count: 1000
X-Page: 1
X-Per-Page: 20
X-Total-Pages: 50
```

---

## Webhooks (Future)

Consider implementing webhooks for:
- Order status changes
- Payout approvals
- Store verification updates
- Return request updates

---

**Last Updated:** 2024-01-17
