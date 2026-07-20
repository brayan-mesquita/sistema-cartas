import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sanitizePhone } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get("phone");

    if (!rawPhone) {
      return NextResponse.json({ error: "Telefone é obrigatório." }, { status: 400 });
    }

    const cleanPhone = sanitizePhone(rawPhone);
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: "Telefone deve conter DDD e pelo menos 10 dígitos." }, { status: 400 });
    }

    // Consulta no banco de dados SQLite local
    let localParticipant = null;
    try {
      localParticipant = await db.participant.findUnique({
        where: { phone: cleanPhone },
        include: {
          cartas: {
            select: { id: true },
          },
        },
      });
    } catch (dbError) {
      console.error("❌ Erro ao consultar banco SQLite:", dbError);
    }

    // Se possui cartas gravadas E NÃO FOI HABILITADO REENVIO PELO ADMIN
    if (localParticipant && localParticipant.cartas.length > 0 && !localParticipant.isUnlocked) {
      return NextResponse.json({
        alreadyRegistered: true,
        cartasCount: localParticipant.cartas.length,
        participantName: localParticipant.name,
        message: `As cartas já foram enviadas para o participante ${localParticipant.name}. Só é permitido um único envio. Em caso de dúvida, procure a organização do evento.`,
      });
    }

    return NextResponse.json({
      alreadyRegistered: false,
      cartasCount: localParticipant ? localParticipant.cartas.length : 0,
      message: "Número liberado para envio.",
    });
  } catch (error) {
    console.error("Erro na verificação do participante:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
