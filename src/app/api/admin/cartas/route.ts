import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const adminSession = request.cookies.get("admin_session")?.value;
    if (adminSession !== "authenticated_token_legendarios") {
      return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
    }

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
