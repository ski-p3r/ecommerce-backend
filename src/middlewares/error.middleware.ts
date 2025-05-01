import type { Request, Response, NextFunction } from "express"
import { Prisma } from "@prisma/client"
import { logger } from "../utils/logger"
import { AppError } from "../utils/appError"

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err)

  // Default error
  let statusCode = 500
  let message = "Something went wrong"
  let errors: any = {}

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
    errors = err.errors
  }
  // Handle Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409
      message = "Duplicate field value entered"
      errors = {
        field: err.meta?.target as string[],
      }
    } else if (err.code === "P2025") {
      statusCode = 404
      message = "Record not found"
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400
    message = "Validation error"
  }

  // Send error response
  res.status(statusCode).json({
    status: "error",
    message,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  })
}
