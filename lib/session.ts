/** Sesi login berbasis cookie bertanda tangan HMAC. Hanya Web Crypto, jadi bisa dipakai di middleware (edge) dan route (node). */
export const SESSION_COOKIE = "studio_session";
export const SESSION_DAYS = 30;

const enc = new TextEncoder();
const b64url = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export const authEnabled = () => !!(process.env.AUTH_EMAIL && process.env.AUTH_PASSWORD_HASH && process.env.AUTH_SECRET);

async function sign(data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(process.env.AUTH_SECRET || ""), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

/** Nilai cookie: `<kadaluarsa ms>.<tanda tangan>`. */
export async function createSession(email: string) {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  return `${exp}.${await sign(`${email}|${exp}`)}`;
}

export async function verifySession(value: string | undefined) {
  if (!value) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  const want = await sign(`${process.env.AUTH_EMAIL}|${exp}`);
  if (want.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
