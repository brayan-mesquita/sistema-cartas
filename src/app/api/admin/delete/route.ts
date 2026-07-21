import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getGoogleDriveClient } from "@/lib/storage";
import { sanitizePhone } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const unauthorized = requireAdmin(request);
    if (unauthorized) return unauthorized;

    const { participantId, phone } = await request.json();

    if (!participantId && !phone) {
      return NextResponse.json({ error: "ID do participante ou Telefone é obrigatório." }, { status: 400 });
    }

    // 1. Localizar o participante no SQLite com todas as suas cartas
    // sanitizePhone (e não replace/\D/) para bater com a normalização usada na
    // gravação — telefones com +55 ou DDD com zero não casariam de outra forma.
    const cleanPhone = phone ? sanitizePhone(phone) : undefined;
    const participant = await db.participant.findFirst({
      where: participantId ? { id: participantId } : { phone: cleanPhone },
      include: { cartas: true },
    });

    if (!participant) {
      return NextResponse.json({ error: "Registro de participante não localizado." }, { status: 404 });
    }

    // 2. Apagar cada arquivo PDF do Google Drive se o ID do arquivo existir
    const drive = getGoogleDriveClient();
    if (drive) {
      for (const carta of participant.cartas) {
        if (carta.driveFileId && !carta.driveFileId.startsWith("mock_")) {
          try {
            await drive.files.delete({
              fileId: carta.driveFileId,
              supportsAllDrives: true,
            });
          } catch (driveErr) {
            console.warn(`Aviso ao apagar arquivo ${carta.driveFileId} do Google Drive:`, driveErr);
          }
        }
      }
    }

    // 3. Excluir cartas e o participante do banco de dados SQLite
    await db.carta.deleteMany({
      where: { participantId: participant.id },
    });

    await db.participant.delete({
      where: { id: participant.id },
    });

    return NextResponse.json({
      success: true,
      message: `Registro do participante ${participant.name} e suas cartas foram excluídos com sucesso!`,
    });
  } catch (error: any) {
    console.error("Erro ao excluir participante e cartas:", error);
    return NextResponse.json(
      { error: error?.message || "Não foi possível excluir o registro." },
      { status: 500 }
    );
  }
}
