import { NextResponse } from "next/server";

function clearCookie(name: string) {
  return {
    name,
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
  // Borra todas las cookies de sesión que puedas haber usado
  res.cookies.set(clearCookie("session"));
  res.cookies.set(clearCookie("coffee_session"));
  res.cookies.set(clearCookie("token"));
  return res;
}

export async function GET() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(clearCookie("session"));
  res.cookies.set(clearCookie("coffee_session"));
  res.cookies.set(clearCookie("token"));
  return res;
}
