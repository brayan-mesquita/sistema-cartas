import { NextRequest, NextResponse } from "next/server";
import { uploadPdfToGoogleDrive, UploadResult } from "@/lib/storage";
import { updateGHLContactLetters, findGHLContactByPhone } from "@/lib/ghl";
import { db } from "@/lib/db";
import { sanitizePhone } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const rawPhone = formData.get("participantPhone") as string;
    const participantName = formData.get("participantName") as string;
    const remitterName = formData.get("remitterName") as string;
    const relationship = (formData.get("relationship") as string) || "Familiar / Ente Querido";
    let contactId = formData.get("contactId") as string;

    const files = formData.getAll("files") as File[];
    const cleanPhone = sanitizePhone(rawPhone);

    // Validações Básicas
    if (!cleanPhone || !participantName || !remitterName) {
      return NextResponse.json(
        { error: "Por favor, preencha o número do participante, nome do participante e o seu nome." },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "É necessário anexar pelo menos 1 carta em PDF." },
        { status: 400 }
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: "Limite máximo de 5 cartas em PDF por envio excedido." },
        { status: 400 }
      );
    }

    // 1. Verificação no SQLite: Bloquear se já enviou E se o admin não habilitou reenvio (isUnlocked)
    const existingParticipant = await db.participant.findUnique({
      where: { phone: cleanPhone },
      include: { cartas: { select: { id: true } } },
    });

    if (existingParticipant && existingParticipant.cartas.length > 0 && !existingParticipant.isUnlocked) {
      return NextResponse.json(
        {
          error: `Envio recusado: As cartas já foram enviadas para o participante ${existingParticipant.name} (${rawPhone}). Em caso de dúvida, procure a organização do evento.`,
          alreadyRegistered: true,
        },
        { status: 409 }
      );
    }

    // 2. Validar arquivos PDF (Máx 15MB)
    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    for (const file of files) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return NextResponse.json(
          { error: `O arquivo "${file.name}" não é um PDF válido.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `O arquivo "${file.name}" excede o tamanho máximo permitido de 15MB.` },
          { status: 400 }
        );
      }
    }

    // 3. Upload dos arquivos para a subpasta do Participante no Google Drive
    const uploadResults: UploadResult[] = [];
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const res = await uploadPdfToGoogleDrive({
        filename: file.name,
        buffer,
        mimeType: file.type || "application/pdf",
        participantPhone: cleanPhone,
        participantName,
        remitterName,
        relationship,
      });

      uploadResults.push(res);
    }

    // 4. Salvar participante e cartas no Banco de Dados SQLite (via Prisma) e trancar o reenvio (isUnlocked = false)
    const participantRecord = await db.participant.upsert({
      where: { phone: cleanPhone },
      update: {
        name: participantName,
        isUnlocked: false, // Tranca novamente após o envio
      },
      create: {
        phone: cleanPhone,
        name: participantName,
        isUnlocked: false,
      },
    });

    for (const res of uploadResults) {
      await db.carta.create({
        data: {
          participantPhone: cleanPhone,
          participantName,
          remitterName,
          relationship,
          filename: res.filename,
          driveUrl: res.url,
          driveFileId: res.driveFileId || null,
          provider: res.provider,
          participantId: participantRecord.id,
        },
      });
    }

    // 5. Opcional: Atualizar CRM GoHighLevel
    let ghlSyncSuccess = false;
    try {
      if (!contactId) {
        const found = await findGHLContactByPhone(cleanPhone);
        if (found) contactId = found.id;
      }
      if (contactId) {
        const urls = uploadResults.map((r) => r.url);
        ghlSyncSuccess = await updateGHLContactLetters(contactId, remitterName, relationship, urls);
      }
    } catch (ghlErr) {
      console.warn("Aviso ao sincronizar GHL:", ghlErr);
    }

    return NextResponse.json({
      success: true,
      message: "Cartas salvas no Google Drive e registradas no SQLite com sucesso!",
      count: uploadResults.length,
      letters: uploadResults.map((r) => ({
        filename: r.filename,
        url: r.url,
        provider: r.provider,
      })),
      ghlSynced: ghlSyncSuccess,
      participantName,
      remitterName,
      relationship,
    });
  } catch (error: any) {
    console.error("Erro ao processar envio de cartas:", error);
    return NextResponse.json(
      { error: error?.message || "Ocorreu um erro interno ao processar o envio." },
      { status: 500 }
    );
  }
}
