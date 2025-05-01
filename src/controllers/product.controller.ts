import type { Request, Response, NextFunction } from "express"
import { z } from "zod"
import slugify from "slugify"
import { prisma } from "../config/prisma"
import { AppError } from "../utils/appError"

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  price: z.number().positive(),
  images: z.array(z.string()).min(1),
  stock: z.number().int().nonnegative(),
  categoryId: z.string().uuid(),
})

const updateProductSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  images: z.array(z.string()).min(1).optional(),
  stock: z.number().int().nonnegative().optional(),
  categoryId: z.string().uuid().optional(),
})

const productFilterSchema = z.object({
  categoryId: z.string().uuid().optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  search: z.string().optional(),
  inStock: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  page: z.string().transform(Number).default("1"),
  limit: z.string().transform(Number).default("10"),
})

// Create a new product
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = createProductSchema.parse(req.body)

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: validatedData.categoryId },
    })

    if (!category) {
      return next(new AppError("Category not found", 404))
    }

    // Generate slug from name
    const slug = slugify(validatedData.name, { lower: true })

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    })

    if (existingProduct) {
      // Append random string to slug to make it unique
      const uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 8)}`

      // Create product with unique slug
      const product = await prisma.product.create({
        data: {
          ...validatedData,
          slug: uniqueSlug,
        },
      })

      return res.status(201).json({
        status: "success",
        data: {
          product,
        },
      })
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        ...validatedData,
        slug,
      },
    })

    res.status(201).json({
      status: "success",
      data: {
        product,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()))
    }
    next(error)
  }
}

// Get all products with filtering
export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate query parameters
    const filters = productFilterSchema.parse(req.query)

    // Build where clause for filtering
    const where: any = {}

    if (filters.categoryId) {
      where.categoryId = filters.categoryId
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {}

      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice
      }

      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice
      }
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ]
    }

    if (filters.inStock !== undefined) {
      where.stock = filters.inStock ? { gt: 0 } : { equals: 0 }
    }

    // Calculate pagination
    const page = filters.page || 1
    const limit = filters.limit || 10
    const skip = (page - 1) * limit

    // Get products with pagination
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    res.status(200).json({
      status: "success",
      data: {
        products,
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
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()))
    }
    next(error)
  }
}

// Get a single product by ID or slug
export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idOrSlug } = req.params

    // Check if parameter is UUID or slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)

    // Find product by ID or slug
    const product = await prisma.product.findFirst({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!product) {
      return next(new AppError("Product not found", 404))
    }

    res.status(200).json({
      status: "success",
      data: {
        product,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Update a product
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    // Validate request body
    const validatedData = updateProductSchema.parse(req.body)

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return next(new AppError("Product not found", 404))
    }

    // Check if category exists if provided
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
      })

      if (!category) {
        return next(new AppError("Category not found", 404))
      }
    }

    // Generate new slug if name is updated
    let slug: string | undefined
    if (validatedData.name && validatedData.name !== existingProduct.name) {
      slug = slugify(validatedData.name, { lower: true })

      // Check if new slug already exists
      const productWithSlug = await prisma.product.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      })

      if (productWithSlug) {
        // Append random string to slug to make it unique
        slug = `${slug}-${Math.random().toString(36).substring(2, 8)}`
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...validatedData,
        ...(slug && { slug }),
      },
    })

    res.status(200).json({
      status: "success",
      data: {
        product,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()))
    }
    next(error)
  }
}

// Delete a product
export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
    })

    if (!product) {
      return next(new AppError("Product not found", 404))
    }

    // Delete product
    await prisma.product.delete({
      where: { id },
    })

    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

// Create a new category
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body

    if (!name || typeof name !== "string") {
      return next(new AppError("Category name is required", 400))
    }

    // Generate slug from name
    const slug = slugify(name, { lower: true })

    // Check if category with same name or slug already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [{ name }, { slug }],
      },
    })

    if (existingCategory) {
      return next(new AppError("Category with this name already exists", 409))
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name,
        slug,
      },
    })

    res.status(201).json({
      status: "success",
      data: {
        category,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Get all categories
export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    })

    res.status(200).json({
      status: "success",
      data: {
        categories,
      },
    })
  } catch (error) {
    next(error)
  }
}
