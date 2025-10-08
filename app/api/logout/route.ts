// app/api/logout/route.ts
import { NextResponse } from "next/server";

function clearSessionCookie() {
  return {
    name: "session",
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };
}

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(clearSessionCookie());
  return res;
}

export async function GET() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(clearSessionCookie());
  return res;
}
