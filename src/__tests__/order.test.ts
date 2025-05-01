import request from "supertest"
import { app } from "../app"
import { prisma } from "../config/prisma"
import jwt from "jsonwebtoken"

// Mock Chapa API
jest.mock("../utils/chapa", () => ({
  createChapaTransaction: jest.fn().mockResolvedValue({
    checkout_url: "https://checkout.chapa.co/checkout/test",
    tx_ref: "test-tx-ref",
  }),
  verifyTransaction: jest.fn().mockResolvedValue({
    tx_ref: "test-tx-ref",
    flw_ref: "test-flw-ref",
    amount: "29.99",
    currency: "ETB",
    status: "success",
    payment_date: new Date().toISOString(),
  }),
}))

// Mock email service
jest.mock("../utils/email", () => ({
  sendEmail: jest.fn().mockResolvedValue({}),
}))

describe("Order Controller", () => {
  let userToken: string
  let userId: string
  let adminToken: string
  let productId: string
  let orderId: string

  // Set up test data
  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: "order-test@example.com",
        password: "hashedpassword",
        role: "CUSTOMER",
      },
    })

    userId = user.id

    // Generate user token
    userToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: "1h",
    })

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: "order-admin@example.com",
        password: "hashedpassword",
        role: "ADMIN",
      },
    })

    // Generate admin token
    adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: "1h" },
    )

    // Create test category
    const category = await prisma.category.create({
      data: {
        name: "Order Test Category",
        slug: "order-test-category",
      },
    })

    // Create test product
    const product = await prisma.product.create({
      data: {
        name: "Order Test Product",
        slug: "order-test-product",
        description: "This is a test product for order tests",
        price: 29.99,
        images: ["https://example.com/order-test.jpg"],
        stock: 50,
        categoryId: category.id,
      },
    })

    productId = product.id

    // Create cart for user
    const cart = await prisma.cart.create({
      data: {
        userId,
      },
    })

    // Add item to cart
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity: 2,
      },
    })
  })

  // Clean up after tests
  afterAll(async () => {
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.cartItem.deleteMany()
    await prisma.cart.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe("POST /api/v1/orders", () => {
    it("should create a new order from cart", async () => {
      const response = await request(app).post("/api/v1/orders").set("Authorization", `Bearer ${userToken}`).send({
        shippingAddress: "123 Test Street, Test City, Test Country",
      })

      expect(response.status).toBe(201)
      expect(response.body.status).toBe("success")
      expect(response.body.data.order).toHaveProperty("id")
      expect(response.body.data.order.userId).toBe(userId)
      expect(response.body.data.order.totalAmount).toBe("59.98") // 29.99 * 2
      expect(response.body.data.order.shippingAddress).toBe("123 Test Street, Test City, Test Country")
      expect(response.body.data.order.status).toBe("PENDING")
      expect(response.body.data.order.paymentStatus).toBe(false)
      expect(response.body.data.order.items).toHaveLength(1)
      expect(response.body.data.order.items[0].productId).toBe(productId)
      expect(response.body.data.order.items[0].quantity).toBe(2)
      expect(response.body.data.order.items[0].price).toBe("29.99")
      expect(response.body.data.paymentUrl).toBe("https://checkout.chapa.co/checkout/test")

      // Save order ID for later tests
      orderId = response.body.data.order.id

      // Verify cart is cleared
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      })

      expect(cart!.items).toHaveLength(0)

      // Verify product stock is updated
      const product = await prisma.product.findUnique({
        where: { id: productId },
      })

      expect(product!.stock).toBe(48) // 50 - 2
    })

    it("should return error when cart is empty", async () => {
      const response = await request(app).post("/api/v1/orders").set("Authorization", `Bearer ${userToken}`).send({
        shippingAddress: "123 Test Street, Test City, Test Country",
      })

      expect(response.status).toBe(400)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("Cart is empty")
    })
  })

  describe("GET /api/v1/orders", () => {
    it("should get all orders for user", async () => {
      const response = await request(app).get("/api/v1/orders").set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.data.orders).toBeInstanceOf(Array)
      expect(response.body.data.orders).toHaveLength(1)
      expect(response.body.data.orders[0].id).toBe(orderId)
    })
  })

  describe("GET /api/v1/orders/:id", () => {
    it("should get a single order", async () => {
      const response = await request(app).get(`/api/v1/orders/${orderId}`).set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.data.order.id).toBe(orderId)
      expect(response.body.data.order.userId).toBe(userId)
    })

    it("should return error when order not found", async () => {
      const response = await request(app)
        .get("/api/v1/orders/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(404)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("Order not found")
    })

    it("should return error when accessing another user's order", async () => {
      // Create another user
      const anotherUser = await prisma.user.create({
        data: {
          email: "another-user@example.com",
          password: "hashedpassword",
          role: "CUSTOMER",
        },
      })

      // Generate token for another user
      const anotherUserToken = jwt.sign(
        { id: anotherUser.id, email: anotherUser.email, role: anotherUser.role },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: "1h" },
      )

      const response = await request(app)
        .get(`/api/v1/orders/${orderId}`)
        .set("Authorization", `Bearer ${anotherUserToken}`)

      expect(response.status).toBe(403)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("Not authorized")
    })

    it("should allow admin to access any order", async () => {
      const response = await request(app).get(`/api/v1/orders/${orderId}`).set("Authorization", `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.data.order.id).toBe(orderId)
    })
  })

  describe("PATCH /api/v1/orders/:id/status", () => {
    it("should not allow regular users to update order status", async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          status: "SHIPPED",
        })

      expect(response.status).toBe(403)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("You do not have permission to perform this action")
    })

    it("should allow admin to update order status", async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "SHIPPED",
        })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.data.order.status).toBe("SHIPPED")
    })

    it("should restore product stock when order is cancelled", async () => {
      const response = await request(app)
        .patch(`/api/v1/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "CANCELLED",
        })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.data.order.status).toBe("CANCELLED")

      // Verify product stock is restored
      const product = await prisma.product.findUnique({
        where: { id: productId },
      })

      expect(product!.stock).toBe(50) // 48 + 2
    })
  })

  describe("GET /api/v1/orders/admin/all", () => {
    it("should not allow regular users to access all orders", async () => {
      const response = await request(app).get("/api/v1/orders/admin/all").set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(403)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("You do not have permission to perform this action")
    })

    it("should allow admin to access all orders", async () => {
      const response = await request(app).get("/api/v1/orders/admin/all").set("Authorization", `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.data.orders).toBeInstanceOf(Array)
      expect(response.body.data.orders.length).toBeGreaterThan(0)
      expect(response.body.data.pagination).toHaveProperty("page")
      expect(response.body.data.pagination).toHaveProperty("totalCount")
    })
  })
})
