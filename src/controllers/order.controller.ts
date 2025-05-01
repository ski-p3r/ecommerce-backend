import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";
import { sendEmail } from "../utils/email";
import { createChapaTransaction } from "../utils/chapa";

// Validation schemas
const createOrderSchema = z.object({
  shippingAddress: z.string(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

// Create a new order from cart
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body
    const validatedData = createOrderSchema.parse(req.body);
    const userId = req.user!.id;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get user's cart with items
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new AppError("Cart is empty", 400);
      }

      // Calculate total amount
      const totalAmount = cart.items.reduce((sum, item) => {
        return sum + Number(item.product.price) * item.quantity;
      }, 0);

      // Check stock for all items
      for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
          throw new AppError(`Not enough stock for ${item.product.name}`, 400);
        }
      }

      // Create order
      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          shippingAddress: validatedData.shippingAddress,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: {
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
          },
        },
      });

      // Update product stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Create Chapa transaction
      const chapaTransaction = await createChapaTransaction({
        amount: totalAmount.toString(),
        currency: "ETB",
        email: user.email,
        first_name: user.firstName || "Customer",
        last_name: user.lastName || "",
        tx_ref: order.id,
        callback_url: `${req.protocol}://${req.get("host")}/api/v1/chapa/verify`,
        return_url: `${req.protocol}://${req.get("host")}/orders/${order.id}`,
      });

      // Update order with payment reference
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentReference: chapaTransaction.tx_ref,
        },
        include: {
          items: {
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
          },
        },
      });

      return {
        order: updatedOrder,
        chapaTransaction,
      };
    });

    // Send order confirmation email
    try {
      await sendEmail({
        to: req.user!.email,
        subject: "Order Confirmation",
        text: `Your order #${result.order.id} has been placed successfully. Total amount: ${result.order.totalAmount}`,
        html: `
          <h1>Order Confirmation</h1>
          <p>Your order #${result.order.id} has been placed successfully.</p>
          <p>Total amount: ${result.order.totalAmount}</p>
          <p>Please complete your payment to process your order.</p>
          <a href="${result.chapaTransaction.checkout_url}">Complete Payment</a>
        `,
      });
    } catch (error) {
      console.error("Failed to send order confirmation email:", error);
    }

    res.status(201).json({
      status: "success",
      data: {
        order: result.order,
        paymentUrl: result.chapaTransaction.checkout_url,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()));
    }
    next(error);
  }
};

// Get all orders for a user
export const getUserOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
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
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single order
export const getOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Find order
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
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
        },
      },
    });

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    // Check if order belongs to user or user is admin
    if (order.userId !== userId && req.user!.role !== "ADMIN") {
      return next(new AppError("Not authorized", 403));
    }

    res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update order status (admin only)
export const updateOrderStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const validatedData = updateOrderStatusSchema.parse(req.body);

    // Find order
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: validatedData.status,
      },
      include: {
        items: {
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
        },
      },
    });

    // If order is cancelled, restore product stock
    if (validatedData.status === "CANCELLED" && order.status !== "CANCELLED") {
      for (const item of updatedOrder.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    // Send status update email
    try {
      const user = await prisma.user.findUnique({
        where: { id: order.userId },
      });

      if (user) {
        await sendEmail({
          to: user.email,
          subject: "Order Status Update",
          text: `Your order #${order.id} status has been updated to ${validatedData.status}`,
          html: `
            <h1>Order Status Update</h1>
            <p>Your order #${order.id} status has been updated to ${validatedData.status}.</p>
          `,
        });
      }
    } catch (error) {
      console.error("Failed to send order status update email:", error);
    }

    res.status(200).json({
      status: "success",
      data: {
        order: updatedOrder,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError("Validation error", 400, error.format()));
    }
    next(error);
  }
};

// Get all orders (admin only)
export const getAllOrders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.order.count(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      status: "success",
      data: {
        orders,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
