import type { Request, Response, NextFunction } from "express"
import { z } from "zod"
import { prisma } from "../config/prisma"
import { AppError } from "../utils/appError"

// Validation schemas
const updateStockSchema = z.object({
  quantity: z.number().int(),
  type: z.enum(["add", "remove", "adjust"]),
  description: z.string().optional(),
})

const updateLowStockAlertSchema = z.object({
  lowStockAlert: z.number().int().min(1),
})

// Update product stock
export const updateStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params
    const validatedData = updateStockSchema.parse(req.body)
    const userId = req.user!.id

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return next(new AppError("Product not found", 404))
    }

    // Calculate new stock based on operation type
    let newStock: number
    switch (validatedData.type) {
      case "add":
        newStock = product.stock + validatedData.quantity
        break
      case "remove":
        newStock = product.stock - validatedData.quantity
        if (newStock < 0) {
          return next(new AppError("Cannot remove more than available stock", 400))
        }
        break
      case "adjust":
        newStock = validatedData.quantity
        break
      default:
        return next(new AppError("Invalid operation type", 400))
    }

    // Update product stock and create inventory log
    const [updatedProduct, inventoryLog] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { stock: newStock },
      }),
      prisma.inventoryLog.create({
        data: {
          productId,
          quantity: validatedData.quantity,
          type: validatedData.type,
          description: validatedData.description,
          createdBy: userId,
        },
      }),
    ])

    res.status(200).json({
      status: "success",
      data: {
        product: updatedProduct,
        inventoryLog,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()))
    }
    next(error)
  }
}

// Update low stock alert threshold
export const updateLowStockAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params
    const validatedData = updateLowStockAlertSchema.parse(req.body)

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return next(new AppError("Product not found", 404))
    }

    // Update low stock alert threshold
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        lowStockAlert: validatedData.lowStockAlert,
      },
    })

    res.status(200).json({
      status: "success",
      data: {
        product: updatedProduct,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()))
    }
    next(error)
  }
}

// Get inventory logs for a product
export const getInventoryLogs = async (req: Request, res: Response, next: NextFunction) => {
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

    // Get inventory logs with pagination
    const [logs, totalCount] = await Promise.all([
      prisma.inventoryLog.findMany({
        where: { productId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.inventoryLog.count({ where: { productId } }),
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    res.status(200).json({
      status: "success",
      data: {
        logs,
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

// Get low stock products
export const getLowStockProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        stock: {
          lte: prisma.product.fields.lowStockAlert,
        },
      },
      orderBy: { stock: "asc" },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    res.status(200).json({
      status: "success",
      data: {
        products,
        count: products.length,
      },
    })
  } catch (error) {
    next(error)
  }
}
