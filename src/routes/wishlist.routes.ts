import express from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/wishlist.controller";
import { protect } from "../middlewares/auth.middleware";

const router: express.Router = express.Router();

// All wishlist routes require authentication
router.use(protect);

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get("/", getWishlist);

/**
 * @swagger
 * /wishlist:
 *   post:
 *     summary: Add item to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Item added to wishlist
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Product not found
 */
router.post("/", addToWishlist as express.RequestHandler);

/**
 * @swagger
 * /wishlist/{productId}:
 *   delete:
 *     summary: Remove item from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Item removed from wishlist
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Wishlist not found
 */
router.delete("/:productId", removeFromWishlist);

export { router as wishlistRoutes };
