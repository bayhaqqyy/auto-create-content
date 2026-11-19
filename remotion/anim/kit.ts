// Alat bantu kecil untuk gambar kanvas animasi (deterministik, tanpa Math.random).
export const W = 1080;
export const H = 1920;
export type Ctx = CanvasRenderingContext2D;

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const ease = {
  inQuad: (k: number) => k * k,
  outCubic: (k: number) => 1 - Math.pow(1 - k, 3),
  inOutQuad: (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
  inOutCubic: (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  outBack: (k: number, s = 1.70158) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2),
};
/** angka semu-acak 0..1 yang selalu sama untuk (i, seed) */
export const hash = (i: number, seed = 0) => {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const pop = (t: number, t0: number, d = 0.28, s = 2.4) => (t < t0 ? 0 : ease.outBack(clamp((t - t0) / d), s));
export const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (c: number) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k);
  return "#" + [f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, "0")).join("");
};
export const mixHex = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, j) => Math.round(lerp(v, pb[j], k))).join(",")})`;
};

/** Teks dengan garis tepi, mengecil otomatis kalau melebihi maxW. */
export function outlined(
  ctx: Ctx, str: string, x: number, y: number, size: number, color: string,
  o: { fam?: string; weight?: number | string; stroke?: string; sw?: number; align?: CanvasTextAlign; maxW?: number } = {},
) {
  const { fam = "Anton", weight = 400, stroke = "#2B2522", sw = 0.15, align = "center", maxW = 960 } = o;
  ctx.save();
  ctx.font = `${weight} ${size}px "${fam}"`;
  let s = size;
  const w = ctx.measureText(str).width;
  if (w > maxW) s = (size * maxW) / w;
  ctx.font = `${weight} ${s}px "${fam}"`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.lineJoin = "round";
  if (sw) { ctx.lineWidth = s * sw; ctx.strokeStyle = stroke; ctx.strokeText(str, x, y); }
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.restore();
  return s;
}

export function txt(ctx: Ctx, str: string, x: number, y: number, size: number, color: string, o: { weight?: number; align?: CanvasTextAlign; fam?: string; maxW?: number } = {}) {
  const { weight = 700, align = "left", fam = "Plus Jakarta Sans", maxW } = o;
  ctx.save();
  let s = size;
  ctx.font = `${weight} ${s}px "${fam}"`;
  if (maxW) { const w = ctx.measureText(str).width; if (w > maxW) { s = (size * maxW) / w; ctx.font = `${weight} ${s}px "${fam}"`; } }
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "alphabetic"; ctx.fillText(str, x, y);
  ctx.restore();
}

/** Kamera: zoom ke titik fokus (fx, fy) yang ditaruh di (W/2, cy). */
export function withCam(ctx: Ctx, c: { z: number; fx: number; fy: number; sx?: number; sy?: number; cy?: number }, draw: () => void) {
  ctx.save();
  ctx.translate(W / 2 + (c.sx || 0), (c.cy ?? H / 2) + (c.sy || 0));
  ctx.scale(c.z, c.z);
  ctx.translate(-c.fx, -c.fy);
  draw();
  ctx.restore();
}

export const shakeAt = (t: number, t0: number, amp: number, d = 7) => (t < t0 ? 0 : amp * Math.exp(-(t - t0) * d) * Math.sin((t - t0) * 80));

/** Kamera dari arahan naskah. */
export function camFor(kind: string | undefined, t: number, dur: number, base: { fx: number; fy: number; cy?: number }, hit = 0.35) {
  const k = ease.inOutQuad(clamp(t / Math.max(0.5, dur)));
  let z = 1, sx = 0;
  if (kind === "dorong") z = lerp(1.0, 1.1, k);
  else if (kind === "tarik") z = lerp(1.14, 1.0, k);
  else if (kind === "ikuti") z = 1.06;
  else if (kind === "guncang") { z = 1.06; sx = shakeAt(t, hit, 26) + shakeAt(t, hit + 0.7, 18); }
  return { z, sx, sy: sx * 0.4, fx: base.fx + (kind === "ikuti" ? lerp(-60, 60, k) : 0), fy: base.fy, cy: base.cy };
}

/** Pecahan "BARIS 1|BARIS 2". */
export const twoLines = (s: string) => {
  const [a, ...b] = (s || "").split("|");
  return [a.trim(), b.join(" ").trim()] as const;
};
