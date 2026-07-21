import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sanitizePhone } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: "Telefone é obrigatório." }, { status: 400 });
    }

    const cleanPhone = sanitizePhone(phone);

    // Habilitar novo envio no SQLite
    const updated = await db.participant.update({
      where: { phone: cleanPhone },
      data: { isUnlocked: true },
    });

    return NextResponse.json({
      success: true,
      message: `Novo envio habilitado com sucesso para ${updated.name} (${updated.phone})!`,
      participant: updated,
    });
  } catch (error: any) {
    console.error("Erro ao habilitar novo envio:", error);
    return NextResponse.json(
      { error: error?.message || "Não foi possível habilitar novo envio." },
      { status: 500 }
    );
  }
}
