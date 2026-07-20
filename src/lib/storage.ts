import { google } from "googleapis";
import { Readable } from "stream";
import fs from "fs";
import path from "path";

export interface FileUploadPayload {
  filename: string;
  buffer: Buffer;
  mimeType: string;
  participantPhone: string;
  participantName: string;
  remitterName: string;
  relationship?: string;
}

export interface UploadResult {
  url: string;
  provider: "gdrive" | "local_mock";
  filename: string;
  driveFileId?: string;
  targetFolderId?: string;
}

/**
 * Carrega e valida as credenciais da Service Account do Google Cloud
 */
function getGoogleCredentials(): { credentials?: any; error?: string; detail?: string } {
  try {
    let credentials: any;

    // 1. Verificar se existe o arquivo service-account.json no projeto
    const serviceAccountFile = path.resolve(process.cwd(), "service-account.json");
    if (fs.existsSync(serviceAccountFile)) {
      const fileContent = fs.readFileSync(serviceAccountFile, "utf8");
      credentials = JSON.parse(fileContent);
    } else {
      // 2. Verificar a variável de ambiente GOOGLE_SERVICE_ACCOUNT_JSON
      const jsonEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      if (!jsonEnv || !jsonEnv.trim()) {
        return {
          error: "MISSING_ENV",
          detail: "service-account.json não encontrado no projeto e GOOGLE_SERVICE_ACCOUNT_JSON ausente no .env.",
        };
      }

      const trimmedEnv = jsonEnv.trim();
      if (trimmedEnv.endsWith(".json") || trimmedEnv.startsWith("./") || trimmedEnv.startsWith("/")) {
        const resolvedPath = path.isAbsolute(trimmedEnv) ? trimmedEnv : path.resolve(process.cwd(), trimmedEnv);
        if (fs.existsSync(resolvedPath)) {
          const fileContent = fs.readFileSync(resolvedPath, "utf8");
          credentials = JSON.parse(fileContent);
        } else {
          return { error: "FILE_NOT_FOUND", detail: `Arquivo não encontrado no caminho: ${resolvedPath}` };
        }
      } else {
        credentials = JSON.parse(trimmedEnv);
      }
    }

    if (credentials.web || credentials.installed) {
      return {
        error: "JSON_OAUTH_CLIENT_NOT_SERVICE_ACCOUNT",
        detail: "O JSON é de um cliente OAuth (Web/App), e não de uma Conta de Serviço (Service Account).",
      };
    }

    if (!credentials.client_email || !credentials.private_key) {
      return {
        error: "MISSING_CLIENT_EMAIL_OR_PRIVATE_KEY",
        detail: "O JSON não contém 'client_email' ou 'private_key'.",
      };
    }

    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
    }

    return { credentials };
  } catch (error: any) {
    console.error("❌ Erro ao processar credenciais do Google:", error);
    return { error: "PARSE_ERROR", detail: error?.message || String(error) };
  }
}

/**
 * Inicializa o cliente da API do Google Drive (Suporta OAuth2 Refresh Token ou Service Account)
 */
export function getGoogleDriveClient() {
  // 1. Tentar OAuth2 com Refresh Token (Se configurado no .env)
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (clientId && clientSecret && refreshToken) {
    try {
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      return google.drive({ version: "v3", auth: oauth2Client });
    } catch (err) {
      console.error("Erro ao autenticar via OAuth2 Refresh Token:", err);
    }
  }

  // 2. Tentar Service Account (Padrão)
  const result = getGoogleCredentials();
  if (!result || !result.credentials) return null;

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: result.credentials,
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.file",
      ],
    });

    return google.drive({ version: "v3", auth });
  } catch (error) {
    console.error("❌ Erro ao autenticar no Google Drive API:", error);
    return null;
  }
}

/**
 * Busca ou cria uma subpasta com o nome do participante dentro da pasta principal
 */
async function getOrCreateParticipantFolder(
  drive: any,
  parentFolderId: string,
  participantName: string
): Promise<string> {
  const sanitizedName = participantName.trim();
  const escapedName = sanitizedName.replace(/'/g, "\\'");
  const query = `'${parentFolderId}' in parents and name = '${escapedName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

  try {
    const searchRes = await drive.files.list({
      q: query,
      fields: "files(id, name)",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (searchRes.data.files && searchRes.data.files.length > 0) {
      return searchRes.data.files[0].id;
    }
  } catch (err) {
    console.warn("Aviso ao buscar subpasta no Drive:", err);
  }

  // Se a pasta não existe, cria a nova subpasta com o nome do participante
  const folderRes = await drive.files.create({
    requestBody: {
      name: sanitizedName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId],
    },
    fields: "id",
    supportsAllDrives: true,
  });

  return folderRes.data.id;
}

/**
 * Diagnóstico detalhado de conexão com a pasta do Google Drive
 */
export async function testGoogleDriveConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) {
    return {
      success: false,
      message: "Variável GOOGLE_DRIVE_FOLDER_ID não está configurada no .env.",
    };
  }

  const resCreds = getGoogleCredentials();
  const drive = getGoogleDriveClient();

  if (!drive) {
    return {
      success: false,
      message: "Credenciais de Service Account (GOOGLE_SERVICE_ACCOUNT_JSON) ou OAuth2 inválidas ou ausentes.",
    };
  }

  try {
    const res = await drive.files.get({
      fileId: folderId,
      fields: "id, name, mimeType, permissions",
      supportsAllDrives: true,
    });

    return {
      success: true,
      message: `Conexão bem-sucedida! Pasta principal no Google Drive: "${res.data.name}"`,
      details: {
        folderName: res.data.name,
        folderId: res.data.id,
        serviceAccountEmail: resCreds.credentials?.client_email || "OAuth2 User",
      },
    };
  } catch (error: any) {
    console.error("❌ Teste do Google Drive falhou:", error);
    let msg = error?.message || "Erro desconhecido ao acessar o Google Drive.";
    
    if (error?.message?.includes("storage quota") || error?.errors?.[0]?.reason === "storageQuotaExceeded") {
      msg = `ERRO DE COTA DE ARMAZENAMENTO DO GOOGLE: As Contas de Serviço (Service Accounts) possuem 0MB de cota pessoal. Use OAuth2 ou Drive Compartilhado.`;
    } else if (error?.status === 404 || error?.code === 404) {
      msg = `Pasta não encontrada no Google Drive (ID: ${folderId}). Verifique se compartilhou a pasta dando permissão de "Editor".`;
    } else if (error?.status === 403 || error?.code === 403) {
      msg = `Acesso negado à pasta do Google Drive (ID: ${folderId}). O e-mail precisa de permissão de "Editor" na pasta.`;
    }

    return {
      success: false,
      message: msg,
      details: error?.errors || error,
    };
  }
}

/**
 * Realiza o upload da carta PDF para a subpasta do participante no Google Drive
 */
export async function uploadPdfToGoogleDrive(fileData: FileUploadPayload): Promise<UploadResult> {
  const sanitizedPhone = fileData.participantPhone.replace(/\D/g, "");
  const timestamp = Date.now();
  
  const drive = getGoogleDriveClient();
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const resCreds = getGoogleCredentials();

  if (drive && rootFolderId) {
    try {
      // 1. Obter ou criar a subpasta com o NOME DO PARTICIPANTE
      const participantFolderId = await getOrCreateParticipantFolder(
        drive,
        rootFolderId,
        fileData.participantName
      );

      const bufferStream = new Readable();
      bufferStream.push(fileData.buffer);
      bufferStream.push(null);

      // 2. Anexar a carta DENTRO da subpasta do participante
      const response = await drive.files.create({
        requestBody: {
          name: `[CARTA] ${fileData.remitterName} - ${fileData.filename}`,
          parents: [participantFolderId],
          description: `Carta do evento Legendários enviada por ${fileData.remitterName} para o participante ${fileData.participantName} (${fileData.participantPhone}).`,
        },
        media: {
          mimeType: "application/pdf",
          body: bufferStream,
        },
        fields: "id, webViewLink, webContentLink",
        supportsAllDrives: true,
      });

      const fileUrl = response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`;

      return {
        url: fileUrl,
        provider: "gdrive",
        filename: fileData.filename,
        driveFileId: response.data.id || undefined,
        targetFolderId: participantFolderId,
      };
    } catch (error: any) {
      console.error("❌ Falha no upload para o Google Drive:", error);
      let errorDetail = error?.message || "Falha ao enviar arquivo para o Google Drive.";
      
      if (error?.message?.includes("storage quota") || error?.errors?.[0]?.reason === "storageQuotaExceeded") {
        errorDetail = `Cota de armazenamento excedida do Google. Por favor, crie a pasta dentro de um 'Drive Compartilhado' ou configure as chaves OAuth no .env.`;
      } else if (error?.code === 404 || error?.status === 404) {
        errorDetail = `Pasta do Google Drive não encontrada. Certifique-se de compartilhar a pasta como Editor.`;
      } else if (error?.code === 403 || error?.status === 403) {
        errorDetail = `Permissão negada no Google Drive. Verifique se deu acesso de Editor na pasta.`;
      }
      throw new Error(errorDetail);
    }
  }

  console.warn("⚠️ Credenciais do Google Drive não configuradas no .env. Executando em modo simulado.");
  const mockId = `mock_${timestamp}_${sanitizedPhone}`;
  const mockUrl = `https://drive.google.com/file/d/${mockId}/view`;

  return {
    url: mockUrl,
    provider: "local_mock",
    filename: fileData.filename,
    driveFileId: mockId,
  };
}

export const uploadPdf = uploadPdfToGoogleDrive;
