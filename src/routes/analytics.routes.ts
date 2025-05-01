import express from "express";
import {
  getSalesAnalytics,
  getProductAnalytics,
  getCustomerAnalytics,
  getDashboardOverview,
  getHistoricalStats,
} from "../controllers/analytics.controller";
import { protect, restrictTo } from "../middlewares/auth.middleware";

const router: express.Router = express.Router();

// All analytics routes require admin authentication
router.use(protect, restrictTo("ADMIN"));

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get dashboard overview
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get("/dashboard", getDashboardOverview);

/**
 * @swagger
 * /analytics/sales:
 *   get:
 *     summary: Get sales analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: weekly
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Sales analytics retrieved successfully
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get("/sales", getSalesAnalytics);

/**
 * @swagger
 * /analytics/products:
 *   get:
 *     summary: Get product analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Product analytics retrieved successfully
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get("/products", getProductAnalytics);

/**
 * @swagger
 * /analytics/customers:
 *   get:
 *     summary: Get customer analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Customer analytics retrieved successfully
 *       400:
 *         description: Invalid date range
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get("/customers", getCustomerAnalytics);

/**
 * @swagger
 * /analytics/historical:
 *   get:
 *     summary: Get historical stats
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Historical stats retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get("/historical", getHistoricalStats);

export { router as analyticsRoutes };
