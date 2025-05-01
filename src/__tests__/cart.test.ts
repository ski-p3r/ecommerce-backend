import request from "supertest"
import { app } from "../app"
import { prisma } from "../config/prisma"
import jwt from "jsonwebtoken"

describe("Cart Controller", () => {
  let userToken: string
  let userId: string
  let productId: string
  let cartItemId: string

  // Set up test data
  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: "cart-test@example.com",
        password: "hashedpassword",
        role: "CUSTOMER",
      },
    })

    userId = user.id

    // Generate user token
    userToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: "1h",
    })

    // Create test category
    const category = await prisma.category.create({
      data: {
        name: "Cart Test Category",
        slug: "cart-test-category",
      },
    })

    // Create test product
    const product = await prisma.product.create({
      data: {
        name: "Cart Test Product",
        slug: "cart-test-product",
        description: "This is a test product for cart tests",
        price: 29.99,
        images: ["https://example.com/cart-test.jpg"],
        stock: 50,
        categoryId: category.id,
      },
    })

    productId = product.id
  })

  // Clean up after tests
  afterAll(async () => {
    await prisma.cartItem.deleteMany()
    await prisma.cart.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe("GET /api/v1/cart", () => {
    it("should get empty cart for new user", async () => {
      const response = await request(app).get("/api/v1/cart").set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.data.cart).toHaveProperty("id")
      expect(response.body.data.cart.userId).toBe(userId)
      expect(response.body.data.cart.items).toEqual([])
      expect(response.body.data.cart.total).toBe(0)
    })

    it("should return error when not authenticated", async () => {
      const response = await request(app).get("/api/v1/cart")

      expect(response.status).toBe(401)
      expect(response.body.status).toBe("error")
    })
  })

  describe("POST /api/v1/cart", () => {
    it("should add item to cart", async () => {
      const response = await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${userToken}`).send({
        productId,
        quantity: 2,
      })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.data.cart).toHaveProperty("id")
      expect(response.body.data.cart.items).toHaveLength(1)
      expect(response.body.data.cart.items[0].productId).toBe(productId)
      expect(response.body.data.cart.items[0].quantity).toBe(2)
      expect(response.body.data.cart.total).toBe(59.98) // 29.99 * 2

      // Save cart item ID for later tests
      cartItemId = response.body.data.cart.items[0].id
    })

    it("should increase quantity when adding same product", async () => {
      const response = await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${userToken}`).send({
        productId,
        quantity: 1,
      })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.data.cart.items).toHaveLength(1)
      expect(response.body.data.cart.items[0].quantity).toBe(3) // 2 + 1
      expect(response.body.data.cart.total).toBe(89.97) // 29.99 * 3
    })

    it("should return error when product not found", async () => {
      const response = await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${userToken}`).send({
        productId: "00000000-0000-0000-0000-000000000000",
        quantity: 1,
      })

      expect(response.status).toBe(404)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("Product not found")
    })

    it("should return error when quantity exceeds stock", async () => {
      const response = await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${userToken}`).send({
        productId,
        quantity: 100, // Stock is only 50
      })

      expect(response.status).toBe(400)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("Not enough stock available")
    })
  })

  describe("PATCH /api/v1/cart/:itemId", () => {
    it("should update cart item quantity", async () => {
      const response = await request(app)
        .patch(`/api/v1/cart/${cartItemId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          quantity: 5,
        })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.data.cart.items[0].quantity).toBe(5)
      expect(response.body.data.cart.total).toBe(149.95) // 29.99 * 5
    })

    it("should return error when cart item not found", async () => {
      const response = await request(app)
        .patch("/api/v1/cart/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          quantity: 1,
        })

      expect(response.status).toBe(404)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("Cart item not found")
    })
  })

  describe("DELETE /api/v1/cart/:itemId", () => {
    it("should remove item from cart", async () => {
      const response = await request(app)
        .delete(`/api/v1/cart/${cartItemId}`)
        .set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.data.cart.items).toHaveLength(0)
      expect(response.body.data.cart.total).toBe(0)
    })

    it("should return error when cart item not found", async () => {
      const response = await request(app)
        .delete("/api/v1/cart/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(404)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("Cart item not found")
    })
  })

  describe("DELETE /api/v1/cart/clear", () => {
    it("should add item to cart first", async () => {
      await request(app).post("/api/v1/cart").set("Authorization", `Bearer ${userToken}`).send({
        productId,
        quantity: 2,
      })
    })

    it("should clear cart", async () => {
      const response = await request(app).delete("/api/v1/cart/clear").set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.data.cart.items).toEqual([])
      expect(response.body.data.cart.total).toBe(0)
    })
  })
})
