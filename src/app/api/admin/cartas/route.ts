import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    const participants = await db.participant.findMany({
      include: {
        cartas: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      participants: participants.map((p) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        isUnlocked: p.isUnlocked,
        createdAt: p.createdAt,
        cartasCount: p.cartas.length,
        cartas: p.cartas.map((c) => ({
          id: c.id,
          filename: c.filename,
          driveUrl: c.driveUrl,
          remitterName: c.remitterName,
          createdAt: c.createdAt,
        })),
      })),
    });
  } catch (error) {
    console.error("Erro ao listar cartas do admin:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
