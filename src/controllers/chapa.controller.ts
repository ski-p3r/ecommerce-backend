import type { Request, Response, NextFunction } from "express"
import crypto from "crypto"
import { prisma } from "../config/prisma"
import { AppError } from "../utils/appError"
import { verifyTransaction } from "../utils/chapa"
import { sendEmail } from "../utils/email"
import { logger } from "../utils/logger"

// Verify payment webhook
export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verify webhook signature
    const signature = req.headers["chapa-signature"]

    if (!signature) {
      return next(new AppError("No signature provided", 400))
    }

    const payload = JSON.stringify(req.body)
    const expectedSignature = crypto
      .createHmac("sha256", process.env.CHAPA_WEBHOOK_SECRET!)
      .update(payload)
      .digest("hex")

    if (signature !== expectedSignature) {
      return next(new AppError("Invalid signature", 401))
    }

    // Extract transaction reference
    const { tx_ref, status } = req.body

    if (!tx_ref) {
      return next(new AppError("No transaction reference provided", 400))
    }

    // Find order with this payment reference
    const order = await prisma.order.findFirst({
      where: { paymentReference: tx_ref },
      include: {
        user: true,
      },
    })

    if (!order) {
      return next(new AppError("Order not found", 404))
    }

    // If payment is successful
    if (status === "success") {
      // Verify transaction with Chapa API
      const verificationResult = await verifyTransaction(tx_ref)

      if (verificationResult.status === "success") {
        // Update order status
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: "PAID",
            paymentStatus: true,
          },
        })

        // Send payment confirmation email
        try {
          await sendEmail({
            to: order.user.email,
            subject: "Payment Confirmation",
            text: `Your payment for order #${order.id} has been confirmed. Thank you for your purchase!`,
            html: `
              <h1>Payment Confirmation</h1>
              <p>Your payment for order #${order.id} has been confirmed.</p>
              <p>Amount: ${order.totalAmount}</p>
              <p>Thank you for your purchase!</p>
            `,
          })
        } catch (error) {
          logger.error("Failed to send payment confirmation email:", error)
        }
      }
    }

    // Respond to webhook
    res.status(200).json({ received: true })
  } catch (error) {
    next(error)
  }
}

// Redirect after payment
export const paymentRedirect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tx_ref, status } = req.query

    if (!tx_ref) {
      return next(new AppError("No transaction reference provided", 400))
    }

    // Find order with this payment reference
    const order = await prisma.order.findFirst({
      where: { paymentReference: tx_ref as string },
    })

    if (!order) {
      return next(new AppError("Order not found", 404))
    }

    // Redirect to frontend with appropriate status
    const redirectUrl = `${process.env.FRONTEND_URL}/orders/${order.id}?payment=${status}`
    res.redirect(redirectUrl)
  } catch (error) {
    next(error)
  }
}
