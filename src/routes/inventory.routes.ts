import express from "express";
import {
  updateStock,
  updateLowStockAlert,
  getInventoryLogs,
  getLowStockProducts,
} from "../controllers/inventory.controller";
import { protect, restrictTo } from "../middlewares/auth.middleware";

const router: express.Router = express.Router();

// All inventory routes require admin authentication
router.use(protect, restrictTo("ADMIN"));

/**
 * @swagger
 * /inventory/products/{productId}/stock:
 *   patch:
 *     summary: Update product stock
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
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
 *             required:
 *               - quantity
 *               - type
 *             properties:
 *               quantity:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [add, remove, adjust]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *       400:
 *         description: Validation error or invalid operation
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Product not found
 */
router.patch("/products/:productId/stock", updateStock);

/**
 * @swagger
 * /inventory/products/{productId}/low-stock-alert:
 *   patch:
 *     summary: Update low stock alert threshold
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
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
 *             required:
 *               - lowStockAlert
 *             properties:
 *               lowStockAlert:
 *
 *               - lowStockAlert
 *             properties:
 *               lowStockAlert:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Low stock alert threshold updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Product not found
 */
router.patch("/products/:productId/low-stock-alert", updateLowStockAlert);

/**
 * @swagger
 * /inventory/products/{productId}/logs:
 *   get:
 *     summary: Get inventory logs for a product
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Inventory logs retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Product not found
 */
router.get("/products/:productId/logs", getInventoryLogs);

/**
 * @swagger
 * /inventory/low-stock:
 *   get:
 *     summary: Get low stock products
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Low stock products retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get("/low-stock", getLowStockProducts);

export { router as inventoryRoutes };
