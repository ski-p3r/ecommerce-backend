import express from "express";
import {
  verifyPayment,
  paymentRedirect,
} from "../controllers/chapa.controller";

const router: express.Router = express.Router();

/**
 * @swagger
 * /chapa/verify:
 *   post:
 *     summary: Webhook for Chapa payment verification
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid signature
 */
router.post("/verify", verifyPayment);

/**
 * @swagger
 * /chapa/redirect:
 *   get:
 *     summary: Redirect URL after payment
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: tx_ref
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirect to frontend
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Order not found
 */
router.get("/redirect", paymentRedirect);

export { router as chapaRoutes };
