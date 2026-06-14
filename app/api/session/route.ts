import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  const unlocked = cookie
    .split(";")
    .map((part) => part.trim())
    .includes("hospital_notes_unlocked=1");

  return NextResponse.json({
    unlocked,
    user: unlocked
      ? {
          uid: "password-access",
          email: "Password access"
        }
      : null
  });
}
