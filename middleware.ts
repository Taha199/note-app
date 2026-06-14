import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const unlocked = request.cookies.get("hospital_notes_unlocked")?.value === "1";

  if (!unlocked) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
