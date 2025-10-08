// app/api/coffee/users/[userId]/movements/route.ts
import { NextResponse } from "next/server";

const API_BASE = process.env.COFFEE_API_BASE ?? "https://mjgest.mjdevs.com";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ userId?: string }> } // 👈 params ahora es Promise
) {
  const { userId } = await ctx.params;           // 👈 hay que await
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "userId requerido" },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(`${API_BASE}/coffee/users/${userId}/movements`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    const text = await upstream.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text; // por si viniera text/plain
    }

    return NextResponse.json(data, {
      status: upstream.ok ? 200 : upstream.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Fallo al contactar con el servidor externo" },
      { status: 502 }
    );
  }
}
