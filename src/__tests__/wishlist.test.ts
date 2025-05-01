import request from "supertest"
import { app } from "../app"
import { prisma } from "../config/prisma"
import jwt from "jsonwebtoken"

describe("Wishlist Controller", () => {
  let userToken: string
  let userId: string
  let productId: string

  // Set up test data
  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: "wishlist-test@example.com",
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
        name: "Wishlist Test Category",
        slug: "wishlist-test-category",
      },
    })

    // Create test product
    const product = await prisma.product.create({
      data: {
        name: "Wishlist Test Product",
        slug: "wishlist-test-product",
        description: "This is a test product for wishlist tests",
        price: 39.99,
        images: ["https://example.com/wishlist-test.jpg"],
        stock: 25,
        categoryId: category.id,
      },
    })

    productId = product.id
  })

  // Clean up after tests
  afterAll(async () => {
    await prisma.wishlistItem.deleteMany()
    await prisma.wishlist.deleteMany()
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe("GET /api/v1/wishlist", () => {
    it("should get empty wishlist for new user", async () => {
      const response = await request(app).get("/api/v1/wishlist").set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.data.wishlist).toHaveProperty("id")
      expect(response.body.data.wishlist.userId).toBe(userId)
      expect(response.body.data.wishlist.items).toEqual([])
    })

    it("should return error when not authenticated", async () => {
      const response = await request(app).get("/api/v1/wishlist")

      expect(response.status).toBe(401)
      expect(response.body.status).toBe("error")
    })
  })

  describe("POST /api/v1/wishlist", () => {
    it("should add item to wishlist", async () => {
      const response = await request(app).post("/api/v1/wishlist").set("Authorization", `Bearer ${userToken}`).send({
        productId,
      })

      expect(response.status).toBe(201)
      expect(response.body.status).toBe("success")
      expect(response.body.message).toBe("Item added to wishlist")
    })

    it("should not add duplicate item to wishlist", async () => {
      const response = await request(app).post("/api/v1/wishlist").set("Authorization", `Bearer ${userToken}`).send({
        productId,
      })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.message).toBe("Item already in wishlist")
    })

    it("should return error when product not found", async () => {
      const response = await request(app).post("/api/v1/wishlist").set("Authorization", `Bearer ${userToken}`).send({
        productId: "00000000-0000-0000-0000-000000000000",
      })

      expect(response.status).toBe(404)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("Product not found")
    })
  })

  describe("GET /api/v1/wishlist after adding item", () => {
    it("should get wishlist with added item", async () => {
      const response = await request(app).get("/api/v1/wishlist").set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.data.wishlist).toHaveProperty("id")
      expect(response.body.data.wishlist.items).toHaveLength(1)
      expect(response.body.data.wishlist.items[0].productId).toBe(productId)
      expect(response.body.data.wishlist.items[0].product.name).toBe("Wishlist Test Product")
    })
  })

  describe("DELETE /api/v1/wishlist/:productId", () => {
    it("should remove item from wishlist", async () => {
      const response = await request(app)
        .delete(`/api/v1/wishlist/${productId}`)
        .set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.message).toBe("Item removed from wishlist")

      // Verify item is removed
      const wishlist = await prisma.wishlist.findUnique({
        where: { userId },
        include: { items: true },
      })

      expect(wishlist!.items).toHaveLength(0)
    })

    it("should handle removing non-existent item gracefully", async () => {
      const response = await request(app)
        .delete(`/api/v1/wishlist/${productId}`)
        .set("Authorization", `Bearer ${userToken}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.message).toBe("Item removed from wishlist")
    })
  })
})
