import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_MAX_AGE, createAdminToken } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { password } = await request.json();
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof password !== "string" || password !== expected) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "strict", path: "/", maxAge: ADMIN_MAX_AGE,
  });
  return response;
}
