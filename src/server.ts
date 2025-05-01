import { app } from "./app"
import { logger } from "./utils/logger"
import { createBucket } from "./utils/minio"

const PORT = process.env.PORT || 3000

// Create MinIO bucket if it doesn't exist
createBucket()
  .then(() => {
    logger.info("MinIO bucket created or already exists")
  })
  .catch((error) => {
    logger.error("Failed to create MinIO bucket:", error)
  })

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! Shutting down...", err)
  server.close(() => {
    process.exit(1)
  })
})

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! Shutting down...", err)
  process.exit(1)
})
