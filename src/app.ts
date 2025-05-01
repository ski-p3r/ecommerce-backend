import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import { errorHandler } from "./middlewares/error.middleware";
import { authRoutes } from "./routes/auth.routes";
import { productRoutes } from "./routes/product.routes";
import { cartRoutes } from "./routes/cart.routes";
import { orderRoutes } from "./routes/order.routes";
import { wishlistRoutes } from "./routes/wishlist.routes";
import { uploadRoutes } from "./routes/upload.routes";
import { chapaRoutes } from "./routes/chapa.routes";
import { reviewRoutes } from "./routes/review.routes";
import { inventoryRoutes } from "./routes/inventory.routes";
import { analyticsRoutes } from "./routes/analytics.routes";
import { couponRoutes } from "./routes/coupon.routes";
import { validateEnv } from "./utils/validateEnv";
import { logger } from "./utils/logger";
import { startScheduledJobs } from "./utils/scheduler";

// Validate environment variables
validateEnv();

const app: express.Application = express();

// Set security HTTP headers
app.use(helmet());

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());

// Compress response bodies
app.use(compression());

// Request logging
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce API",
      version: "1.0.0",
      description: "E-Commerce API",
    },
    servers: [
      {
        url: "https://ecommerce-backend-tqgh.onrender.com/api/v1",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/chapa", chapaRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/coupons", couponRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Error handling middleware
app.use(errorHandler);

// Start scheduled jobs in production
if (process.env.NODE_ENV === "production") {
  startScheduledJobs();
}

export { app };
