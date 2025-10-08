// app/api/login/route.ts
import { NextResponse } from "next/server";

const BASE_URL = "https://mjgest.mjdevs.com";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Credenciales requeridas" }, { status: 400 });
    }

    // La API espera "login" y "password"
    const upstream = await fetch(`${BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ login: email, password }),
    });

    const user = await upstream.json().catch(() => null);

    if (!upstream.ok || !user) {
      return NextResponse.json(
        { ok: false, error: user?.message || "Login inválido" },
        { status: upstream.status || 401 }
      );
    }

    // Token (si el backend no lo devuelve, generamos uno mock)
    const token =
      (user && (user.token || user.accessToken)) ||
      `mj-${Buffer.from(`${email}:${Date.now()}`).toString("base64url")}`;

    const res = NextResponse.json({ ok: true, user });

    // Tu cookie original (token)
    res.cookies.set({
      name: "session",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // NUEVA cookie con info mínima para rehidratar sesión al cargar
    const userId = user?.id ?? user?.user?.id; // por si viene anidado
    const login = user?.login ?? user?.user?.login ?? email;
    res.cookies.set({
      name: "coffee_session",
      value: JSON.stringify({ userId, login }),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "Error de red" }, { status: 500 });
  }
}
