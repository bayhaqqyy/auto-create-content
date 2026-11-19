import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, authEnabled, verifySession } from "./lib/session";

const PUBLIC = ["/login", "/api/auth/login"];

/** Wajib login kalau AUTH_EMAIL, AUTH_PASSWORD_HASH dan AUTH_SECRET diisi. Halaman diarahkan ke /login, API dapat 401. */
export async function middleware(req: NextRequest) {
  if (!authEnabled()) return NextResponse.next();
  const { pathname, search } = req.nextUrl;
  if (PUBLIC.includes(pathname)) return NextResponse.next();
  if (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Login dibutuhkan" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image|fonts/|favicon.ico).*)"] };
