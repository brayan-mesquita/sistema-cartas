const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

async function init() {
  try {
    const dataDir = path.resolve(process.cwd(), "prisma", "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const prisma = new PrismaClient();
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Participant" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "ghlId" TEXT,
        "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Participant_phone_key" ON "Participant"("phone");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Carta" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "participantPhone" TEXT NOT NULL,
        "participantName" TEXT NOT NULL,
        "remitterName" TEXT NOT NULL,
        "relationship" TEXT NOT NULL DEFAULT 'Familiar / Ente Querido',
        "filename" TEXT NOT NULL,
        "driveUrl" TEXT NOT NULL,
        "driveFileId" TEXT,
        "provider" TEXT NOT NULL DEFAULT 'gdrive',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "participantId" TEXT NOT NULL,
        CONSTRAINT "Carta_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    console.log("✅ Banco de dados SQLite e tabelas verificados com sucesso!");
    await prisma.$disconnect();
  } catch (err) {
    console.error("Aviso ao inicializar tabelas do SQLite:", err);
  }
}

init();
