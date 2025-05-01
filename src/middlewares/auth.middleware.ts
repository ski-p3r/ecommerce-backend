import type { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { prisma } from "../config/prisma"
import { AppError } from "../utils/appError"

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
      }
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization
    let token

    if (authHeader && authHeader.startsWith("Bearer")) {
      token = authHeader.split(" ")[1]
    }

    if (!token) {
      return next(new AppError("Not authenticated. Please log in", 401))
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
      id: string
      email: string
      role: string
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!user) {
      return next(new AppError("User no longer exists", 401))
    }

    // Set user in request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError("Invalid token. Please log in again", 401))
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError("Token expired. Please log in again", 401))
    }
    next(error)
  }
}

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Not authenticated. Please log in", 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403))
    }

    next()
  }
}
