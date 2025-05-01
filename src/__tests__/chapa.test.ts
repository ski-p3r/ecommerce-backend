import request from "supertest"
import { app } from "../app"
import { prisma } from "../config/prisma"
import crypto from "crypto"

// Mock Chapa API
jest.mock("../utils/chapa", () => ({
  verifyTransaction: jest.fn().mockResolvedValue({
    tx_ref: "test-tx-ref",
    flw_ref: "test-flw-ref",
    amount: "59.98",
    currency: "ETB",
    status: "success",
    payment_date: new Date().toISOString(),
  }),
}))

// Mock email service
jest.mock("../utils/email", () => ({
  sendEmail: jest.fn().mockResolvedValue({}),
}))

describe("Chapa Controller", () => {
  let orderId: string
  let userId: string

  // Set up test data
  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: "chapa-test@example.com",
        password: "hashedpassword",
        role: "CUSTOMER",
      },
    })

    userId = user.id

    // Create test order
    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount: 59.98,
        shippingAddress: "123 Test Street, Test City",
        paymentReference: "test-tx-ref",
        status: "PENDING",
        paymentStatus: false,
      },
    })

    orderId = order.id
  })

  // Clean up after tests
  afterAll(async () => {
    await prisma.order.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()
  })

  describe("POST /api/v1/chapa/verify", () => {
    it("should verify payment and update order status", async () => {
      // Create webhook payload
      const payload = {
        tx_ref: "test-tx-ref",
        status: "success",
        amount: "59.98",
        currency: "ETB",
      }

      // Create signature
      const signature = crypto
        .createHmac("sha256", process.env.CHAPA_WEBHOOK_SECRET!)
        .update(JSON.stringify(payload))
        .digest("hex")

      const response = await request(app).post("/api/v1/chapa/verify").set("chapa-signature", signature).send(payload)

      expect(response.status).toBe(200)
      expect(response.body.received).toBe(true)

      // Verify order is updated
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      })

      expect(order!.status).toBe("PAID")
      expect(order!.paymentStatus).toBe(true)
    })

    it("should reject request with invalid signature", async () => {
      const payload = {
        tx_ref: "test-tx-ref",
        status: "success",
      }

      const response = await request(app)
        .post("/api/v1/chapa/verify")
        .set("chapa-signature", "invalid-signature")
        .send(payload)

      expect(response.status).toBe(401)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("Invalid signature")
    })

    it("should reject request with no signature", async () => {
      const payload = {
        tx_ref: "test-tx-ref",
        status: "success",
      }

      const response = await request(app).post("/api/v1/chapa/verify").send(payload)

      expect(response.status).toBe(400)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("No signature provided")
    })
  })

  describe("GET /api/v1/chapa/redirect", () => {
    it("should redirect after payment", async () => {
      const response = await request(app).get("/api/v1/chapa/redirect").query({
        tx_ref: "test-tx-ref",
        status: "success",
      })

      // Should redirect to frontend
      expect(response.status).toBe(302)
    })

    it("should return error when tx_ref is missing", async () => {
      const response = await request(app).get("/api/v1/chapa/redirect").query({
        status: "success",
      })

      expect(response.status).toBe(400)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("No transaction reference provided")
    })

    it("should return error when order not found", async () => {
      const response = await request(app).get("/api/v1/chapa/redirect").query({
        tx_ref: "non-existent-tx-ref",
        status: "success",
      })

      expect(response.status).toBe(404)
      expect(response.body.status).toBe("error")
      expect(response.body.message).toBe("Order not found")
    })
  })
})
