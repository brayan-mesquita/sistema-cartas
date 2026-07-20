import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const expectedUser = "admin";
    const expectedPass = process.env.ADMIN_PASSWORD || "legendarios123";

    if (username === expectedUser && password === expectedPass) {
      const response = NextResponse.json({
        success: true,
        message: "Autenticado com sucesso!",
      });

      // Define cookie seguro de sessão admin
      response.cookies.set("admin_session", "authenticated_token_legendarios", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 horas
        path: "/",
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "Usuário ou senha incorretos." },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Logout realizado." });
  response.cookies.set("admin_session", "", { maxAge: 0, path: "/" });
  return response;
}
