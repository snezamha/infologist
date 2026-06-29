import { PrismaNeon } from "@prisma/adapter-neon";
import { createRequire } from "node:module";

import { Prisma, type PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function loadPrismaClient() {
  const prismaClientModule =
    require("@prisma/client") as typeof import("@prisma/client");
  return prismaClientModule.PrismaClient;
}

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL ??
    "postgresql://build:build@localhost:5432/build?sslmode=disable";

  const adapter = new PrismaNeon({ connectionString });
  const PrismaClient = loadPrismaClient();

  return new PrismaClient({ adapter });
}

export function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export async function runSerializableTransaction<T>(
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
) {
  const prisma = getPrisma();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      const shouldRetry =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2034" &&
        attempt < 2;

      if (!shouldRetry) {
        throw error;
      }
    }
  }

  throw new Error("Transaction retry limit exceeded");
}
