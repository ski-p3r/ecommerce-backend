import request from "supertest"
import { app } from "../app"
import { prisma } from "../config/prisma"

// Mock email service
jest.mock("../utils/email", () => ({
  sendEmail: jest.fn().mockResolvedValue({}),
}))

describe("Auth Controller", () => {
  // Clean up database after tests
  afterAll(async () => {
    await prisma.refreshToken.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        email: "test@example.com",
        password: "password123",
        firstName: "Test",
        lastName: "User",
      })

      expect(response.status).toBe(201)
      expect(response.body.status).toBe("success")
      expect(response.body.data.user).toHaveProperty("id")
      expect(response.body.data.user.email).toBe("test@example.com")
      expect(response.body.data.user.firstName).toBe("Test")
      expect(response.body.data.user.lastName).toBe("User")
      expect(response.body.data.user).not.toHaveProperty("password")
      expect(response.body.data).toHaveProperty("accessToken")
      expect(response.body.data).toHaveProperty("refreshToken")
    })

    it("should return validation error for invalid email", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        email: "invalid-email",
        password: "password123",
      })

      expect(response.status).toBe(400)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("Validation error")
    })

    it("should return validation error for short password", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        email: "test2@example.com",
        password: "short",
      })

      expect(response.status).toBe(400)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("Validation error")
    })

    it("should return error for duplicate email", async () => {
      const response = await request(app).post("/api/v1/auth/register").send({
        email: "test@example.com",
        password: "password123",
      })

      expect(response.status).toBe(409)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("User already exists with this email")
    })
  })

  describe("POST /api/v1/auth/login", () => {
    it("should login a user with valid credentials", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: "password123",
      })

      expect(response.status).toBe(200)
      expect(response.body.status).toBe("success")
      expect(response.body.data.user).toHaveProperty("id")
      expect(response.body.data.user.email).toBe("test@example.com")
      expect(response.body.data).toHaveProperty("accessToken")
      expect(response.body.data).toHaveProperty("refreshToken")
    })

    it("should return error for invalid credentials", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      })

      expect(response.status).toBe(401)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("Invalid email or password")
    })

    it("should return error for non-existent user", async () => {
      const response = await request(app).post("/api/v1/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      })

      expect(response.status).toBe(401)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("Invalid email or password")
    })
  })
})
