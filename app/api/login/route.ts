// app/api/login/route.ts
import { NextResponse } from "next/server";

const BASE_URL = "https://mjgest.mjdevs.com";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Credenciales requeridas" }, { status: 400 });
    }

    // La API espera "login" y "password" (según tu captura)
    const upstream = await fetch(`${BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ login: email, password }),
    });

    if (!upstream.ok) {
      const msg = await safeJson(upstream);
      return NextResponse.json(
        { ok: false, error: msg?.message || "Login inválido" },
        { status: upstream.status || 401 }
      );
    }

    // Intenta leer el body (según swagger, devuelve un objeto "User")
    const user = await safeJson(upstream);

    // Si tu backend devolviera un token (p. ej. user.token), úsalo.
    // Si no hay token, creamos uno mock local atado al email para manejar sesión en el cliente.
    const token =
      (user && (user.token || user.accessToken)) ||
      `mj-${Buffer.from(`${email}:${Date.now()}`).toString("base64url")}`;

    const res = NextResponse.json({ ok: true, user });

    res.cookies.set({
      name: "session",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return res;
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Error de red" }, { status: 500 });
  }
}

async function safeJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}
