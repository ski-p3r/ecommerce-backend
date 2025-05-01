import type { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { prisma } from "../config/prisma"
import { AppError } from "../utils/appError"

// Validation schemas
const createReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
})

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
})

// Create a new review
export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = createReviewSchema.parse(req.body)
    const userId = req.user!.id

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
    })

    if (!product) {
      return next(new AppError("Product not found", 404))
    }

    // Check if user has purchased the product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: validatedData.productId,
        order: {
          userId,
          status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
        },
      },
    })

    if (!hasPurchased) {
      return next(new AppError("You can only review products you have purchased", 403))
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: validatedData.productId,
        },
      },
    })

    if (existingReview) {
      return next(new AppError("You have already reviewed this product", 409))
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId,
        productId: validatedData.productId,
        rating: validatedData.rating,
        comment: validatedData.comment,
      },
    })

    // Update product average rating
    const productReviews = await prisma.review.findMany({
      where: { productId: validatedData.productId },
      select: { rating: true },
    })

    const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0)
    const avgRating = totalRating / productReviews.length

    await prisma.product.update({
      where: { id: validatedData.productId },
      data: {
        avgRating,
        ratingCount: productReviews.length,
      },
    })

    res.status(201).json({
      status: "success",
      data: {
        review,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()))
    }
    next(error)
  }
}

// Update a review
export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const validatedData = updateReviewSchema.parse(req.body)
    const userId = req.user!.id

    // Check if review exists and belongs to user
    const review = await prisma.review.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!review) {
      return next(new AppError("Review not found or not authorized", 404))
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id },
      data: validatedData,
    })

    // Update product average rating if rating changed
    if (validatedData.rating && validatedData.rating !== review.rating) {
      const productReviews = await prisma.review.findMany({
        where: { productId: review.productId },
        select: { rating: true },
      })

      const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0)
      const avgRating = totalRating / productReviews.length

      await prisma.product.update({
        where: { id: review.productId },
        data: {
          avgRating,
        },
      })
    }

    res.status(200).json({
      status: "success",
      data: {
        review: updatedReview,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()))
    }
    next(error)
  }
}

// Delete a review
export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const isAdmin = req.user!.role === "ADMIN"

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id },
    })

    if (!review) {
      return next(new AppError("Review not found", 404))
    }

    // Check if user is authorized to delete the review
    if (!isAdmin && review.userId !== userId) {
      return next(new AppError("Not authorized", 403))
    }

    // Delete review
    await prisma.review.delete({
      where: { id },
    })

    // Update product average rating
    const productReviews = await prisma.review.findMany({
      where: { productId: review.productId },
      select: { rating: true },
    })

    if (productReviews.length > 0) {
      const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0)
      const avgRating = totalRating / productReviews.length

      await prisma.product.update({
        where: { id: review.productId },
        data: {
          avgRating,
          ratingCount: productReviews.length,
        },
      })
    } else {
      await prisma.product.update({
        where: { id: review.productId },
        data: {
          avgRating: null,
          ratingCount: 0,
        },
      })
    }

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

// Get reviews for a product
export const getProductReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return next(new AppError("Product not found", 404))
    }

    // Get reviews with pagination
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { productId } }),
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    res.status(200).json({
      status: "success",
      data: {
        reviews,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

// Get user's reviews
export const getUserReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Get reviews with pagination
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { userId } }),
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    res.status(200).json({
      status: "success",
      data: {
        reviews,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}
