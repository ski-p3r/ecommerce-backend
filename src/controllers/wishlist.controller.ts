import type { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { prisma } from "../config/prisma"
import { AppError } from "../utils/appError"

// Validation schema
const wishlistItemSchema = z.object({
  productId: z.string().uuid(),
})

// Get user's wishlist
export const getWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id

    // Find or create wishlist
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                images: true,
                stock: true,
              },
            },
          },
        },
      },
    })

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: {
          userId,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  images: true,
                  stock: true,
                },
              },
            },
          },
        },
      })
    }

    res.status(200).json({
      status: "success",
      data: {
        wishlist,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Add item to wishlist
export const addToWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = wishlistItemSchema.parse(req.body)
    const userId = req.user!.id

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
    })

    if (!product) {
      return next(new AppError("Product not found", 404))
    }

    // Find or create wishlist
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId },
    })

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: {
          userId,
        },
      })
    }

    // Check if item already in wishlist
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId: validatedData.productId,
        },
      },
    })

    if (existingItem) {
      return res.status(200).json({
        status: "success",
        message: "Item already in wishlist",
      })
    }

    // Add item to wishlist
    await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId: validatedData.productId,
      },
    })

    res.status(201).json({
      status: "success",
      message: "Item added to wishlist",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()))
    }
    next(error)
  }
}

// Remove item from wishlist
export const removeFromWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params
    const userId = req.user!.id

    // Find wishlist
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId },
    })

    if (!wishlist) {
      return next(new AppError("Wishlist not found", 404))
    }

    // Remove item from wishlist
    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
    })

    res.status(200).json({
      status: "success",
      message: "Item removed from wishlist",
    })
  } catch (error) {
    next(error)
  }
}
