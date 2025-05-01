import type { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { prisma } from "../config/prisma"
import { AppError } from "../utils/appError"

// Validation schemas
const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
})

const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
})

// Get user's cart
export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id

    // Find or create cart
    let cart = await prisma.cart.findUnique({
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

    if (!cart) {
      cart = await prisma.cart.create({
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

    // Calculate total
    const total = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity
    }, 0)

    res.status(200).json({
      status: "success",
      data: {
        cart: {
          ...cart,
          total,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

// Add item to cart
export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = cartItemSchema.parse(req.body)
    const userId = req.user!.id

    // Check if product exists and is in stock
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
    })

    if (!product) {
      return next(new AppError("Product not found", 404))
    }

    if (product.stock < validatedData.quantity) {
      return next(new AppError("Not enough stock available", 400))
    }

    // Find or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
        },
      })
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: validatedData.productId,
        },
      },
    })

    if (existingItem) {
      // Update quantity if item already exists
      const newQuantity = existingItem.quantity + validatedData.quantity

      if (product.stock < newQuantity) {
        return next(new AppError("Not enough stock available", 400))
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
        },
      })
    } else {
      // Add new item to cart
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: validatedData.productId,
          quantity: validatedData.quantity,
        },
      })
    }

    // Get updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
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

    // Calculate total
    const total = updatedCart!.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity
    }, 0)

    res.status(200).json({
      status: "success",
      data: {
        cart: {
          ...updatedCart,
          total,
        },
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()))
    }
    next(error)
  }
}

// Update cart item quantity
export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params
    const validatedData = updateCartItemSchema.parse(req.body)
    const userId = req.user!.id

    // Find cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
    })

    if (!cart) {
      return next(new AppError("Cart not found", 404))
    }

    // Find cart item
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      include: {
        product: true,
      },
    })

    if (!cartItem) {
      return next(new AppError("Cart item not found", 404))
    }

    // Check stock
    if (cartItem.product.stock < validatedData.quantity) {
      return next(new AppError("Not enough stock available", 400))
    }

    // Update cart item
    await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: validatedData.quantity,
      },
    })

    // Get updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
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

    // Calculate total
    const total = updatedCart!.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity
    }, 0)

    res.status(200).json({
      status: "success",
      data: {
        cart: {
          ...updatedCart,
          total,
        },
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()))
    }
    next(error)
  }
}

// Remove item from cart
export const removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params
    const userId = req.user!.id

    // Find cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
    })

    if (!cart) {
      return next(new AppError("Cart not found", 404))
    }

    // Find cart item
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    })

    if (!cartItem) {
      return next(new AppError("Cart item not found", 404))
    }

    // Remove cart item
    await prisma.cartItem.delete({
      where: { id: itemId },
    })

    // Get updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
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

    // Calculate total
    const total = updatedCart!.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity
    }, 0)

    res.status(200).json({
      status: "success",
      data: {
        cart: {
          ...updatedCart,
          total,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}

// Clear cart
export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id

    // Find cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
    })

    if (!cart) {
      return next(new AppError("Cart not found", 404))
    }

    // Remove all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    })

    res.status(200).json({
      status: "success",
      data: {
        cart: {
          ...cart,
          items: [],
          total: 0,
        },
      },
    })
  } catch (error) {
    next(error)
  }
}
