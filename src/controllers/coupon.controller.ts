import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";

// Validation schemas
const createCouponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().positive().optional(),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  isActive: z.boolean().default(true),
  usageLimit: z.number().int().positive().optional(),
});

const updateCouponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase().optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  value: z.number().positive().optional(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().positive().optional(),
  startDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  endDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  isActive: z.boolean().optional(),
  usageLimit: z.number().int().positive().optional(),
});

const validateCouponSchema = z.object({
  code: z.string().toUpperCase(),
  amount: z.number().positive(),
});

const applyCouponSchema = z.object({
  orderId: z.string().uuid(),
  code: z.string().toUpperCase(),
});

const removeCouponSchema = z.object({
  orderId: z.string().uuid(),
});

// Create a new coupon (admin only)
export const createCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body
    const validatedData = createCouponSchema.parse(req.body);

    // Check if coupon code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: validatedData.code },
    });

    if (existingCoupon) {
      return next(new AppError("Coupon code already exists", 409));
    }

    // Validate dates
    if (validatedData.startDate >= validatedData.endDate) {
      return next(new AppError("End date must be after start date", 400));
    }

    if (validatedData.startDate < new Date()) {
      return next(new AppError("Start date cannot be in the past", 400));
    }

    // Validate min and max amount
    if (
      validatedData.minAmount &&
      validatedData.maxAmount &&
      validatedData.minAmount >= validatedData.maxAmount
    ) {
      return next(
        new AppError("Minimum amount must be less than maximum amount", 400)
      );
    }

    // Create coupon
    const coupon = await prisma.coupon.create({
      data: validatedData,
    });

    res.status(201).json({
      status: "success",
      data: {
        coupon,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()));
    }
    next(error);
  }
};

// Get all coupons (admin only)
export const getAllCoupons = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const active =
      req.query.active === "true"
        ? true
        : req.query.active === "false"
          ? false
          : undefined;

    // Build where clause
    const where: any = {};
    if (active !== undefined) {
      where.isActive = active;
    }

    // Get coupons with pagination
    const [coupons, totalCount] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.coupon.count({ where }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      status: "success",
      data: {
        coupons,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single coupon (admin only)
export const getCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return next(new AppError("Coupon not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        coupon,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update a coupon (admin only)
export const updateCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const validatedData = updateCouponSchema.parse(req.body);

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!existingCoupon) {
      return next(new AppError("Coupon not found", 404));
    }

    // Check if code is being updated and already exists
    if (validatedData.code && validatedData.code !== existingCoupon.code) {
      const codeExists = await prisma.coupon.findUnique({
        where: { code: validatedData.code },
      });

      if (codeExists) {
        return next(new AppError("Coupon code already exists", 409));
      }
    }

    // Validate dates if they are being updated
    if (validatedData.startDate && validatedData.endDate) {
      if (validatedData.startDate >= validatedData.endDate) {
        return next(new AppError("End date must be after start date", 400));
      }
    } else if (validatedData.startDate && !validatedData.endDate) {
      if (validatedData.startDate >= existingCoupon.endDate) {
        return next(new AppError("Start date must be before end date", 400));
      }
    } else if (!validatedData.startDate && validatedData.endDate) {
      if (existingCoupon.startDate >= validatedData.endDate) {
        return next(new AppError("End date must be after start date", 400));
      }
    }

    // Validate min and max amount if they are being updated
    if (
      validatedData.minAmount !== undefined &&
      validatedData.maxAmount !== undefined
    ) {
      if (validatedData.minAmount >= validatedData.maxAmount) {
        return next(
          new AppError("Minimum amount must be less than maximum amount", 400)
        );
      }
    } else if (
      validatedData.minAmount !== undefined &&
      validatedData.maxAmount === undefined
    ) {
      if (
        existingCoupon.maxAmount &&
        validatedData.minAmount >= existingCoupon.maxAmount.toNumber()
      ) {
        return next(
          new AppError("Minimum amount must be less than maximum amount", 400)
        );
      }
    } else if (
      validatedData.minAmount === undefined &&
      validatedData.maxAmount !== undefined
    ) {
      if (
        existingCoupon.minAmount &&
        existingCoupon.minAmount.toNumber() >= validatedData.maxAmount
      ) {
        return next(
          new AppError("Minimum amount must be less than maximum amount", 400)
        );
      }
    }

    // Update coupon
    const coupon = await prisma.coupon.update({
      where: { id },
      data: validatedData,
    });

    res.status(200).json({
      status: "success",
      data: {
        coupon,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()));
    }
    next(error);
  }
};

// Delete a coupon (admin only)
export const deleteCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if coupon exists
    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return next(new AppError("Coupon not found", 404));
    }

    // Delete coupon
    await prisma.coupon.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Validate a coupon code
export const validateCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = validateCouponSchema.parse(req.body);
    const { code, amount } = validatedData;

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      return res.status(200).json({
        status: "success",
        data: {
          valid: false,
          message: "Coupon not found",
        },
      });
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return res.status(200).json({
        status: "success",
        data: {
          valid: false,
          message: "Coupon is not active",
        },
      });
    }

    // Check if coupon is expired
    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return res.status(200).json({
        status: "success",
        data: {
          valid: false,
          message: "Coupon is not valid at this time",
        },
      });
    }

    // Check if coupon has reached usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.status(200).json({
        status: "success",
        data: {
          valid: false,
          message: "Coupon usage limit reached",
        },
      });
    }

    // Check minimum amount requirement
    if (coupon.minAmount && amount < Number(coupon.minAmount)) {
      return res.status(200).json({
        status: "success",
        data: {
          valid: false,
          message: `Minimum order amount is ${coupon.minAmount}`,
        },
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === "PERCENTAGE") {
      discountAmount = (amount * Number(coupon.value)) / 100;
      // Apply maximum discount if specified
      if (coupon.maxAmount && discountAmount > Number(coupon.maxAmount)) {
        discountAmount = Number(coupon.maxAmount);
      }
    } else {
      // Fixed amount discount
      discountAmount = Number(coupon.value);
      // Ensure discount doesn't exceed order amount
      if (discountAmount > amount) {
        discountAmount = amount;
      }
    }

    // Calculate final amount
    const finalAmount = amount - discountAmount;

    res.status(200).json({
      status: "success",
      data: {
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          discountAmount,
          finalAmount,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()));
    }
    next(error);
  }
};

// Apply a coupon to an order
export const applyCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = applyCouponSchema.parse(req.body);
    const { orderId, code } = validatedData;
    const userId = req.user!.id;

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    // Check if order belongs to user or user is admin
    if (order.userId !== userId && req.user!.role !== "ADMIN") {
      return next(new AppError("Not authorized", 403));
    }

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code },
    });

    if (!coupon) {
      return next(new AppError("Coupon not found", 404));
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return next(new AppError("Coupon is not active", 400));
    }

    // Check if coupon is expired
    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return next(new AppError("Coupon is not valid at this time", 400));
    }

    // Check if coupon has reached usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return next(new AppError("Coupon usage limit reached", 400));
    }

    // Check minimum amount requirement
    if (
      coupon.minAmount &&
      Number(order.totalAmount) < Number(coupon.minAmount)
    ) {
      return next(
        new AppError(`Minimum order amount is ${coupon.minAmount}`, 400)
      );
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === "PERCENTAGE") {
      discountAmount = (Number(order.totalAmount) * Number(coupon.value)) / 100;
      // Apply maximum discount if specified
      if (coupon.maxAmount && discountAmount > Number(coupon.maxAmount)) {
        discountAmount = Number(coupon.maxAmount);
      }
    } else {
      // Fixed amount discount
      discountAmount = Number(coupon.value);
      // Ensure discount doesn't exceed order amount
      if (discountAmount > Number(order.totalAmount)) {
        discountAmount = Number(order.totalAmount);
      }
    }

    // Update order with coupon and discount
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        couponId: coupon.id,
        discountAmount,
      },
    });

    // Increment coupon usage count
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });

    // Calculate final amount
    const finalAmount =
      Number(updatedOrder.totalAmount) -
      Number(updatedOrder.discountAmount || 0);

    res.status(200).json({
      status: "success",
      data: {
        order: {
          id: updatedOrder.id,
          totalAmount: updatedOrder.totalAmount,
          discountAmount: updatedOrder.discountAmount,
          finalAmount,
          couponId: updatedOrder.couponId,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()));
    }
    next(error);
  }
};

// Remove a coupon from an order
export const removeCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = removeCouponSchema.parse(req.body);
    const { orderId } = validatedData;
    const userId = req.user!.id;

    // Find order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        coupon: true,
      },
    });

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    // Check if order belongs to user or user is admin
    if (order.userId !== userId && req.user!.role !== "ADMIN") {
      return next(new AppError("Not authorized", 403));
    }

    // Check if order has a coupon
    if (!order.couponId) {
      return next(new AppError("Order does not have a coupon applied", 400));
    }

    // Decrement coupon usage count
    await prisma.coupon.update({
      where: { id: order.couponId },
      data: {
        usageCount: {
          decrement: 1,
        },
      },
    });

    // Remove coupon from order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        couponId: null,
        discountAmount: null,
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        order: {
          id: updatedOrder.id,
          totalAmount: updatedOrder.totalAmount,
          discountAmount: updatedOrder.discountAmount,
          couponId: updatedOrder.couponId,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()));
    }
    next(error);
  }
};
