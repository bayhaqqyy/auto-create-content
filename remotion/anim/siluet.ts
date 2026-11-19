// @ts-nocheck — motivasi: stickman siluet sinematik, langit berubah dari hujan ke matahari terbit sepanjang video.
import { W, H, clamp, lerp, ease, hash, outlined, withCam, shakeAt, twoLines, mixHex } from "./kit";
import type { AnimInput } from "./types";

const SIL = "#121218", GOLD = "#FFC94A";
const rad = (d) => (d * Math.PI) / 180;
const P = {
  stand: { la: [-12, -8], ra: [12, 8], ll: [-8, -4], rl: [8, 4], lean: 0 },
  slip: { la: [-150, -120], ra: [120, 150], ll: [40, 70], rl: [-20, 10], lean: -0.5 },
  sit: { la: [75, 15], ra: [85, 25], ll: [80, 175], rl: [88, 178], lean: 0.6 },
  fist: { la: [-12, -8], ra: [115, 175], ll: [-12, -6], rl: [12, 6], lean: -0.05 },
  cheer: { la: [-130, -150], ra: [130, 150], ll: [-14, -6], rl: [14, 6], lean: -0.05 },
};
const climbPose = (u) => ({ la: [-25 + 50 * u, -10 + 40 * u], ra: [25 - 50 * u, 10 - 40 * u], ll: [lerp(40, -5, u), lerp(-20, -5, u)], rl: [lerp(-5, 40, u), lerp(-5, -20, u)], lean: 0.15 });
const walkPose = (ph, run) => { const a = Math.sin(ph) * (run ? 40 : 26); return { la: [-a, -a + (run ? 70 : 12)], ra: [a, a + (run ? 70 : 12)], ll: [a, a - Math.max(0, -Math.sin(ph)) * 40], rl: [-a, -a - Math.max(0, Math.sin(ph)) * 40], lean: run ? 0.22 : 0.05 }; };
const mix = (A, B, k) => { const o = { lean: lerp(A.lean, B.lean, k) }; for (const key of ["la", "ra", "ll", "rl"]) o[key] = [lerp(A[key][0], B[key][0], k), lerp(A[key][1], B[key][1], k)]; return o; };

function limb(ctx, p, a1, a2, l1, l2) {
  const e = [p[0] + Math.sin(rad(a1)) * l1, p[1] + Math.cos(rad(a1)) * l1];
  const h = [e[0] + Math.sin(rad(a2)) * l2, e[1] + Math.cos(rad(a2)) * l2];
  ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(e[0], e[1]); ctx.lineTo(h[0], h[1]); ctx.stroke();
}
function stick(ctx, { x, y, s = 1, pose, rot = 0, rim = 0, hipY = -185, headDown = 0 }) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  if (rim > 0) { ctx.shadowColor = `rgba(255,201,74,${rim})`; ctx.shadowBlur = 30; }
  ctx.strokeStyle = SIL; ctx.fillStyle = SIL; ctx.lineWidth = 17; ctx.lineCap = "round"; ctx.lineJoin = "round";
  const hip = [0, hipY];
  limb(ctx, hip, pose.ll[0], pose.ll[1], 96, 92);
  limb(ctx, hip, pose.rl[0], pose.rl[1], 96, 92);
  ctx.save(); ctx.translate(hip[0], hip[1]); ctx.rotate(pose.lean * 0.6); ctx.translate(-hip[0], -hip[1]);
  ctx.beginPath(); ctx.moveTo(0, hipY); ctx.lineTo(0, hipY - 150); ctx.stroke();
  const sh = [0, hipY - 133];
  limb(ctx, sh, pose.la[0], pose.la[1], 92, 88);
  limb(ctx, sh, pose.ra[0], pose.ra[1], 92, 88);
  ctx.beginPath(); ctx.arc(headDown * 30, hipY - 227 + headDown * 25, 70, 0, 7); ctx.fill();
  ctx.restore(); ctx.restore();
}

const GROUND = 1500;
function sky(ctx, k) {
  const g = ctx.createLinearGradient(0, -400, 0, H);
  g.addColorStop(0, mixHex("#1E2638", "#3B2F6B", k)); g.addColorStop(0.55, mixHex("#37425C", "#F0785A", k)); g.addColorStop(1, mixHex("#4A5470", "#FFD27A", k));
  ctx.fillStyle = g; ctx.fillRect(-2500, -3000, W + 5000, H + 6000);
}
function sun(ctx, k, x, y) {
  if (k <= 0) return;
  const gl = ctx.createRadialGradient(x, y, 0, x, y, 700); gl.addColorStop(0, `rgba(255,230,150,${0.7 * k})`); gl.addColorStop(1, "rgba(255,230,150,0)");
  ctx.fillStyle = gl; ctx.fillRect(x - 700, y - 700, 1400, 1400);
  ctx.fillStyle = `rgba(255,240,190,${k})`; ctx.beginPath(); ctx.arc(x, y, 150, 0, 7); ctx.fill();
}
function hills(ctx, k) { ctx.fillStyle = mixHex("#2A3248", "#B5506A", k); ctx.beginPath(); ctx.moveTo(-2500, 1350); ctx.quadraticCurveTo(200, 1150, 600, 1300); ctx.quadraticCurveTo(900, 1180, 1500, 1320); ctx.lineTo(3500, 1320); ctx.lineTo(3500, 2600); ctx.lineTo(-2500, 2600); ctx.fill(); }
function clouds(ctx, t, a) { if (a <= 0) return; ctx.fillStyle = `rgba(30,34,48,${0.85 * a})`; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(((i * 260 + t * 20) % 1700) - 300, 200 + (i % 2) * 70, 260, 90, 0, 0, 7); ctx.fill(); } }
function rain(ctx, t, a) {
  if (a <= 0) return;
  ctx.strokeStyle = `rgba(200,215,240,${0.45 * a})`; ctx.lineWidth = 3;
  for (let i = 0; i < 70; i++) { const x = ((hash(i, 1) * (W + 400) + t * 140) % (W + 400)) - 200, y = ((hash(i, 2) * H + t * 1700) % (H + 300)) - 150; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 14, y + 46); ctx.stroke(); }
}
const SX = 300, SW = 112, SH = 92;
const stepPos = (i) => [SX + 70 + (i + 1) * SW - SW / 2, GROUND - (i + 1) * SH];
function stairs(ctx, n = 9) {
  ctx.fillStyle = SIL; ctx.beginPath(); ctx.moveTo(SX, GROUND);
  for (let i = 0; i < n; i++) { const x = SX + 70 + i * SW; ctx.lineTo(x, GROUND - i * SH); ctx.lineTo(x, GROUND - (i + 1) * SH); ctx.lineTo(x + SW, GROUND - (i + 1) * SH); }
  const topX = SX + 70 + n * SW, topY = GROUND - n * SH;
  ctx.lineTo(topX + 2500, topY); ctx.lineTo(topX + 2500, GROUND + 1000); ctx.lineTo(SX, GROUND + 1000); ctx.closePath(); ctx.fill();
}
function flat(ctx) { ctx.fillStyle = SIL; ctx.fillRect(-2500, GROUND, W + 5000, 1500); }
function summit(ctx) { ctx.fillStyle = SIL; ctx.beginPath(); ctx.moveTo(-2500, 1900); ctx.quadraticCurveTo(300, 1500, 540, GROUND); ctx.quadraticCurveTo(800, 1500, 3500, 1900); ctx.lineTo(3500, 4000); ctx.lineTo(-2500, 4000); ctx.fill(); }
function city(ctx, k) { ctx.fillStyle = mixHex("#1A2032", "#5A3050", k); for (let i = 0; i < 14; i++) { const x = -600 + i * 170, h = 300 + hash(i, 4) * 600; ctx.fillRect(x, GROUND - h, 140, h); ctx.fillStyle = `rgba(255,220,140,${0.5 * (1 - k)})`; for (let r = 0; r < 6; r++) if (hash(i, r + 10) > 0.5) ctx.fillRect(x + 20 + (r % 2) * 60, GROUND - h + 40 + r * 60, 30, 30); ctx.fillStyle = mixHex("#1A2032", "#5A3050", k); } flat(ctx); }
function road(ctx, t) { flat(ctx); ctx.fillStyle = "#1E1E26"; ctx.beginPath(); ctx.moveTo(500, GROUND); ctx.lineTo(580, GROUND); ctx.lineTo(1400, 4000); ctx.lineTo(-300, 4000); ctx.fill(); ctx.strokeStyle = "rgba(255,201,74,0.6)"; ctx.lineWidth = 8; ctx.setLineDash([60, 80]); ctx.lineDashOffset = -t * 200; ctx.beginPath(); ctx.moveTo(540, GROUND); ctx.lineTo(540, 4000); ctx.stroke(); ctx.setLineDash([]); }

function hero(c, t, dur, set) {
  const x0 = set === "tangga" ? SX - 70 : 470;
  switch (c.pose) {
    case "jatuh": {
      const u = clamp(t / 0.6);
      return { x: x0 - 30 * u, y: GROUND - Math.sin(Math.PI * u) * 60, pose: mix(P.stand, P.slip, clamp(t / 0.15)), rot: lerp(0, -1.35, ease.inQuad(u)) };
    }
    case "duduk": return { x: x0, y: GROUND + 120, pose: P.sit, hipY: -50, headDown: 1 };
    case "bangkit": { const k = ease.outBack(clamp((t - 0.2) / 0.5), 1.5); const p = mix(P.stand, P.fist, clamp((t - 0.9) / 0.2)); return { x: x0, y: GROUND + 120 * (1 - k), pose: k < 1 ? mix(P.sit, p, clamp(k)) : p, hipY: lerp(-50, -185, k) }; }
    case "kepal": return { x: x0, y: GROUND, pose: mix(P.stand, P.fist, ease.outCubic(clamp((t - 0.1) / 0.25))) };
    case "jalan": return { x: lerp(x0 - 220, x0 + 120, clamp(t / dur)), y: GROUND, pose: walkPose(t * 7, false) };
    case "lari": return { x: lerp(x0 - 380, x0 + 220, clamp(t / dur)), y: GROUND - Math.abs(Math.sin(t * 7)) * 20, pose: walkPose(t * 12, true) };
    case "naik": {
      if (set !== "tangga") return { x: x0, y: GROUND, pose: walkPose(t * 7, false) };
      const n = 8, per = Math.max(0.45, (dur - 0.3) / n);
      const i = Math.min(n - 1, Math.floor(t / per)), u = ease.inOutCubic(clamp((t - i * per) / (per * 0.7)));
      const from = i === 0 ? [x0, GROUND] : stepPos(i - 1), to = stepPos(i);
      return { x: lerp(from[0], to[0], u), y: lerp(from[1], to[1], u) - Math.sin(Math.PI * u) * 40, pose: climbPose(u), step: i + (u > 0.5 ? 1 : 0) };
    }
    case "sorak": {
      const [tx, ty] = set === "tangga" ? stepPos(7) : [540, GROUND];
      return { x: tx + (set === "tangga" ? 30 : 0), y: ty - Math.abs(Math.sin(t * 5)) * 12, pose: mix(P.stand, P.cheer, ease.outCubic(clamp(t / 0.25))), rim: 0.9 };
    }
    default: return { x: x0, y: GROUND, pose: P.stand };
  }
}

/** Gambar satu frame scene motivasi siluet. */
export function drawSiluet(ctx, inp: AnimInput) {
  const { t, dur, anim, index, total } = inp;
  const ev = anim.event, set = anim.set;
  const d0 = total > 1 ? index / (total - 1) : 0;
  const d1 = total > 1 ? Math.min(1, (index + 1) / (total - 1)) : 1;
  let k = lerp(d0, d1, clamp(t / dur) * 0.6);
  if (ev === "matahari") k = Math.max(k, lerp(d0, 1, ease.inOutCubic(clamp(t / Math.min(dur, 2.5)))));
  if (set === "hujan") k = Math.min(k, 0.25);
  const rainA = set === "hujan" || k < 0.2 ? (ev === "hujan-reda" ? 1 - clamp((t - 0.3) / 1.2) : 1) : 0;
  const c = anim.cast?.[0] || { pose: "berdiri" };
  const h = hero(c, t, dur, set);
  const shake = ev === "jatuh" || c.pose === "jatuh" ? shakeAt(t, 0.6, 22) : 0;
  let z = anim.camera === "tarik" ? lerp(1.2, 0.95, ease.outCubic(clamp(t / dur))) : anim.camera === "dorong" ? lerp(1.05, 1.2, clamp(t / dur)) : 1.12;
  let fx = 470, fy = 1260;
  if (set === "tangga") { fx = lerp(430, h.x, 0.85); fy = h.y - 260 + 120; if (c.pose === "sorak") { z = lerp(1.15, 0.92, ease.outCubic(clamp(t / 1.2))); fy += lerp(0, 120, clamp(t / 1.2)); } }
  if (c.pose === "jalan" || c.pose === "lari") fx = lerp(470, h.x, 0.7);
  withCam(ctx, { z, fx, fy, sx: shake, cy: H * 0.62 }, () => {
    sky(ctx, k);
    if (set === "puncak" || set === "tangga" || ev === "matahari") sun(ctx, set === "puncak" ? Math.max(k, 0.6) : k, set === "tangga" ? 760 : 540, lerp(1700, set === "puncak" ? 1250 : 980, Math.max(k, set === "puncak" ? 0.6 : 0)));
    hills(ctx, k);
    clouds(ctx, t, 1 - k * 2);
    if (set === "tangga") stairs(ctx);
    else if (set === "puncak") summit(ctx);
    else if (set === "kota") city(ctx, k);
    else if (set === "jalan") road(ctx, t);
    else flat(ctx);
    stick(ctx, { x: h.x, y: h.y, s: 0.95, pose: h.pose, rot: h.rot || 0, rim: h.rim || k * 0.4, hipY: h.hipY ?? -185, headDown: h.headDown || 0 });
    if (c.pose === "sorak" || ev === "matahari") {
      const u = t; for (let i = 0; i < 40; i++) { const a = hash(i, 5) * Math.PI * 2, v = 200 + hash(i, 6) * 500, r = (u * v) % 900; const x = h.x + Math.cos(a) * r, y = h.y - 400 + Math.sin(a) * r * 0.8 - u * 40; ctx.fillStyle = `rgba(255,230,160,${clamp(1 - r / 900) * 0.9})`; ctx.beginPath(); ctx.arc(x, y, 5 + hash(i, 7) * 6, 0, 7); ctx.fill(); }
    }
  });
  rain(ctx, t, rainA);
  // teks
  const [a, b] = twoLines(inp.screenText);
  const al = inp.index === 0 ? 1 : clamp((t - 0.1) / 0.3);
  const kk = ease.outCubic(clamp((t - 0.1) / 0.5));
  ctx.save(); ctx.globalAlpha = al; ctx.translate(W / 2, 360 + (1 - kk) * 30);
  const size = Math.max(a.length, b.length) > 14 ? 80 : 94;
  if (a) outlined(ctx, a.toUpperCase(), 0, 0, size, "#FFFFFF", { fam: "Bungee", stroke: "rgba(10,10,20,0.85)", sw: 0.15, maxW: 940 });
  if (b && ev !== "langkah") outlined(ctx, b.toUpperCase(), 0, size * 1.08, size, GOLD, { fam: "Bungee", stroke: "rgba(10,10,20,0.85)", sw: 0.15, maxW: 940 });
  if (ev === "langkah") { const n = h.step ?? Math.min(8, Math.floor((t / dur) * 8) + 1); outlined(ctx, `${b ? b.toUpperCase() + " " : ""}${n} / 8`, 0, size * 1.1, size, GOLD, { fam: "Bungee", stroke: "rgba(10,10,20,0.85)", sw: 0.15, maxW: 940 }); }
  ctx.restore();
}
