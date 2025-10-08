// app/api/coffee/movements/create/route.ts
import { NextResponse } from "next/server";

const API_BASE = "https://mjgest.mjdevs.com";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const upstream = await fetch(`${API_BASE}/coffee/movements/create`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // El swagger marca text/plain, pero devolvéis JSON; pedimos JSON:
        accept: "application/json, text/plain;q=0.9,*/*;q=0.8",
      },
      body: JSON.stringify(payload),
      // credenciales/cookies no necesarias para este endpoint
    });

    const text = await upstream.text();

    // Intentamos parsear como JSON; si no, devolvemos texto plano.
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: upstream.status });
    } catch {
      return new NextResponse(text, {
        status: upstream.status,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Fallo al contactar con el servicio." },
      { status: 500 }
    );
  }
}
