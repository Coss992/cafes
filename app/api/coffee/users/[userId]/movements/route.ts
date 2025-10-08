// app/api/coffee/users/[userId]/movements/route.ts
import { NextResponse } from "next/server";

const API_BASE = process.env.COFFEE_API_BASE ?? "https://mjgest.mjdevs.com";

export async function GET(
  _req: Request,
  { params }: { params: { userId?: string } }
) {
  const userId = params.userId;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "userId requerido" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${API_BASE}/coffee/users/${userId}/movements`, {
      headers: { accept: "application/json" },
      // Si necesitas token/cabeceras, añádelas aquí.
      // headers: { Authorization: `Bearer ${token}`, accept: "application/json" }
      cache: "no-store",
    });

    // Si el servidor devuelve text/plain con JSON, tratamos igual.
    const text = await upstream.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      // por si realmente viene text/plain no JSON
      data = text;
    }

    return NextResponse.json(data, {
      status: upstream.ok ? 200 : upstream.status,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Fallo al contactar con el servidor externo" },
      { status: 502 }
    );
  }
}
