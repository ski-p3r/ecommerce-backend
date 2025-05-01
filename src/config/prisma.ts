import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

// Assign prisma to global in development to prevent multiple instances
if (process.env.NODE_ENV === "development") {
  global.prisma = prisma;
}
