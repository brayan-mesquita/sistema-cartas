import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  createSessionToken,
  isAuthMisconfigured,
  verifyCredentials,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Sem ADMIN_PASSWORD / ADMIN_SESSION_SECRET o login fica desativado.
    // Não existe senha padrão: aceitar uma seria o mesmo que não ter login.
    if (isAuthMisconfigured()) {
      console.error(
        "Login admin indisponível: defina ADMIN_PASSWORD e ADMIN_SESSION_SECRET no ambiente."
      );
      return NextResponse.json(
        { success: false, error: "Autenticação não configurada no servidor." },
        { status: 500 }
      );
    }

    const { username, password } = await request.json();

    if (!verifyCredentials(username, password)) {
      return NextResponse.json(
        { success: false, error: "Usuário ou senha incorretos." },
        { status: 401 }
      );
    }

    const token = createSessionToken();
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Autenticação não configurada no servidor." },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Autenticado com sucesso!",
    });

    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 horas — mesma janela codificada no token
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Erro no login admin:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logout realizado." });
  response.cookies.set(ADMIN_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
