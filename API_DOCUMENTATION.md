# E-Commerce API Documentation

## Introduction

This document provides detailed information about the E-Commerce Backend API. The API follows RESTful principles and uses JSON for data interchange.

## Table of Contents

- [API Usage](#api-usage)
  - [Base URL](#base-url)
  - [Authentication](#authentication)
  - [Request Format](#request-format)
  - [Response Format](#response-format)
  - [Error Handling](#error-handling)
  - [Pagination](#pagination)
  - [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-1)
  - [Products](#products)
  - [Cart](#cart)
  - [Wishlist](#wishlist)
  - [Orders](#orders)
  - [Reviews](#reviews)
  - [Inventory Management](#inventory-management)
  - [Coupons](#coupons)
  - [Analytics](#analytics)
  - [Upload](#upload)
  - [Payment](#payment)

## API Usage

### Base URL

All API requests should be made to:

```
http://your-domain.com/api/v1/
```

For local development:

```
http://localhost:3000/api/v1/
```

### Authentication

The API uses JWT (JSON Web Token) for authentication. Most endpoints require an `Authorization` header with a valid access token.

#### Token Format

```
Authorization: Bearer <access_token>
```

#### Token Expiration

- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days

When an access token expires, use the refresh token endpoint to get a new access token.

### Request Format

Requests with a body should be in JSON format and include the header:

```
Content-Type: application/json
```

### Response Format

All responses are in JSON format. Standard response structure:

```json
{
  "status": "success",
  "data": {
    // Response data here
  }
}
```

Error responses:

```json
{
  "status": "error",
  "message": "Error description",
  "errors": {
    // Detailed error information (optional)
  }
}
```

### Error Handling

Common HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `204 No Content`: Request succeeded with no response body
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Authenticated but insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Request conflicts with current state
- `429 Too Many Requests`: Rate limit exceeded
- `500 Server Error`: Internal server error

### Pagination

Endpoints that return lists support pagination with the following query parameters:

- `page`: Page number (default: 1)
- `limit`: Number of items per page (default: 10)

Pagination metadata is included in the response:

```json
{
  "status": "success",
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 100,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Rate Limiting

API requests are subject to rate limiting to prevent abuse. The current limits are:

- 100 requests per 15-minute window per IP address

Rate limit headers are included in the response:

- `X-RateLimit-Limit`: Maximum number of requests allowed in a window
- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `X-RateLimit-Reset`: Time when the current window resets (Unix timestamp)

## Endpoints

### Authentication

#### Register a new user

```
POST /auth/register
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### Login user

```
POST /auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### Refresh access token

```
POST /auth/refresh-token
```

**Request Body:**

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "accessToken": "new_jwt_access_token",
    "refreshToken": "new_jwt_refresh_token"
  }
}
```

#### Logout user

```
POST /auth/logout
```

**Request Body:**

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

#### Forgot password

```
POST /auth/forgot-password
```

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Password reset code sent to email"
}
```

#### Reset password

```
POST /auth/reset-password
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "code": "123456",
  "password": "newpassword123"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Password reset successfully"
}
```

### Products

#### Get all products with filtering

```
GET /products
```

**Query Parameters:**

- `categoryId` - Filter by category ID
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `search` - Search term for name or description
- `inStock` - Filter by availability (true/false)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response:**

```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Product Name",
        "slug": "product-name",
        "description": "Product description",
        "price": "99.99",
        "images": ["https://example.com/image.jpg"],
        "stock": 100,
        "categoryId": "uuid",
        "category": {
          "id": "uuid",
          "name": "Category Name",
          "slug": "category-name"
        },
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 100,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### Get a single product

```
GET /products/:idOrSlug
```

**Path Parameters:**

- `idOrSlug` - Product ID or slug

**Response:**

```json
{
  "status": "success",
  "data": {
    "product": {
      "id": "uuid",
      "name": "Product Name",
      "slug": "product-name",
      "description": "Product description",
      "price": "99.99",
      "images": ["https://example.com/image.jpg"],
      "stock": 100,
      "categoryId": "uuid",
      "category": {
        "id": "uuid",
        "name": "Category Name",
        "slug": "category-name"
      },
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### Create a new product (admin only)

```
POST /products
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "images": ["https://example.com/image.jpg"],
  "stock": 100,
  "categoryId": "uuid"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "product": {
      "id": "uuid",
      "name": "New Product",
      "slug": "new-product",
      "description": "Product description",
      "price": "99.99",
      "images": ["https://example.com/image.jpg"],
      "stock": 100,
      "categoryId": "uuid",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### Update a product (admin only)

```
PATCH /products/:id
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Path Parameters:**

- `id` - Product ID

**Request Body:**

```json
{
  "name": "Updated Product",
  "price": 129.99,
  "stock": 50
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "product": {
      "id": "uuid",
      "name": "Updated Product",
      "slug": "updated-product",
      "description": "Product description",
      "price": "129.99",
      "images": ["https://example.com/image.jpg"],
      "stock": 50,
      "categoryId": "uuid",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### Delete a product (admin only)

```
DELETE /products/:id
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Path Parameters:**

- `id` - Product ID

**Response:**

```
204 No Content
```

#### Get all categories

```
GET /products/categories
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "categories": [
      {
        "id": "uuid",
        "name": "Category Name",
        "slug": "category-name",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### Create a new category (admin only)

```
POST /products/categories
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "name": "New Category"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "category": {
      "id": "uuid",
      "name": "New Category",
      "slug": "new-category",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### Cart

#### Get user's cart

```
GET /cart
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Response:**

```json
{
  "status": "success",
  "data": {
    "cart": {
      "id": "uuid",
      "userId": "uuid",
      "items": [
        {
          "id": "uuid",
          "cartId": "uuid",
          "productId": "uuid",
          "quantity": 2,
          "product": {
            "id": "uuid",
            "name": "Product Name",
            "slug": "product-name",
            "price": "99.99",
            "images": ["https://example.com/image.jpg"],
            "stock": 100
          }
        }
      ],
      "total": 199.98,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### Add item to cart

```
POST /cart
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "productId": "uuid",
  "quantity": 2
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "cart": {
      "id": "uuid",
      "userId": "uuid",
      "items": [
        {
          "id": "uuid",
          "cartId": "uuid",
          "productId": "uuid",
          "quantity": 2,
          "product": {
            "id": "uuid",
            "name": "Product Name",
            "slug": "product-name",
            "price": "99.99",
            "images": ["https://example.com/image.jpg"],
            "stock": 100
          }
        }
      ],
      "total": 199.98,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### Update cart item quantity

```
PATCH /cart/:itemId
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Path Parameters:**

- `itemId` - Cart item ID

**Request Body:**

```json
{
  "quantity": 3
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "cart": {
      "id": "uuid",
      "userId": "uuid",
      "items": [
        {
          "id": "uuid",
          "cartId": "uuid",
          "productId": "uuid",
          "quantity": 3,
          "product": {
            "id": "uuid",
            "name": "Product Name",
            "slug": "product-name",
            "price": "99.99",
            "images": ["https://example.com/image.jpg"],
            "stock": 100
          }
        }
      ],
      "total": 299.97,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### Remove item from cart

```
DELETE /cart/:itemId
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Path Parameters:**

- `itemId` - Cart item ID

**Response:**

```json
{
  "status": "success",
  "data": {
    "cart": {
      "id": "uuid",
      "userId": "uuid",
      "items": [],
      "total": 0,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### Clear cart

```
DELETE /cart/clear
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Response:**

```json
{
  "status": "success",
  "data": {
    "cart": {
      "id": "uuid",
      "userId": "uuid",
      "items": [],
      "total": 0,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### Wishlist

#### Get user's wishlist

```
GET /wishlist
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Response:**

```json
{
  "status": "success",
  "data": {
    "wishlist": {
      "id": "uuid",
      "userId": "uuid",
      "items": [
        {
          "id": "uuid",
          "wishlistId": "uuid",
          "productId": "uuid",
          "product": {
            "id": "uuid",
            "name": "Product Name",
            "slug": "product-name",
            "price": "99.99",
            "images": ["https://example.com/image.jpg"],
            "stock": 100
          }
        }
      ],
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### Add item to wishlist

```
POST /wishlist
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "productId": "uuid"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Item added to wishlist"
}
```

#### Remove item from wishlist

```
DELETE /wishlist/:productId
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Path Parameters:**

- `productId` - Product ID

**Response:**

```json
{
  "status": "success",
  "message": "Item removed from wishlist"
}
```

### Orders

#### Create a new order from cart

```
POST /orders
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "shippingAddress": "123 Main St, City, Country"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "order": {
      "id": "uuid",
      "userId": "uuid",
      "totalAmount": "199.98",
      "shippingAddress": "123 Main St, City, Country",
      "status": "PENDING",
      "paymentStatus": false,
      "paymentReference": "tx_ref",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "items": [
        {
          "id": "uuid",
          "orderId": "uuid",
          "productId": "uuid",
          "quantity": 2,
          "price": "99.99",
          "product": {
            "id": "uuid",
            "name": "Product Name",
            "slug": "product-name",
            "images": ["https://example.com/image.jpg"]
          }
        }
      ]
    },
    "paymentUrl": "https://checkout.chapa.co/checkout/payment-id"
  }
}
```

#### Get all orders for current user

```
GET /orders
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Response:**

```json
{
  "status": "success",
  "data": {
    "orders": [
      {
        "id": "uuid",
        "userId": "uuid",
        "totalAmount": "199.98",
        "shippingAddress": "123 Main St, City, Country",
        "status": "PENDING",
        "paymentStatus": false,
        "paymentReference": "tx_ref",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z",
        "items": [
          {
            "id": "uuid",
            "orderId": "uuid",
            "productId": "uuid",
            "quantity": 2,
            "price": "99.99",
            "product": {
              "id": "uuid",
              "name": "Product Name",
              "slug": "product-name",
              "images": ["https://example.com/image.jpg"]
            }
          }
        ]
      }
    ]
  }
}
```

#### Get a single order

```
GET /orders/:id
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Path Parameters:**

- `id` - Order ID

**Response:**

```json
{
  "status": "success",
  "data": {
    "order": {
      "id": "uuid",
      "userId": "uuid",
      "totalAmount": "199.98",
      "shippingAddress": "123 Main St, City, Country",
      "status": "PENDING",
      "paymentStatus": false,
      "paymentReference": "tx_ref",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "items": [
        {
          "id": "uuid",
          "orderId": "uuid",
          "productId": "uuid",
          "quantity": 2,
          "price": "99.99",
          "product": {
            "id": "uuid",
            "name": "Product Name",
            "slug": "product-name",
            "images": ["https://example.com/image.jpg"]
          }
        }
      ]
    }
  }
}
```

#### Update order status (admin only)

```
PATCH /orders/:id/status
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Path Parameters:**

- `id` - Order ID

**Request Body:**

```json
{
  "status": "SHIPPED"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "order": {
      "id": "uuid",
      "userId": "uuid",
      "totalAmount": "199.98",
      "shippingAddress": "123 Main St, City, Country",
      "status": "SHIPPED",
      "paymentStatus": false,
      "paymentReference": "tx_ref",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "items": [
        {
          "id": "uuid",
          "orderId": "uuid",
          "productId": "uuid",
          "quantity": 2,
          "price": "99.99",
          "product": {
            "id": "uuid",
            "name": "Product Name",
            "slug": "product-name",
            "images": ["https://example.com/image.jpg"]
          }
        }
      ]
    }
  }
}
```

#### Get all orders (admin only)

```
GET /orders/admin/all
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response:**

```json
{
  "status": "success",
  "data": {
    "orders": [
      {
        "id": "uuid",
        "userId": "uuid",
        "totalAmount": "199.98",
        "shippingAddress": "123 Main St, City, Country",
        "status": "PENDING",
        "paymentStatus": false,
        "paymentReference": "tx_ref",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z",
        "user": {
          "id": "uuid",
          "email": "user@example.com",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 100,
      "totalPages": 10
    }
  }
}
```

### Reviews

#### Create a new review

```
POST /reviews
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "productId": "uuid",
  "rating": 5,
  "comment": "Great product, highly recommended!"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "review": {
      "id": "uuid",
      "userId": "uuid",
      "productId": "uuid",
      "rating": 5,
      "comment": "Great product, highly recommended!",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### Update a review

```
PATCH /reviews/:id
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Path Parameters:**

- `id` - Review ID

**Request Body:**

```json
{
  "rating": 4,
  "comment": "Good product, but could be better."
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "review": {
      "id": "uuid",
      "userId": "uuid",
      "productId": "uuid",
      "rating": 4,
      "comment": "Good product, but could be better.",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### Delete a review

```
DELETE /reviews/:id
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Path Parameters:**

- `id` - Review ID

**Response:**

```
204 No Content
```

#### Get reviews for a product

```
GET /reviews/product/:productId
```

**Path Parameters:**

- `productId` - Product ID

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response:**

```json
{
  "status": "success",
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "userId": "uuid",
        "productId": "uuid",
        "rating": 5,
        "comment": "Great product, highly recommended!",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z",
        "user": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 50,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### Get user's reviews

```
GET /reviews/user
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response:**

```json
{
  "status": "success",
  "data": {
    "reviews": [
      {
        "id": "uuid",
        "userId": "uuid",
        "productId": "uuid",
        "rating": 5,
        "comment": "Great product, highly recommended!",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z",
        "product": {
          "id": "uuid",
          "name": "Product Name",
          "slug": "product-name",
          "images": ["https://example.com/image.jpg"]
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 20,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Inventory Management

#### Update product stock (admin only)

```
PATCH /inventory/products/:productId/stock
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Path Parameters:**

- `productId` - Product ID

**Request Body:**

```json
{
  "quantity": 50,
  "type": "add",
  "description": "Restocking from supplier"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "product": {
      "id": "uuid",
      "name": "Product Name",
      "stock": 150,
      "updatedAt": "2023-01-01T00:00:00.000Z"
    },
    "inventoryLog": {
      "id": "uuid",
      "productId": "uuid",
      "quantity": 50,
      "type": "add",
      "description": "Restocking from supplier",
      "createdBy": "uuid",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### Update low stock alert threshold (admin only)

```
PATCH /inventory/products/:productId/low-stock-alert
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Path Parameters:**

- `productId` - Product ID

**Request Body:**

```json
{
  "lowStockAlert": 10
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "product": {
      "id": "uuid",
      "name": "Product Name",
      "stock": 150,
      "lowStockAlert": 10,
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### Get inventory logs for a product (admin only)

```
GET /inventory/products/:productId/logs
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Path Parameters:**

- `productId` - Product ID

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response:**

```json
{
  "status": "success",
  "data": {
    "logs": [
      {
        "id": "uuid",
        "productId": "uuid",
        "quantity": 50,
        "type": "add",
        "description": "Restocking from supplier",
        "createdBy": "uuid",
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 30,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### Get low stock products (admin only)

```
GET /inventory/low-stock
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Response:**

```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Product Name",
        "stock": 3,
        "lowStockAlert": 5,
        "category": {
          "id": "uuid",
          "name": "Category Name"
        }
      }
    ],
    "count": 1
  }
}
```

### Coupons

#### Create a new coupon (admin only)

```
POST /coupons
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "code": "SUMMER20",
  "type": "PERCENTAGE",
  "value": 20,
  "minAmount": 50,
  "maxAmount": 1000,
  "startDate": "2023-06-01T00:00:00.000Z",
  "endDate": "2023-08-31T23:59:59.999Z",
  "isActive": true,
  "usageLimit": 100
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "coupon": {
      "id": "uuid",
      "code": "SUMMER20",
      "type": "PERCENTAGE",
      "value": "20.00",
      "minAmount": "50.00",
      "maxAmount": "1000.00",
      "startDate": "2023-06-01T00:00:00.000Z",
      "endDate": "2023-08-31T23:59:59.999Z",
      "isActive": true,
      "usageLimit": 100,
      "usageCount": 0,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### Get all coupons (admin only)

```
GET /coupons
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `active` - Filter by active status (true/false)

**Response:**

```json
{
  "status": "success",
  "data": {
    "coupons": [
      {
        "id": "uuid",
        "code": "SUMMER20",
        "type": "PERCENTAGE",
        "value": "20.00",
        "minAmount": "50.00",
        "maxAmount": "1000.00",
        "startDate": "2023-06-01T00:00:00.000Z",
        "endDate": "2023-08-31T23:59:59.999Z",
        "isActive": true,
        "usageLimit": 100,
        "usageCount": 0,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 5,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

#### Get a single coupon (admin only)

```
GET /coupons/:id
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Path Parameters:**

- `id` - Coupon ID

**Response:**

```json
{
  "status": "success",
  "data": {
    "coupon": {
      "id": "uuid",
      "code": "SUMMER20",
      "type": "PERCENTAGE",
      "value": "20.00",
      "minAmount": "50.00",
      "maxAmount": "1000.00",
      "startDate": "2023-06-01T00:00:00.000Z",
      "endDate": "2023-08-31T23:59:59.999Z",
      "isActive": true,
      "usageLimit": 100,
      "usageCount": 0,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### Update a coupon (admin only)

```
PATCH /coupons/:id
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Path Parameters:**

- `id` - Coupon ID

**Request Body:**

```json
{
  "value": 25,
  "isActive": false
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "coupon": {
      "id": "uuid",
      "code": "SUMMER20",
      "type": "PERCENTAGE",
      "value": "25.00",
      "minAmount": "50.00",
      "maxAmount": "1000.00",
      "startDate": "2023-06-01T00:00:00.000Z",
      "endDate": "2023-08-31T23:59:59.999Z",
      "isActive": false,
      "usageLimit": 100,
      "usageCount": 0,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

#### Delete a coupon (admin only)

```
DELETE /coupons/:id
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Path Parameters:**

- `id` - Coupon ID

**Response:**

```
204 No Content
```

#### Validate a coupon code

```
POST /coupons/validate
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "code": "SUMMER20",
  "amount": 100
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "valid": true,
    "coupon": {
      "id": "uuid",
      "code": "SUMMER20",
      "type": "PERCENTAGE",
      "value": "20.00",
      "discountAmount": 20,
      "finalAmount": 80
    }
  }
}
```

#### Apply a coupon to an order

```
POST /coupons/apply
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "orderId": "uuid",
  "code": "SUMMER20"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "order": {
      "id": "uuid",
      "totalAmount": "199.98",
      "discountAmount": "40.00",
      "finalAmount": "159.98",
      "couponId": "uuid"
    }
  }
}
```

#### Remove a coupon from an order

```
POST /coupons/remove
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "orderId": "uuid"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "order": {
      "id": "uuid",
      "totalAmount": "199.98",
      "discountAmount": null,
      "couponId": null
    }
  }
}
```

### Analytics

#### Get dashboard overview (admin only)

```
GET /analytics/dashboard
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Response:**

```json
{
  "status": "success",
  "data": {
    "kpis": {
      "orders": {
        "value": 120,
        "change": 15.5
      },
      "revenue": {
        "value": 12500.75,
        "change": 8.2
      },
      "users": {
        "value": 45,
        "change": 22.3
      },
      "products": {
        "total": 250,
        "lowStock": 12
      },
      "pendingOrders": 18
    },
    "recentOrders": [
      {
        "id": "uuid",
        "totalAmount": "199.98",
        "status": "PENDING",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "user": {
          "id": "uuid",
          "email": "user@example.com",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ],
    "topProducts": [
      {
        "id": "uuid",
        "name": "Product Name",
        "price": "99.99",
        "stock": 100,
        "category": "Category Name",
        "orderCount": 45
      }
    ],
    "salesByDay": [
      {
        "date": "2023-01-01",
        "sales": 1250.75,
        "orders": 12
      }
    ]
  }
}
```

#### Get sales analytics (admin only)

```
GET /analytics/sales
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Query Parameters:**

- `period` - Time period (daily, weekly, monthly, yearly)
- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD)

**Response:**

```json
{
  "status": "success",
  "data": {
    "overview": {
      "totalSales": 12500.75,
      "totalOrders": 120,
      "avgOrderValue": 104.17,
      "startDate": "2023-01-01T00:00:00.000Z",
      "endDate": "2023-01-31T23:59:59.999Z"
    },
    "salesTrend": [
      {
        "date": "2023-W1",
        "sales": 2500.5,
        "orders": 25
      }
    ],
    "topProducts": [
      {
        "id": "uuid",
        "name": "Product Name",
        "quantity": 45,
        "revenue": 4495.55
      }
    ],
    "topCategories": [
      {
        "id": "uuid",
        "name": "Category Name",
        "quantity": 85,
        "revenue": 7500.25
      }
    ]
  }
}
```

#### Get product analytics (admin only)

```
GET /analytics/products
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Query Parameters:**

- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD)

**Response:**

```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Product Name",
        "category": "Category Name",
        "stock": 100,
        "lowStockAlert": 10,
        "quantitySold": 45,
        "revenue": 4495.55,
        "reviewCount": 12,
        "avgRating": 4.5,
        "isLowStock": false
      }
    ],
    "categories": [
      {
        "name": "Category Name",
        "quantitySold": 85,
        "revenue": 7500.25,
        "productCount": 15
      }
    ],
    "lowStockProducts": [
      {
        "id": "uuid",
        "name": "Low Stock Product",
        "stock": 5,
        "lowStockAlert": 10
      }
    ],
    "outOfStockProducts": [
      {
        "id": "uuid",
        "name": "Out of Stock Product",
        "stock": 0,
        "lowStockAlert": 10
      }
    ],
    "totalProducts": 250,
    "totalSold": 350,
    "totalRevenue": 12500.75
  }
}
```

#### Get customer analytics (admin only)

```
GET /analytics/customers
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Query Parameters:**

- `startDate` - Start date (YYYY-MM-DD)
- `endDate` - End date (YYYY-MM-DD)

**Response:**

```json
{
  "status": "success",
  "data": {
    "overview": {
      "totalCustomers": 500,
      "newCustomers": 45,
      "activeCustomers": 320,
      "avgOrdersPerCustomer": 2.5,
      "avgSpendPerCustomer": 250.15
    },
    "segments": {
      "newCustomers": 45,
      "returningCustomers": 275,
      "inactiveCustomers": 180
    },
    "topCustomers": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "orderCount": 8,
        "totalSpent": 950.25,
        "reviewCount": 5,
        "avgOrderValue": 118.78
      }
    ]
  }
}
```

#### Get historical stats (admin only)

```
GET /analytics/historical
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Query Parameters:**

- `days` - Number of days to retrieve (default: 30)

**Response:**

```json
{
  "status": "success",
  "data": {
    "stats": [
      {
        "id": "uuid",
        "date": "2023-01-01T00:00:00.000Z",
        "totalSales": "1250.75",
        "orderCount": 12,
        "newUserCount": 5,
        "productsSold": 35,
        "avgOrderValue": "104.23",
        "topSellingProduct": "Product Name",
        "createdAt": "2023-01-02T00:00:00.000Z"
      }
    ],
    "totalDays": 30,
    "requestedDays": 30
  }
}
```

### Upload

#### Get presigned URL for file upload

```
POST /upload
```

**Headers:**

- `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "fileName": "product-image.jpg",
  "fileType": "image/jpeg"
}
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "presignedUrl": "https://minio-endpoint/bucket/uploads/uuid-product-image.jpg?signature=...",
    "publicUrl": "https://minio-endpoint/bucket/uploads/uuid-product-image.jpg",
    "fileName": "uuid-product-image.jpg",
    "filePath": "uploads/uuid-product-image.jpg"
  }
}
```

### Payment

#### Webhook for Chapa payment verification

```
POST /chapa/verify
```

**Headers:**

- `chapa-signature: <signature>`

**Request Body:**

```json
{
  "tx_ref": "order-uuid",
  "status": "success",
  "amount": "199.98",
  "currency": "ETB"
}
```

**Response:**

```json
{
  "received": true
}
```

#### Redirect URL after payment

```
GET /chapa/redirect
```

**Query Parameters:**

- `tx_ref` - Transaction reference
- `status` - Payment status

**Response:**

```
302 Redirect to frontend URL
```

## SDK Libraries

For easy integration with the API from various platforms, we provide the following client libraries:

- JavaScript/TypeScript: `@ecommerce/api-client`
- Python: `ecommerce-api-client`
- PHP: `ecommerce/api-client`
- Mobile SDKs: iOS and Android libraries

## Testing

A Postman collection is available for testing all API endpoints. You can download it from:

```
https://example.com/ecommerce-api-postman.json
```

## Support

For questions or issues with the API, please contact:

- Email: api-support@example.com
- Documentation: https://docs.example.com/api
- Status Page: https://status.example.com
