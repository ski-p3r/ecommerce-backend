import type { Request, Response, NextFunction } from "express"
import { prisma } from "../config/prisma"
import { AppError } from "../utils/appError"

// Get sales analytics
export const getSalesAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = "weekly", startDate, endDate } = req.query

    // Parse dates or use defaults
    const parsedStartDate = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const parsedEndDate = endDate ? new Date(endDate as string) : new Date()

    // Validate dates
    if (parsedStartDate > parsedEndDate) {
      return next(new AppError("Start date cannot be after end date", 400))
    }

    // Get all orders in the date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: parsedStartDate,
          lte: parsedEndDate,
        },
        status: {
          in: ["PAID", "SHIPPED", "DELIVERED"],
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Calculate total sales
    const totalSales = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    // Group data by time period
    const salesByPeriod: Record<string, { date: string; sales: number; orders: number }> = {}

    orders.forEach((order) => {
      let periodKey: string

      switch (period) {
        case "daily":
          periodKey = order.createdAt.toISOString().split("T")[0] // YYYY-MM-DD
          break
        case "weekly":
          // Get the week number and year
          const date = new Date(order.createdAt)
          const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
          const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
          const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
          periodKey = `${date.getFullYear()}-W${weekNumber}`
          break
        case "monthly":
          periodKey = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`
          break
        case "yearly":
          periodKey = `${order.createdAt.getFullYear()}`
          break
        default:
          periodKey = order.createdAt.toISOString().split("T")[0] // Default to daily
      }

      if (!salesByPeriod[periodKey]) {
        salesByPeriod[periodKey] = {
          date: periodKey,
          sales: 0,
          orders: 0,
        }
      }

      salesByPeriod[periodKey].sales += Number(order.totalAmount)
      salesByPeriod[periodKey].orders += 1
    })

    // Convert to array and sort by date
    const salesTrend = Object.values(salesByPeriod).sort((a, b) => a.date.localeCompare(b.date))

    // Calculate product sales
    const productSales: Record<string, { id: string; name: string; quantity: number; revenue: number }> = {}

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.product.id
        if (!productSales[productId]) {
          productSales[productId] = {
            id: productId,
            name: item.product.name,
            quantity: 0,
            revenue: 0,
          }
        }
        productSales[productId].quantity += item.quantity
        productSales[productId].revenue += Number(item.price) * item.quantity
      })
    })

    // Convert to array and sort by revenue
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Calculate category sales
    const categorySales: Record<string, { id: string; name: string; quantity: number; revenue: number }> = {}

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const categoryId = item.product.category.id
        const categoryName = item.product.category.name
        if (!categorySales[categoryId]) {
          categorySales[categoryId] = {
            id: categoryId,
            name: categoryName,
            quantity: 0,
            revenue: 0,
          }
        }
        categorySales[categoryId].quantity += item.quantity
        categorySales[categoryId].revenue += Number(item.price) * item.quantity
      })
    })

    // Convert to array and sort by revenue
    const topCategories = Object.values(categorySales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    res.status(200).json({
      status: "success",
      data: {
        overview: {
          totalSales,
          totalOrders,
          avgOrderValue,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
        },
        salesTrend,
        topProducts,
        topCategories,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Get product analytics
export const getProductAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query

    // Parse dates or use defaults
    const parsedStartDate = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const parsedEndDate = endDate ? new Date(endDate as string) : new Date()

    // Validate dates
    if (parsedStartDate > parsedEndDate) {
      return next(new AppError("Start date cannot be after end date", 400))
    }

    // Get all products with their order items in the date range
    const products = await prisma.product.findMany({
      include: {
        orderItems: {
          where: {
            createdAt: {
              gte: parsedStartDate,
              lte: parsedEndDate,
            },
            order: {
              status: {
                in: ["PAID", "SHIPPED", "DELIVERED"],
              },
            },
          },
        },
        reviews: {
          where: {
            createdAt: {
              gte: parsedStartDate,
              lte: parsedEndDate,
            },
          },
        },
        category: true,
      },
    })

    // Calculate product metrics
    const productMetrics = products.map((product) => {
      const quantitySold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0)
      const revenue = product.orderItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
      const reviewCount = product.reviews.length
      const avgRating = product.avgRating ? Number(product.avgRating) : 0

      return {
        id: product.id,
        name: product.name,
        category: product.category.name,
        stock: product.stock,
        lowStockAlert: product.lowStockAlert,
        quantitySold,
        revenue,
        reviewCount,
        avgRating,
        isLowStock: product.stock <= product.lowStockAlert,
      }
    })

    // Sort by revenue (highest first)
    const sortedProducts = productMetrics.sort((a, b) => b.revenue - a.revenue)

    // Calculate category metrics
    const categoryMetrics: Record<
      string,
      { name: string; quantitySold: number; revenue: number; productCount: number }
    > = {}

    productMetrics.forEach((product) => {
      const categoryName = product.category
      if (!categoryMetrics[categoryName]) {
        categoryMetrics[categoryName] = {
          name: categoryName,
          quantitySold: 0,
          revenue: 0,
          productCount: 0,
        }
      }
      categoryMetrics[categoryName].quantitySold += product.quantitySold
      categoryMetrics[categoryName].revenue += product.revenue
      categoryMetrics[categoryName].productCount += 1
    })

    // Convert to array and sort by revenue
    const sortedCategories = Object.values(categoryMetrics).sort((a, b) => b.revenue - a.revenue)

    // Get low stock products
    const lowStockProducts = productMetrics.filter((product) => product.isLowStock)

    // Get out of stock products
    const outOfStockProducts = productMetrics.filter((product) => product.stock === 0)

    res.status(200).json({
      status: "success",
      data: {
        products: sortedProducts,
        categories: sortedCategories,
        lowStockProducts,
        outOfStockProducts,
        totalProducts: products.length,
        totalSold: productMetrics.reduce((sum, product) => sum + product.quantitySold, 0),
        totalRevenue: productMetrics.reduce((sum, product) => sum + product.revenue, 0),
      },
    })
  } catch (error) {
    next(error)
  }
}

// Get customer analytics
export const getCustomerAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query

    // Parse dates or use defaults
    const parsedStartDate = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const parsedEndDate = endDate ? new Date(endDate as string) : new Date()

    // Validate dates
    if (parsedStartDate > parsedEndDate) {
      return next(new AppError("Start date cannot be after end date", 400))
    }

    // Get all users with their orders in the date range
    const users = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
      },
      include: {
        orders: {
          where: {
            createdAt: {
              gte: parsedStartDate,
              lte: parsedEndDate,
            },
            status: {
              in: ["PAID", "SHIPPED", "DELIVERED"],
            },
          },
        },
        reviews: {
          where: {
            createdAt: {
              gte: parsedStartDate,
              lte: parsedEndDate,
            },
          },
        },
      },
    })

    // Get new users in the date range
    const newUsers = await prisma.user.count({
      where: {
        role: "CUSTOMER",
        createdAt: {
          gte: parsedStartDate,
          lte: parsedEndDate,
        },
      },
    })

    // Calculate user metrics
    const userMetrics = users.map((user) => {
      const orderCount = user.orders.length
      const totalSpent = user.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
      const reviewCount = user.reviews.length
      const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        orderCount,
        totalSpent,
        reviewCount,
        avgOrderValue,
      }
    })

    // Sort by total spent (highest first)
    const sortedUsers = userMetrics.sort((a, b) => b.totalSpent - a.totalSpent)

    // Get top customers
    const topCustomers = sortedUsers.slice(0, 10)

    // Calculate customer segments
    const segments = {
      newCustomers: userMetrics.filter((user) => user.orderCount === 1 && user.createdAt >= parsedStartDate).length,
      returningCustomers: userMetrics.filter((user) => user.orderCount > 1).length,
      inactiveCustomers: users.filter((user) => user.orders.length === 0).length,
    }

    // Calculate average values
    const activeUsers = userMetrics.filter((user) => user.orderCount > 0)
    const avgOrdersPerCustomer =
      activeUsers.length > 0 ? activeUsers.reduce((sum, user) => sum + user.orderCount, 0) / activeUsers.length : 0
    const avgSpendPerCustomer =
      activeUsers.length > 0 ? activeUsers.reduce((sum, user) => sum + user.totalSpent, 0) / activeUsers.length : 0

    res.status(200).json({
      status: "success",
      data: {
        overview: {
          totalCustomers: users.length,
          newCustomers: newUsers,
          activeCustomers: activeUsers.length,
          avgOrdersPerCustomer,
          avgSpendPerCustomer,
        },
        segments,
        topCustomers,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Get dashboard overview
export const getDashboardOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get today's date and 30 days ago
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    // Get previous 30 days for comparison
    const sixtyDaysAgo = new Date(thirtyDaysAgo)
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 30)

    // Get current period metrics
    const [
      currentPeriodOrders,
      currentPeriodUsers,
      currentPeriodRevenue,
      totalProducts,
      lowStockProducts,
      pendingOrders,
    ] = await Promise.all([
      // Order count
      prisma.order.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
            lte: today,
          },
          status: {
            in: ["PAID", "SHIPPED", "DELIVERED"],
          },
        },
      }),
      // New users
      prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
            lte: today,
          },
          role: "CUSTOMER",
        },
      }),
      // Total revenue
      prisma.order
        .aggregate({
          where: {
            createdAt: {
              gte: thirtyDaysAgo,
              lte: today,
            },
            status: {
              in: ["PAID", "SHIPPED", "DELIVERED"],
            },
          },
          _sum: {
            totalAmount: true,
          },
        })
        .then((result) => Number(result._sum.totalAmount || 0)),
      // Total products
      prisma.product.count(),
      // Low stock products
      prisma.product.count({
        where: {
          stock: {
            lte: prisma.product.fields.lowStockAlert,
          },
        },
      }),
      // Pending orders
      prisma.order.count({
        where: {
          status: "PENDING",
        },
      }),
    ])

    // Get previous period metrics for comparison
    const [previousPeriodOrders, previousPeriodUsers, previousPeriodRevenue] = await Promise.all([
      // Order count
      prisma.order.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
          status: {
            in: ["PAID", "SHIPPED", "DELIVERED"],
          },
        },
      }),
      // New users
      prisma.user.count({
        where: {
          createdAt: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
          role: "CUSTOMER",
        },
      }),
      // Total revenue
      prisma.order
        .aggregate({
          where: {
            createdAt: {
              gte: sixtyDaysAgo,
              lt: thirtyDaysAgo,
            },
            status: {
              in: ["PAID", "SHIPPED", "DELIVERED"],
            },
          },
          _sum: {
            totalAmount: true,
          },
        })
        .then((result) => Number(result._sum.totalAmount || 0)),
    ])

    // Calculate percentage changes
    const calculatePercentChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const orderChange = calculatePercentChange(currentPeriodOrders, previousPeriodOrders)
    const userChange = calculatePercentChange(currentPeriodUsers, previousPeriodUsers)
    const revenueChange = calculatePercentChange(currentPeriodRevenue, previousPeriodRevenue)

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
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
    })

    // Get top selling products
    const topProducts = await prisma.product.findMany({
      take: 5,
      orderBy: [
        {
          orderItems: {
            _count: "desc",
          },
        },
      ],
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
    })

    // Get sales by day for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      return date.toISOString().split("T")[0] // YYYY-MM-DD
    }).reverse()

    const salesByDay = await Promise.all(
      last7Days.map(async (day) => {
        const startOfDay = new Date(`${day}T00:00:00.000Z`)
        const endOfDay = new Date(`${day}T23:59:59.999Z`)

        const dailySales = await prisma.order.aggregate({
          where: {
            createdAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: {
              in: ["PAID", "SHIPPED", "DELIVERED"],
            },
          },
          _sum: {
            totalAmount: true,
          },
          _count: true,
        })

        return {
          date: day,
          sales: Number(dailySales._sum.totalAmount || 0),
          orders: dailySales._count,
        }
      }),
    )

    res.status(200).json({
      status: "success",
      data: {
        kpis: {
          orders: {
            value: currentPeriodOrders,
            change: orderChange,
          },
          revenue: {
            value: currentPeriodRevenue,
            change: revenueChange,
          },
          users: {
            value: currentPeriodUsers,
            change: userChange,
          },
          products: {
            total: totalProducts,
            lowStock: lowStockProducts,
          },
          pendingOrders,
        },
        recentOrders,
        topProducts: topProducts.map((product) => ({
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          category: product.category.name,
          orderCount: product._count.orderItems,
        })),
        salesByDay,
      },
    })
  } catch (error) {
    next(error)
  }
}

// Generate and store daily stats (to be called by a scheduled job)
export const generateDailyStats = async () => {
  try {
    // Get yesterday's date
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const endOfYesterday = new Date(yesterday)
    endOfYesterday.setHours(23, 59, 59, 999)

    // Check if stats already exist for yesterday
    const existingStats = await prisma.dashboardStats.findUnique({
      where: {
        date: yesterday,
      },
    })

    if (existingStats) {
      console.log(`Stats for ${yesterday.toISOString().split("T")[0]} already exist`)
      return
    }

    // Get orders for yesterday
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: yesterday,
          lte: endOfYesterday,
        },
        status: {
          in: ["PAID", "SHIPPED", "DELIVERED"],
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // Calculate total sales
    const totalSales = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)
    const orderCount = orders.length
    const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0

    // Calculate products sold
    const productsSold = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
    }, 0)

    // Find top selling product
    const productSales: Record<string, { id: string; name: string; quantity: number }> = {}

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const productId = item.product.id
        if (!productSales[productId]) {
          productSales[productId] = {
            id: productId,
            name: item.product.name,
            quantity: 0,
          }
        }
        productSales[productId].quantity += item.quantity
      })
    })

    const topSellingProduct = Object.values(productSales).sort((a, b) => b.quantity - a.quantity)[0]?.name || null

    // Get new users for yesterday
    const newUserCount = await prisma.user.count({
      where: {
        createdAt: {
          gte: yesterday,
          lte: endOfYesterday,
        },
        role: "CUSTOMER",
      },
    })

    // Store stats
    await prisma.dashboardStats.create({
      data: {
        date: yesterday,
        totalSales,
        orderCount,
        newUserCount,
        productsSold,
        avgOrderValue,
        topSellingProduct,
      },
    })

    console.log(`Generated stats for ${yesterday.toISOString().split("T")[0]}`)
  } catch (error) {
    console.error("Error generating daily stats:", error)
  }
}

// Get historical stats
export const getHistoricalStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = "30" } = req.query
    const daysCount = Number.parseInt(days as string, 10) || 30

    // Get stats for the last N days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysCount)
    startDate.setHours(0, 0, 0, 0)

    const stats = await prisma.dashboardStats.findMany({
      where: {
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: "asc",
      },
    })

    res.status(200).json({
      status: "success",
      data: {
        stats,
        totalDays: stats.length,
        requestedDays: daysCount,
      },
    })
  } catch (error) {
    next(error)
  }
}
