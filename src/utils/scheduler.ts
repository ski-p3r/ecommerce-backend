import cron from "node-cron"
import { generateDailyStats } from "../controllers/analytics.controller"
import { logger } from "./logger"

// Schedule jobs
export const startScheduledJobs = () => {
  // Generate daily stats at 1:00 AM every day
  cron.schedule("0 1 * * *", async () => {
    logger.info("Running scheduled job: Generate daily stats")
    try {
      await generateDailyStats()
      logger.info("Daily stats generated successfully")
    } catch (error) {
      logger.error("Error generating daily stats:", error)
    }
  })

  logger.info("Scheduled jobs started")
}
