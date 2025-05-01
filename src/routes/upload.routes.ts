import express from "express";
import { getUploadUrl } from "../controllers/upload.controller";
import { protect } from "../middlewares/auth.middleware";

const router: express.Router = express.Router();

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Get presigned URL for file upload
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileName
 *               - fileType
 *             properties:
 *               fileName:
 *                 type: string
 *               fileType:
 *                 type: string
 *                 enum: [image/jpeg, image/png, image/webp, image/gif]
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 */
router.post("/", protect, getUploadUrl);

export { router as uploadRoutes };
