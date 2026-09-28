import { env } from "../config/env";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = env.DATABASE_URL;
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});
