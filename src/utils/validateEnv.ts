import { z } from "zod";
import { logger } from "./logger";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRES_IN: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string(),
  MINIO_ENDPOINT: z.string(),
  MINIO_PORT: z.string(),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET_NAME: z.string(),
  MINIO_USE_SSL: z.string().transform((val) => val === "true"),
  CHAPA_SECRET_KEY: z.string(),
  CHAPA_WEBHOOK_SECRET: z.string(),
  EMAIL_HOST: z.string(),
  EMAIL_PORT: z.string().transform(Number),
  EMAIL_USER: z.string(),
  EMAIL_PASS: z.string(),
  EMAIL_FROM: z.string().email(),
});

export function validateEnv() {
  try {
    envSchema.parse(process.env);
    logger.info("Environment variables validated successfully");
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error("Invalid environment variables:", error.errors);
      process.exit(1);
    }
  }
}
