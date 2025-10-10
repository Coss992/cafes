import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // evita cachear la respuesta

type ApiUser = {
  id: number;
  login?: string;
  name?: string;
  email?: string;
  status?: { id: number; code: string; name: string };
  role?: { id: number; code: string; name: string };
};

/** Convierte string->int si procede, devolviendo null si no es número */
function toInt(v: string | null): number | null {
  if (v == null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isInteger(n) ? (n as number) : null;
}

export async function GET(req: NextRequest) {
  const incomingUrl = new URL(req.url);
  const qs = new URLSearchParams(incomingUrl.search);

  // Normalizamos page / rowsPerPage a enteros si vienen
  const page = toInt(qs.get("page"));
  const rowsPerPage = toInt(qs.get("rowsPerPage"));
  if (page !== null) qs.set("page", String(page));
  if (rowsPerPage !== null) qs.set("rowsPerPage", String(rowsPerPage));

  const upstream = (process.env.BACKEND_BASE_URL || "").replace(/\/+$/, "");
  const useProxy = upstream.length > 0;

  // 1) PROXY a tu backend real
  if (useProxy) {
    const target = `${upstream}/users/list?${qs.toString()}`;

    try {
      const res = await fetch(target, {
        // Si necesitas auth por cabecera, propágala aquí:
        // headers: { accept: "application/json", authorization: req.headers.get("authorization") ?? "" },
        headers: { accept: "application/json" },
        cache: "no-store",
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return NextResponse.json(
          { ok: false, error: "Upstream error", status: res.status, body },
          { status: 502 }
        );
      }

      const data = (await res.json().catch(() => [])) as unknown;
      return NextResponse.json(data, { status: 200 });
    } catch {
      return NextResponse.json(
        { ok: false, error: "Network error contacting backend" },
        { status: 500 }
      );
    }
  }

  // 2) MOCK local (sin BACKEND_BASE_URL) — útil para la DEMO
  const mock: ApiUser[] = [
    { id: 1, login: "jdoe", name: "John Doe", email: "john@example.com" },
    { id: 2, login: "maria", name: "María Pérez", email: "maria@example.com" },
    { id: 3, login: "pablo", name: "Pablo García", email: "pablo@example.com" },
    { id: 4, login: "laura", name: "Laura Ruiz", email: "laura@example.com" },
  ];

  // Filtros básicos de demo (por name)
  const nameFilter = (qs.get("name") || "").toLowerCase();
  const filtered = nameFilter
    ? mock.filter((u) =>
        (u.name || u.login || "").toLowerCase().includes(nameFilter)
      )
    : mock;

  return NextResponse.json(filtered, { status: 200 });
}
