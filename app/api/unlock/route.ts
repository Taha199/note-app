import { NextResponse } from "next/server";

const unlockCookieName = "hospital_notes_unlocked";

export async function POST(request: Request) {
  const appPassword = process.env.APP_PASSWORD ?? "8826017";

  const body = (await request.json().catch(() => null)) as {
    password?: string;
  } | null;

  if (body?.password !== appPassword) {
    return NextResponse.json({ error: "Invalid app password" }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    user: {
      uid: "password-access",
      email: "Password access"
    }
  });
  response.cookies.set(unlockCookieName, "1", {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return response;
}
