import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

// Garantir que o diretório do SQLite prisma/data existe no ambiente local/servidor
try {
  const dataDir = path.resolve(process.cwd(), "prisma", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
} catch (e) {
  console.warn("Aviso ao verificar diretório prisma/data:", e);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
