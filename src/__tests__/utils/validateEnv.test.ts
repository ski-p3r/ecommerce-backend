import { validateEnv } from "../../utils/validateEnv"
import { logger } from "../../utils/logger"

// Mock logger
jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock process.exit
const mockExit = jest.spyOn(process, "exit").mockImplementation((code) => {
  throw new Error(`Process.exit called with code ${code}`)
})

describe("validateEnv", () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }

    // Set required environment variables
    process.env.NODE_ENV = "development"
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db"
    process.env.JWT_ACCESS_SECRET = "access_secret"
    process.env.JWT_REFRESH_SECRET = "refresh_secret"
    process.env.JWT_ACCESS_EXPIRES_IN = "15m"
    process.env.JWT_REFRESH_EXPIRES_IN = "7d"
    process.env.MINIO_ENDPOINT = "localhost"
    process.env.MINIO_PORT = "9000"
    process.env.MINIO_ACCESS_KEY = "minioadmin"
    process.env.MINIO_SECRET_KEY = "minioadmin"
    process.env.MINIO_BUCKET_NAME = "ecommerce"
    process.env.MINIO_USE_SSL = "false"
    process.env.CHAPA_SECRET_KEY = "chapa_secret"
    process.env.CHAPA_WEBHOOK_SECRET = "webhook_secret"
    process.env.EMAIL_HOST = "smtp.example.com"
    process.env.EMAIL_PORT = "587"
    process.env.EMAIL_USER = "user"
    process.env.EMAIL_PASS = "pass"
    process.env.EMAIL_FROM = "noreply@example.com"
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("should validate environment variables successfully", () => {
    validateEnv()
    expect(logger.info).toHaveBeenCalledWith("Environment variables validated successfully")
  })

  it("should exit process when required environment variable is missing", () => {
    delete process.env.DATABASE_URL

    expect(() => {
      validateEnv()
    }).toThrow("Process.exit called with code 1")

    expect(logger.error).toHaveBeenCalled()
    expect(mockExit).toHaveBeenCalledWith(1)
  })

  it("should exit process when environment variable has invalid format", () => {
    process.env.EMAIL_FROM = "invalid-email"

    expect(() => {
      validateEnv()
    }).toThrow("Process.exit called with code 1")

    expect(logger.error).toHaveBeenCalled()
    expect(mockExit).toHaveBeenCalledWith(1)
  })

  it("should transform string boolean to boolean", () => {
    process.env.MINIO_USE_SSL = "true"
    validateEnv()
    expect(logger.info).toHaveBeenCalledWith("Environment variables validated successfully")
  })
})
