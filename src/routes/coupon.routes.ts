import express from "express";
import {
  createCoupon,
  getAllCoupons,
  getCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  removeCoupon,
} from "../controllers/coupon.controller";
import { protect, restrictTo } from "../middlewares/auth.middleware";

const router: express.Router = express.Router();

/**
 * @swagger
 * /coupons:
 *   post:
 *     summary: Create a new coupon (admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - type
 *               - value
 *               - startDate
 *               - endDate
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *               type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *               value:
 *                 type: number
 *                 minimum: 0
 *               minAmount:
 *                 type: number
 *                 minimum: 0
 *               maxAmount:
 *                 type: number
 *                 minimum: 0
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               usageLimit:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       409:
 *         description: Coupon code already exists
 */
router.post("/", protect, restrictTo("ADMIN"), createCoupon);

/**
 * @swagger
 * /coupons:
 *   get:
 *     summary: Get all coupons (admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Coupons retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get("/", protect, restrictTo("ADMIN"), getAllCoupons);

/**
 * @swagger
 * /coupons/{id}:
 *   get:
 *     summary: Get a single coupon (admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Coupon retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Coupon not found
 */
router.get("/:id", protect, restrictTo("ADMIN"), getCoupon);

/**
 * @swagger
 * /coupons/{id}:
 *   patch:
 *     summary: Update a coupon (admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 20
 *               type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *               value:
 *                 type: number
 *                 minimum: 0
 *               minAmount:
 *                 type: number
 *                 minimum: 0
 *               maxAmount:
 *                 type: number
 *                 minimum: 0
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *               usageLimit:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Coupon not found
 *       409:
 *         description: Coupon code already exists
 */
router.patch("/:id", protect, restrictTo("ADMIN"), updateCoupon);

/**
 * @swagger
 * /coupons/{id}:
 *   delete:
 *     summary: Delete a coupon (admin only)
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Coupon deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Coupon not found
 */
router.delete("/:id", protect, restrictTo("ADMIN"), deleteCoupon);

/**
 * @swagger
 * /coupons/validate:
 *   post:
 *     summary: Validate a coupon code
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - amount
 *             properties:
 *               code:
 *                 type: string
 *               amount:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Coupon validation result
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.post(
  "/validate",
  protect,
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      await validateCoupon(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /coupons/apply:
 *   post:
 *     summary: Apply a coupon to an order
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - code
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 *       400:
 *         description: Validation error or coupon not applicable
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Order or coupon not found
 */
router.post("/apply", protect, applyCoupon);

/**
 * @swagger
 * /coupons/remove:
 *   post:
 *     summary: Remove a coupon from an order
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Coupon removed successfully
 *       400:
 *         description: Validation error or no coupon applied
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Order not found
 */
router.post("/remove", protect, removeCoupon);

export { router as couponRoutes };
