# E-Commerce Backend API

A production-grade E-Commerce backend built with Express.js, TypeScript, Prisma, and PostgreSQL.

## Features

- **User Authentication**: Register, login, refresh token, password reset
- **Product Management**: CRUD operations, search, filtering, categories
- **Cart System**: Add, update, remove items, calculate totals
- **Wishlist System**: Add, remove items, view wishlist
- **Order Management**: Create orders, track status, order history
- **Payment Integration**: Chapa payment gateway with webhook verification
- **File Upload**: MinIO integration for secure image storage
- **Review System**: Product reviews and ratings with average calculation
- **Inventory Management**: Stock tracking, low stock alerts, inventory logs
- **Analytics Dashboard**: Sales, product, customer analytics with historical data
- **Coupon System**: Percentage and fixed amount discounts with validation
- **API Documentation**: Swagger UI for interactive API testing
- **Error Handling**: Centralized error handling with detailed responses
- **Logging**: Winston logger with file and console transports
- **Environment Validation**: Zod schema validation for environment variables
- **Testing**: Jest and Supertest for unit and integration testing
- **Docker Support**: Docker and Docker Compose for easy development and deployment

## Tech Stack

- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: Argon2
- **File Storage**: MinIO (S3-compatible)
- **Payment Gateway**: Chapa
- **Email**: Nodemailer
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest, Supertest
- **API Documentation**: Swagger UI
- **Containerization**: Docker, Docker Compose
- **Scheduling**: Node-cron
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js (v16+)
- pnpm (v7+)
- Docker and Docker Compose
- PostgreSQL (or use the Docker Compose setup)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ski-p3r/ecommerce-backend.git
   cd ecommerce-backend
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your configuration.

4. Start the development environment:

   ```bash
   docker-compose up -d
   ```

5. Run database migrations:

   ```bash
   pnpm prisma:migrate
   ```

6. Seed the database with initial data:

   ```bash
   pnpm seed
   ```

7. Start the development server:
   ```bash
   pnpm dev
   ```

### Running Tests

```bash
pnpm test
```

For watching mode:

```bash
pnpm test:watch
```

### Building for Production

```bash
pnpm build
pnpm start:prod
```

## API Documentation

Once the server is running, you can access the Swagger documentation at:

```
http://localhost:3000/api-docs
```

## Project Structure

```
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── __tests__/          # Test files
│   ├── config/             # Configuration files
│   │   └── prisma.ts       # Prisma client configuration
│   ├── controllers/        # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── product.controller.ts
│   │   ├── cart.controller.ts
│   │   ├── order.controller.ts
│   │   ├── wishlist.controller.ts
│   │   ├── upload.controller.ts
│   │   ├── chapa.controller.ts
│   │   ├── review.controller.ts
│   │   ├── inventory.controller.ts
│   │   ├── analytics.controller.ts
│   │   └── coupon.controller.ts
│   ├── middlewares/        # Express middlewares
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/             # API routes
│   │   ├── auth.routes.ts
│   │   ├── product.routes.ts
│   │   ├── cart.routes.ts
│   │   ├── order.routes.ts
│   │   ├── wishlist.routes.ts
│   │   ├── upload.routes.ts
│   │   ├── chapa.routes.ts
│   │   ├── review.routes.ts
│   │   ├── inventory.routes.ts
│   │   ├── analytics.routes.ts
│   │   └── coupon.routes.ts
│   ├── utils/              # Utility functions
│   │   ├── appError.ts     # Custom error class
│   │   ├── logger.ts       # Winston logger setup
│   │   ├── email.ts        # Email sending utility
│   │   ├── minio.ts        # MinIO client setup
│   │   ├── chapa.ts        # Chapa payment integration
│   │   ├── validateEnv.ts  # Environment validation
│   │   ├── scheduler.ts    # Cron job scheduler
│   │   └── seed.ts         # Database seeding
│   ├── app.ts              # Express app setup
│   └── server.ts           # Server entry point
├── .env.example            # Example environment variables
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile              # Docker configuration
├── jest.config.js          # Jest configuration
├── package.json            # Project dependencies
└── tsconfig.json           # TypeScript configuration
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/forgot-password` - Send password reset code
- `POST /api/v1/auth/reset-password` - Reset password with code

### Products

- `GET /api/v1/products` - Get all products with filtering
- `GET /api/v1/products/:idOrSlug` - Get a single product
- `POST /api/v1/products` - Create a new product (admin only)
- `PATCH /api/v1/products/:id` - Update a product (admin only)
- `DELETE /api/v1/products/:id` - Delete a product (admin only)
- `GET /api/v1/products/categories` - Get all categories
- `POST /api/v1/products/categories` - Create a new category (admin only)

### Cart

- `GET /api/v1/cart` - Get user's cart
- `POST /api/v1/cart` - Add item to cart
- `PATCH /api/v1/cart/:itemId` - Update cart item quantity
- `DELETE /api/v1/cart/:itemId` - Remove item from cart
- `DELETE /api/v1/cart/clear` - Clear cart

### Wishlist

- `GET /api/v1/wishlist` - Get user's wishlist
- `POST /api/v1/wishlist` - Add item to wishlist
- `DELETE /api/v1/wishlist/:productId` - Remove item from wishlist

### Orders

- `POST /api/v1/orders` - Create a new order from cart
- `GET /api/v1/orders` - Get all orders for current user
- `GET /api/v1/orders/:id` - Get a single order
- `PATCH /api/v1/orders/:id/status` - Update order status (admin only)
- `GET /api/v1/orders/admin/all` - Get all orders (admin only)

### Reviews

- `POST /api/v1/reviews` - Create a new review
- `PATCH /api/v1/reviews/:id` - Update a review
- `DELETE /api/v1/reviews/:id` - Delete a review
- `GET /api/v1/reviews/product/:productId` - Get reviews for a product
- `GET /api/v1/reviews/user` - Get user's reviews

### Inventory Management

- `PATCH /api/v1/inventory/products/:productId/stock` - Update product stock (admin only)
- `PATCH /api/v1/inventory/products/:productId/low-stock-alert` - Update low stock alert threshold (admin only)
- `GET /api/v1/inventory/products/:productId/logs` - Get inventory logs for a product (admin only)
- `GET /api/v1/inventory/low-stock` - Get low stock products (admin only)

### Coupons

- `POST /api/v1/coupons` - Create a new coupon (admin only)
- `GET /api/v1/coupons` - Get all coupons (admin only)
- `GET /api/v1/coupons/:id` - Get a single coupon (admin only)
- `PATCH /api/v1/coupons/:id` - Update a coupon (admin only)
- `DELETE /api/v1/coupons/:id` - Delete a coupon (admin only)
- `POST /api/v1/coupons/validate` - Validate a coupon code
- `POST /api/v1/coupons/apply` - Apply a coupon to an order
- `POST /api/v1/coupons/remove` - Remove a coupon from an order

### Analytics

- `GET /api/v1/analytics/dashboard` - Get dashboard overview (admin only)
- `GET /api/v1/analytics/sales` - Get sales analytics (admin only)
- `GET /api/v1/analytics/products` - Get product analytics (admin only)
- `GET /api/v1/analytics/customers` - Get customer analytics (admin only)
- `GET /api/v1/analytics/historical` - Get historical stats (admin only)

### Upload

- `POST /api/v1/upload` - Get presigned URL for file upload

### Payment

- `POST /api/v1/chapa/verify` - Webhook for Chapa payment verification
- `GET /api/v1/chapa/redirect` - Redirect URL after payment

## Environment Variables

The following environment variables are required:

```
# Node environment
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce?schema=public

# JWT
JWT_ACCESS_SECRET=your_access_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=ecommerce
MINIO_USE_SSL=false

# Chapa
CHAPA_SECRET_KEY=your_chapa_secret_key_here
CHAPA_WEBHOOK_SECRET=your_chapa_webhook_secret_here

# Email
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password
EMAIL_FROM=noreply@ecommerce.com
```

## License

MIT
