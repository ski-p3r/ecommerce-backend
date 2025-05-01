import request from "supertest"
import { app } from "../app"
import { prisma } from "../config/prisma"
import jwt from "jsonwebtoken"

describe("Product Controller", () => {
  let adminToken: string
  let categoryId: string

  // Set up test data
  beforeAll(async () => {
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: "admin@example.com",
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
        name: "Test Category",
        slug: "test-category",
      },
    })

    categoryId = category.id
  })

  // Clean up after tests
  afterAll(async () => {
    await prisma.product.deleteMany()
    await prisma.category.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe("POST /api/v1/products", () => {
    it("should create a new product when admin is authenticated", async () => {
      const response = await request(app)
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Test Product",
          description: "This is a test product",
          price: 99.99,
          images: ["https://example.com/image.jpg"],
          stock: 100,
          categoryId,
        })

      expect(response.status).toBe(201)
      expect(response.body.status).toBe("success")
      expect(response.body.data.product).toHaveProperty("id")
      expect(response.body.data.product.name).toBe("Test Product")
      expect(response.body.data.product.slug).toBe("test-product")
      expect(response.body.data.product.price).toBe("99.99")
      expect(response.body.data.product.stock).toBe(100)
      expect(response.body.data.product.categoryId).toBe(categoryId)
    })

    it("should return error when not authenticated", async () => {
      const response = await request(app)
        .post("/api/v1/products")
        .send({
          name: "Unauthorized Product",
          description: "This product should not be created",
          price: 49.99,
          images: ["https://example.com/image.jpg"],
          stock: 50,
          categoryId,
        })

      expect(response.status).toBe(401)
      expect(response.body.status).toBe("error")
    })

    it("should return error when not admin", async () => {
      // Create regular user
      const user = await prisma.user.create({
        data: {
          email: "user@example.com",
          password: "hashedpassword",
          role: "CUSTOMER",
        },
      })

      // Generate user token
      const userToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_ACCESS_SECRET!, {
        expiresIn: "1h",
      })

      const response = await request(app)
        .post("/api/v1/products")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          name: "Unauthorized Product",
          description: "This product should not be created",
          price: 49.99,
          images: ["https://example.com/image.jpg"],
          stock: 50,
          categoryId,
        })

      expect(response.status).toBe(403)
      expect(response.body.status).toBe("error")
    })
  })

  describe("GET /api/v1/products", () => {
    it("should get all products", async () => {
      const response = await request(app).get("/api/v1/products")

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.data.products).toBeInstanceOf(Array)
      expect(response.body.data.pagination).toHaveProperty("page")
      expect(response.body.data.pagination).toHaveProperty("totalCount")
    })

    it("should filter products by category", async () => {
      const response = await request(app).get(`/api/v1/products?categoryId=${categoryId}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.data.products).toBeInstanceOf(Array)
      expect(response.body.data.products.length).toBeGreaterThan(0)
      expect(response.body.data.products[0].categoryId).toBe(categoryId)
    })
  })
})
