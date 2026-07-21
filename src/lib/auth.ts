import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE = "admin_session";
export const ADMIN_USER = "admin";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24 horas

/**
 * O segredo de assinatura é obrigatório. Sem fallback: um valor padrão em
 * repositório público equivale a não ter autenticação alguma.
 */
function getSessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  return secret ? secret : null;
}

function getAdminPassword(): string | null {
  const pass = process.env.ADMIN_PASSWORD?.trim();
  return pass ? pass : null;
}

/** Comparação em tempo constante, tolerante a strings de tamanhos diferentes. */
function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  // timingSafeEqual exige buffers do mesmo tamanho; comparar os digests
  // normaliza o comprimento sem vazar informação sobre ele.
  const hashA = crypto.createHash("sha256").update(bufA).digest();
  const hashB = crypto.createHash("sha256").update(bufB).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Token de sessão no formato `<expiraEm>.<assinaturaHMAC>`.
 * A expiração faz parte do payload assinado, então não pode ser adulterada.
 */
export function createSessionToken(): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;

  const expiresAt = String(Date.now() + SESSION_TTL_MS);
  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;

  const secret = getSessionSecret();
  if (!secret) return false;

  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature) return false;

  if (!safeEquals(signature, sign(expiresAt, secret))) return false;

  const expiry = Number(expiresAt);
  return Number.isFinite(expiry) && Date.now() < expiry;
}

export function verifyCredentials(username: unknown, password: unknown): boolean {
  const expectedPass = getAdminPassword();
  if (!expectedPass) return false;
  if (typeof username !== "string" || typeof password !== "string") return false;

  // Avalia os dois lados sempre, para não encurtar o caminho pelo usuário.
  const userOk = safeEquals(username, ADMIN_USER);
  const passOk = safeEquals(password, expectedPass);
  return userOk && passOk;
}

/** True quando o servidor não tem as variáveis necessárias para autenticar. */
export function isAuthMisconfigured(): boolean {
  return !getSessionSecret() || !getAdminPassword();
}

/**
 * Guarda para as rotas de admin. Retorna uma resposta 401 quando a sessão é
 * inválida, ou `null` quando o acesso está liberado.
 */
export function requireAdmin(request: NextRequest): NextResponse | null {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Acesso não autorizado." }, { status: 401 });
  }
  return null;
}
