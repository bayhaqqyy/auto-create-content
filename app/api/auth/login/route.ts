import { NextResponse } from "next/server";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { SESSION_COOKIE, SESSION_DAYS, authEnabled, createSession } from "../../../../lib/session";

export const runtime = "nodejs";

// Batas percobaan gagal per IP: 5 kali per 10 menit.
const WINDOW = 10 * 60_000;
const MAX_FAIL = 5;
const fails = new Map<string, { n: number; until: number }>();

function passwordOk(password: string) {
  const [salt, hash] = (process.env.AUTH_PASSWORD_HASH || "").split(":");
  if (!salt || !hash) return false;
  const want = Buffer.from(hash, "hex");
  const got = scryptSync(password, Buffer.from(salt, "hex"), want.length);
  return timingSafeEqual(got, want);
}

export async function POST(req: Request) {
  if (!authEnabled()) return NextResponse.json({ ok: true });
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "lokal";
  const rec = fails.get(ip);
  if (rec && rec.until > Date.now() && rec.n >= MAX_FAIL) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi 10 menit lagi." }, { status: 429 });
  }
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (email !== process.env.AUTH_EMAIL!.toLowerCase() || !passwordOk(password)) {
    const cur = rec && rec.until > Date.now() ? rec : { n: 0, until: Date.now() + WINDOW };
    fails.set(ip, { n: cur.n + 1, until: cur.until });
    return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
  }
  fails.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSession(process.env.AUTH_EMAIL!), {
    httpOnly: true,
    sameSite: "lax",
    secure: req.headers.get("x-forwarded-proto") === "https",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
  return res;
}
