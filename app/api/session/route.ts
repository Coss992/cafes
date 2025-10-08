// app/api/session/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const store = await cookies();
    const cookie = store.get("coffee_session");

    if (!cookie?.value) {
      return NextResponse.json({ ok: false, user: null }, { status: 200 });
    }

    let payload: { userId?: number; login?: string } | null = null;
    try {
      payload = JSON.parse(cookie.value);
    } catch {
      return NextResponse.json({ ok: false, user: null }, { status: 200 });
    }

    if (!payload?.userId) {
      return NextResponse.json({ ok: false, user: null }, { status: 200 });
    }

    return NextResponse.json({
      ok: true,
      user: { id: payload.userId, login: payload.login ?? "" },
    });
  } catch {
    return NextResponse.json({ ok: false, user: null }, { status: 200 });
  }
}
