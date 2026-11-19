// @ts-nocheck — gambar kanvas hasil port dari film "KKN di Pedalaman Kalimantan" (flat 2D, garis tebal).
import { W, H, clamp, lerp, ease, hash, pop, shade, outlined, txt, withCam, camFor, shakeAt, twoLines } from "./kit";
import type { AnimInput } from "./types";
import { LOOK_PRESETS } from "../../lib/anim";

const C = { ink: "#2B2522", white: "#FFFFFF", yellow: "#FFD23F", red: "#E23B3B", lime: "#A4FF19", navy: "#0F1928" };
const LW = 7;
const rnd = (i, s) => hash(i, s);

function path(ctx, fill, lw = LW, close = true) {
  if (close) ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.stroke(); }
}
function rr(ctx, x, y, w, h, r, fill, lw = LW, stroke = C.ink) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = "round"; ctx.stroke(); }
}
function circ(ctx, x, y, r, fill, lw = LW) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); path(ctx, fill, lw, false); }
function ell(ctx, x, y, rx, ry, fill, lw = LW, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); path(ctx, fill, lw, false); }
function limb(ctx, pts, w, color) {
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]);
  ctx.strokeStyle = C.ink; ctx.lineWidth = w + LW * 2; ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
}

/* ---------------- tokoh ---------------- */
const ARMS = {
  down: { L: [-124, 6], R: [124, 6] },
  phone: { L: [-34, -84], R: [34, -84], prop: "phone" },
  straps: { L: [-56, -150], R: [56, -150] },
  raise: { L: [-124, 6], R: [150, -330] },
  point: { L: [-124, 6], R: [250, -190] },
  cup: { L: [-124, 6], R: [40, -110], prop: "cup" },
  push: { L: [-250, -250], R: [-160, -290] },
  whisper: { L: [-124, 6], R: [70, -250] },
  hug: { L: [60, -110], R: [-60, -110] },
};
const POSE = { berdiri: ["stand", "down"], duduk: ["sit", "hug"], hp: ["stand", "phone"], ransel: ["stand", "straps"], angkat: ["stand", "raise"], tunjuk: ["stand", "point"], minum: ["stand", "cup"], bisik: ["stand", "whisper"], peluk: ["stand", "hug"], dorong: ["stand", "push"] };
const MOOD = { tenang: "calm", senang: "happy", curiga: "sus", cemas: "worried", kaget: "shock", tegas: "stern", seram: "creepy" };

function person(ctx, x, y, s, t, st, o = {}) {
  const pose = o.pose || "stand", mood = o.mood || "calm", lookDown = o.lookDown || 0;
  const breathe = Math.sin(t * 2.4 + x * 0.01) * 3;
  const thin = st.thin ? 0.88 : 1;
  ctx.save(); ctx.translate(x, y + (o.bob || 0)); ctx.scale(s * (o.flip ? -1 : 1), s);
  ctx.fillStyle = "rgba(0,0,0,0.18)"; ctx.beginPath(); ctx.ellipse(0, pose === "sit" ? 236 : 256, 140, 20, 0, 0, Math.PI * 2); ctx.fill();
  const bc = st.bottomCol;
  if (pose === "stand") {
    if (st.bottom === "pants") for (const sd of [-1, 1]) { rr(ctx, sd * 44 - 34, -10, 68, 252, 24, bc); ell(ctx, sd * 50, 250, 46, 22, st.shoe); }
    else {
      for (const sd of [-1, 1]) ell(ctx, sd * 42, 250, 36, 18, st.shoe);
      const wTop = st.bottom === "sarung" ? 98 : 96, wBot = st.bottom === "sarung" ? 96 : 128;
      ctx.beginPath(); ctx.moveTo(-wTop, -12); ctx.lineTo(-wBot, 236); ctx.quadraticCurveTo(0, 248, wBot, 236); ctx.lineTo(wTop, -12); path(ctx, bc);
      if (st.bottom === "sarung") {
        ctx.save(); ctx.clip(); ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 8;
        for (let k = -2; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-120, k * 50); ctx.lineTo(120, k * 50); ctx.stroke(); }
        for (let k = -2; k < 3; k++) { ctx.beginPath(); ctx.moveTo(k * 50, -20); ctx.lineTo(k * 50, 260); ctx.stroke(); }
        ctx.restore(); ctx.beginPath(); ctx.moveTo(-wTop, -12); ctx.lineTo(-wBot, 236); ctx.quadraticCurveTo(0, 248, wBot, 236); ctx.lineTo(wTop, -12); path(ctx, null);
      }
    }
  } else {
    if (st.bottom === "pants") for (const sd of [-1, 1]) { rr(ctx, sd * 82 - 40, -10, 80, 70, 26, bc); rr(ctx, sd * 78 - 32, 40, 64, 180, 22, bc); ell(ctx, sd * 86, 228, 50, 24, st.shoe); }
    else { for (const sd of [-1, 1]) ell(ctx, sd * 60, 228, 40, 20, st.shoe); rr(ctx, -128, -12, 256, 76, 30, bc); ctx.beginPath(); ctx.moveTo(-110, 40); ctx.lineTo(-120, 214); ctx.lineTo(120, 214); ctx.lineTo(110, 40); path(ctx, bc); }
  }
  const ty = -215 + breathe, tw = 88 * thin;
  const torso = () => { ctx.beginPath(); ctx.moveTo(-tw, ty + 20); ctx.quadraticCurveTo(-tw - 4, ty, -tw + 28, ty - 4); ctx.lineTo(tw - 28, ty - 4); ctx.quadraticCurveTo(tw + 4, ty, tw, ty + 20); ctx.lineTo(tw + 24, 10); ctx.quadraticCurveTo(tw + 22, 30, tw, 30); ctx.lineTo(-tw, 30); ctx.quadraticCurveTo(-tw - 22, 30, -tw - 24, 10); };
  torso(); path(ctx, st.jacket || st.top);
  ctx.save(); torso(); ctx.clip();
  if (st.jacket) { ctx.fillStyle = st.top; ctx.fillRect(-24, ty - 10, 48, 260); ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-24, ty); ctx.lineTo(-24, 40); ctx.moveTo(24, ty); ctx.lineTo(24, 40); ctx.stroke(); ctx.fillStyle = "#F2C14E"; ctx.fillRect(-tw + 18, ty + 70, 34, 20); }
  if (st.topPattern === "batik") { ctx.strokeStyle = "rgba(255,220,150,0.45)"; ctx.lineWidth = 5; for (let i = 0; i < 12; i++) { const px = -90 + (i % 4) * 60, py = ty + 40 + Math.floor(i / 4) * 70; ctx.beginPath(); ctx.arc(px, py, 16, 0, Math.PI * 1.5); ctx.stroke(); } }
  ctx.globalAlpha = 0.25; ctx.fillStyle = "#000"; ctx.fillRect(tw - 40, ty, 80, 260); ctx.restore();
  torso(); path(ctx, null);
  if (o.bag) { ctx.strokeStyle = C.ink; ctx.lineWidth = 22; ctx.lineCap = "round"; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 54, ty + 4); ctx.lineTo(sd * 60, -60); ctx.stroke(); } ctx.strokeStyle = o.bag; ctx.lineWidth = 10; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 54, ty + 4); ctx.lineTo(sd * 60, -60); ctx.stroke(); } }
  if (st.hair === "hijab") { ctx.beginPath(); ctx.moveTo(-104, ty - 70); ctx.quadraticCurveTo(-120, ty + 60, -70, ty + 96); ctx.quadraticCurveTo(0, ty + 130, 70, ty + 96); ctx.quadraticCurveTo(120, ty + 60, 104, ty - 70); path(ctx, st.hijabCol); }
  else { ctx.beginPath(); ctx.moveTo(-34, ty - 2); ctx.quadraticCurveTo(0, ty + 34, 34, ty - 2); path(ctx, shade(st.skin, -0.12), LW, false); }
  ctx.save(); ctx.translate(0, ty - 92 + lookDown * 14 + breathe * 0.3); ctx.rotate(lookDown * 0.06);
  head(ctx, t, st, mood, o.look || 0, lookDown, o);
  ctx.restore();
  if (st.neckCloth) {
    const ny = ty + 18;
    ctx.beginPath(); ctx.moveTo(40, ny + 10); ctx.quadraticCurveTo(70, ny + 80, 54, ny + 160); ctx.lineTo(22, ny + 150); ctx.quadraticCurveTo(36, ny + 80, 14, ny + 20); path(ctx, st.neckCloth);
    rr(ctx, -66, ny - 26, 132, 50, 22, st.neckCloth);
  }
  const sh = ty + 24, arms = JSON.parse(JSON.stringify(ARMS[o.arms || "down"]));
  const jx = o.shake ? Math.sin(t * 90) * 5 * o.shake : 0;
  const sleeve = st.jacket || st.top;
  for (const side of ["L", "R"]) {
    const sd = side === "L" ? -1 : 1;
    const S0 = [sd * (tw - 4), sh], Hh = [arms[side][0] + jx, arms[side][1] + breathe];
    const mx = (S0[0] + Hh[0]) / 2, my = (S0[1] + Hh[1]) / 2;
    const dx = Hh[0] - S0[0], dy = Hh[1] - S0[1], len = Math.hypot(dx, dy) || 1;
    const bend = Math.max(0, 150 - len * 0.45);
    const E = [mx + (-dy / len) * bend * -sd, my + (dx / len) * bend * -sd];
    if (st.sleeve === "short") { limb(ctx, [S0, E, Hh], 40, st.skin); limb(ctx, [S0, [lerp(S0[0], E[0], 0.6), lerp(S0[1], E[1], 0.6)]], 50, sleeve); }
    else limb(ctx, [S0, E, Hh], 44, sleeve);
    arms[side].hand = Hh;
  }
  if (arms.prop === "phone") {
    const hx = (arms.L.hand[0] + arms.R.hand[0]) / 2, hy = (arms.L.hand[1] + arms.R.hand[1]) / 2 - 26;
    ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.04);
    rr(ctx, -36, -64, 72, 118, 12, "#20232B"); rr(ctx, -28, -54, 56, 98, 6, o.glow ? "#DDF7FF" : "#3A3F4C", 0);
    ctx.restore();
  }
  if (arms.prop === "cup") { const [hx, hy] = arms.R.hand; rr(ctx, hx - 28, hy - 70, 56, 66, 10, "#F4F1EA"); ctx.fillStyle = "#B5652B"; ctx.fillRect(hx - 22, hy - 60, 44, 14); }
  for (const side of ["L", "R"]) circ(ctx, arms[side].hand[0], arms[side].hand[1], 22, st.skin);
  ctx.restore();
}

function head(ctx, t, st, mood, look, lookDown, o) {
  const fx = look * 10, hij = st.hair === "hijab";
  if (st.hair === "bun") circ(ctx, 6, -128, 44, st.hairCol);
  if (st.hair === "curly") for (let k = 0; k < 11; k++) { const a = Math.PI + (k / 10) * Math.PI; circ(ctx, Math.cos(a) * 92, -30 + Math.sin(a) * 96, 38, st.hairCol); }
  if (hij) ell(ctx, 0, -4, 112, 124, st.hijabCol);
  if (!hij) { circ(ctx, -96, 6, 22, st.skin); circ(ctx, 96, 6, 22, st.skin); }
  const fw = hij ? 80 : 96, fh = hij ? 92 : 104;
  ell(ctx, fx * 0.3, hij ? 6 : 0, fw, fh, st.skin);
  if (st.hair === "short") {
    ctx.beginPath(); ctx.moveTo(-98, 10); ctx.bezierCurveTo(-112, -80, -60, -132, 0, -128); ctx.bezierCurveTo(70, -132, 116, -80, 98, 6);
    ctx.lineTo(88, -30); ctx.lineTo(66, -44); ctx.lineTo(56, -26); ctx.lineTo(30, -52); ctx.lineTo(14, -30); ctx.lineTo(-12, -56); ctx.lineTo(-26, -32); ctx.lineTo(-52, -52); ctx.lineTo(-64, -28); ctx.lineTo(-86, -40); path(ctx, st.hairCol);
  } else if (st.hair === "curly") {
    ctx.beginPath(); ctx.moveTo(-100, 0); ctx.bezierCurveTo(-110, -90, -60, -130, 0, -126); ctx.bezierCurveTo(60, -130, 110, -90, 100, 0); ctx.quadraticCurveTo(60, -60, 0, -54); ctx.quadraticCurveTo(-60, -60, -100, 0); path(ctx, st.hairCol);
    for (let k = 0; k < 5; k++) circ(ctx, -60 + k * 30, -64 + (k % 2) * 8, 22, st.hairCol, 0);
  } else if (st.hair === "bun") {
    ctx.beginPath(); ctx.moveTo(-100, 20); ctx.bezierCurveTo(-112, -90, -50, -130, 0, -126); ctx.bezierCurveTo(60, -130, 112, -90, 100, 20); ctx.quadraticCurveTo(90, -50, 10, -64); ctx.quadraticCurveTo(-70, -60, -100, 20); path(ctx, st.hairCol);
  } else if (st.hair === "peci") {
    for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 96, -10); ctx.quadraticCurveTo(sd * 102, -60, sd * 70, -76); ctx.lineTo(sd * 84, -20); path(ctx, st.hairCol, 5); }
    ctx.beginPath(); ctx.moveTo(-86, -52); ctx.lineTo(-80, -128); ctx.quadraticCurveTo(0, -140, 80, -128); ctx.lineTo(86, -52); ctx.quadraticCurveTo(0, -66, -86, -52); path(ctx, "#1A1A1E");
  } else if (hij) {
    ctx.beginPath(); ctx.ellipse(fx * 0.3, 6, fw + 2, fh + 2, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.lineWidth = 26; ctx.strokeStyle = st.hijabCol; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(fx * 0.3, 6, fw + 16, fh + 16, 0, Math.PI * 1.02, Math.PI * 1.98); ctx.lineWidth = LW; ctx.strokeStyle = C.ink; ctx.stroke();
  }
  const ey = 22 + lookDown * 10 + (hij ? 6 : 0), px = fx * 1.2, py = lookDown * 6;
  const blink = ((t + st.skin.length * 0.37 + (o.seed || 0)) % 3.7) > 3.58;
  for (const sd of [-1, 1]) {
    const ex = sd * (hij ? 32 : 38) + fx;
    if (blink && mood !== "shock") { ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ex - 10, ey); ctx.lineTo(ex + 10, ey); ctx.stroke(); }
    else if (mood === "shock") { circ(ctx, ex, ey, 17, "#FFFFFF", 5); circ(ctx, ex + px * 0.5, ey + py, 6, C.ink, 0); }
    else if (mood === "creepy") { ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(ex, ey + 6, 12, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
    else { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.ellipse(ex + px * 0.5, ey + py, 10, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#FFFFFF"; ctx.beginPath(); ctx.arc(ex + px * 0.5 + 3, ey + py - 4, 3.5, 0, Math.PI * 2); ctx.fill(); }
    const bt = { sus: sd < 0 ? 10 : -6, shock: -14, worried: 4, stern: 6, creepy: -4 }[mood] || 0;
    const tilt = { sus: (sd < 0 ? 0.25 : -0.1) * sd, worried: -0.3 * sd, stern: 0.3 * sd }[mood] || 0;
    ctx.save(); ctx.translate(ex, ey - 30 + bt); ctx.rotate(tilt);
    ctx.strokeStyle = st.hair === "peci" ? "#BDB6AC" : C.ink; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(14, 0); ctx.stroke();
    ctx.restore();
  }
  if (st.glasses) { ctx.strokeStyle = C.ink; ctx.lineWidth = 5; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * 32 + fx, ey, 22, 0, Math.PI * 2); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-10 + fx, ey); ctx.lineTo(10 + fx, ey); ctx.stroke(); }
  if (st.wrinkles) { ctx.strokeStyle = shade(st.skin, -0.25); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-30 + fx, -34); ctx.lineTo(30 + fx, -34); ctx.moveTo(-20 + fx, -22); ctx.lineTo(20 + fx, -22); ctx.moveTo(-50 + fx, 58); ctx.quadraticCurveTo(-54 + fx, 76, -44 + fx, 86); ctx.moveTo(50 + fx, 58); ctx.quadraticCurveTo(54 + fx, 76, 44 + fx, 86); ctx.stroke(); }
  ctx.fillStyle = "rgba(226,90,80,0.22)"; ctx.beginPath(); ctx.ellipse(-56 + fx, 54, 15, 9, 0, 0, Math.PI * 2); ctx.ellipse(56 + fx, 54, 15, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = shade(st.skin, -0.2); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-4 + fx * 1.3, 40); ctx.quadraticCurveTo(6 + fx * 1.3, 50, -4 + fx * 1.3, 54); ctx.stroke();
  if (st.mustache) { ctx.beginPath(); ctx.moveTo(-34 + fx, 66); ctx.quadraticCurveTo(-18 + fx, 52, 0 + fx, 60); ctx.quadraticCurveTo(18 + fx, 52, 34 + fx, 66); ctx.quadraticCurveTo(0 + fx, 64, -34 + fx, 66); path(ctx, st.mustache, 4); }
  const mx = fx * 1.2, talking = o.talk && Math.sin(t * 19) > -0.1;
  ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath();
  if (talking && mood !== "shock") { ctx.ellipse(mx, 76, 14, 10 + 4 * Math.abs(Math.sin(t * 11)), 0, 0, Math.PI * 2); path(ctx, "#7A2A2A", 5, false); }
  else if (mood === "calm") { ctx.moveTo(-16 + mx, 70); ctx.quadraticCurveTo(mx, 82, 16 + mx, 70); ctx.stroke(); }
  else if (mood === "happy") { ctx.moveTo(-22 + mx, 68); ctx.quadraticCurveTo(mx, 94, 22 + mx, 68); path(ctx, "#7A2A2A", 6); }
  else if (mood === "creepy") { ctx.moveTo(-34 + mx, 66); ctx.quadraticCurveTo(mx, 96, 34 + mx, 66); ctx.quadraticCurveTo(mx, 80, -34 + mx, 66); path(ctx, "#F4F1EA", 5); }
  else if (mood === "sus" || mood === "stern") { ctx.moveTo(-18 + mx, 76); ctx.lineTo(16 + mx, 74); ctx.stroke(); }
  else if (mood === "shock") { ctx.ellipse(mx, 78, 12, 17, 0, 0, Math.PI * 2); path(ctx, "#7A2A2A", 6, false); }
  else { ctx.moveTo(-18 + mx, 76); ctx.quadraticCurveTo(-9 + mx, 68, mx, 76); ctx.quadraticCurveTo(9 + mx, 84, 18 + mx, 76); ctx.stroke(); }
  if (mood === "worried" || mood === "shock") { ctx.beginPath(); ctx.moveTo(84, -40); ctx.quadraticCurveTo(100, -12, 90, -2); ctx.quadraticCurveTo(74, 4, 76, -16); ctx.closePath(); path(ctx, "#8FD3F5", 4); }
  if (o.glow) { ctx.save(); ctx.globalAlpha = 0.25; const g = ctx.createRadialGradient(0, 110, 10, 0, 60, 150); g.addColorStop(0, "#CFEFFF"); g.addColorStop(1, "rgba(207,239,255,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, fw, fh, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
}

/* ---------------- set ---------------- */
function sky(ctx, top, bot, y0 = 0, y1 = 1200) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(-600, -600, W + 1200, y1 + 600); }
function palms(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col;
  for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.42; ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, -90, 18, 100, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  ctx.restore();
}
function stars(ctx, n, seed, y1 = 560) { for (let i = 0; i < n; i++) { ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fillRect(rnd(i, seed) * W, 60 + rnd(i, seed + 1) * y1, 3, 3); } }
function ground(ctx, y, col) { rr(ctx, -600, y, W + 1200, H - y + 600, 0, col); }

function sungaiSet(ctx, t, inner) {
  sky(ctx, "#3B2A5C", "#F08A4B", 0, 1050);
  circ(ctx, 760, 900, 110, "#FFD36B", 0);
  ctx.fillStyle = "rgba(255,211,107,0.25)"; ctx.beginPath(); ctx.arc(760, 900, 170, 0, Math.PI * 2); ctx.fill();
  for (const [cx, cy, w] of [[200, 640, 260], [820, 700, 200], [520, 560, 180]]) { ctx.fillStyle = "rgba(255,190,150,0.55)"; ctx.beginPath(); ctx.ellipse(cx, cy, w, 26, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = "#2A2140"; ctx.beginPath(); ctx.moveTo(-600, 1080);
  for (let k = -10; k <= 32; k++) ctx.lineTo(-40 + k * 54, 960 - 50 * rnd(k + 20, 61) - 20 * Math.sin(k)); ctx.lineTo(W + 600, 1080); ctx.fill();
  palms(ctx, 80, 1010, 0.9, "#22193A"); palms(ctx, 990, 1000, 1.1, "#22193A"); palms(ctx, 330, 1020, 0.6, "#2A2140");
  const wg = ctx.createLinearGradient(0, 1060, 0, H); wg.addColorStop(0, "#C9714A"); wg.addColorStop(0.4, "#6C3F5E"); wg.addColorStop(1, "#2C2444");
  ctx.fillStyle = wg; ctx.fillRect(-600, 1060, W + 1200, H);
  ctx.fillStyle = "rgba(255,211,107,0.55)"; for (let k = 0; k < 12; k++) { const yy = 1080 + k * 26, ww = 140 - k * 8 + 20 * Math.sin(t * 2 + k); ctx.fillRect(760 - ww / 2 + 10 * Math.sin(t * 3 + k), yy, ww, 6); }
  const bob = Math.sin(t * 2.2) * 8, rock = Math.sin(t * 1.7) * 0.012;
  ctx.save(); ctx.translate(540, 1420 + bob); ctx.rotate(rock); ctx.translate(-540, -1420);
  rr(ctx, 170, 830, 740, 40, 10, "#8C3B2E"); for (const px of [210, 860]) rr(ctx, px, 860, 16, 420, 4, "#5E3826");
  inner();
  ctx.beginPath(); ctx.moveTo(40, 1330); ctx.lineTo(1040, 1330); ctx.quadraticCurveTo(1010, 1470, 900, 1490); ctx.lineTo(180, 1490); ctx.quadraticCurveTo(70, 1470, 40, 1330); path(ctx, "#2F6FA0");
  rr(ctx, 40, 1320, 1000, 30, 10, "#F2C14E");
  ctx.restore();
}

function poskoSet(ctx) {
  sky(ctx, "#2E2A55", "#C76E6E", 0, 1100); stars(ctx, 14, 71);
  ctx.fillStyle = "#231F40"; for (const [x, y, r] of [[60, 860, 150], [980, 820, 170], [880, 900, 120], [200, 930, 110]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
  ground(ctx, 1260, "#6E5238");
  for (const x of [230, 420, 660, 850]) rr(ctx, x, 1080, 30, 210, 4, "#4A3020");
  rr(ctx, 190, 760, 700, 330, 6, "#8A5A3B");
  ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = 4; for (let y = 790; y < 1090; y += 34) { ctx.beginPath(); ctx.moveTo(194, y); ctx.lineTo(886, y); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(140, 780); ctx.lineTo(540, 560); ctx.lineTo(940, 780); path(ctx, "#5B3A3A");
  for (const x of [240, 700]) { rr(ctx, x, 830, 140, 150, 6, "#5E3826"); ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + 70, 834); ctx.lineTo(x + 70, 976); ctx.stroke(); }
  rr(ctx, 470, 820, 140, 270, 6, "#FFD98A");
  ctx.fillStyle = "rgba(255,217,138,0.25)"; ctx.beginPath(); ctx.moveTo(470, 1090); ctx.lineTo(610, 1090); ctx.lineTo(680, 1300); ctx.lineTo(400, 1300); ctx.fill();
  for (let k = 0; k < 5; k++) rr(ctx, 470 - k * 6, 1100 + k * 40, 140 + k * 12, 16, 4, "#6B4A33", 5);
}

function warungSet(ctx) {
  sky(ctx, "#3A2E5A", "#D9805E", 0, 900);
  rr(ctx, -600, 560, W + 1200, 1400, 0, "#7A5236", 0);
  ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 4; for (let x = -400; x < W + 400; x += 80) { ctx.beginPath(); ctx.moveTo(x, 560); ctx.lineTo(x, 1500); ctx.stroke(); }
  rr(ctx, 60, 640, 960, 24, 4, "#4A3020"); rr(ctx, 60, 820, 960, 24, 4, "#4A3020");
  for (let k = 0; k < 9; k++) { const x = 100 + k * 102; rr(ctx, x, 690, 70, 130, 12, "rgba(220,240,255,0.55)", 5); rr(ctx, x - 4, 680, 78, 18, 6, ["#E23B3B", "#2F6FA0", "#F2C14E"][k % 3], 4); ctx.fillStyle = ["#F2C14E", "#C8643B", "#7FB069", "#E8A0B4"][k % 4]; ctx.fillRect(x + 6, 740, 58, 72); }
  ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(540, 540); ctx.lineTo(540, 590); ctx.stroke(); circ(ctx, 540, 604, 18, "#FFE38A", 4);
  ctx.save(); ctx.globalAlpha = 0.15; const lg = ctx.createRadialGradient(540, 620, 10, 540, 900, 700); lg.addColorStop(0, "#FFE9A8"); lg.addColorStop(1, "rgba(255,233,168,0)"); ctx.fillStyle = lg; ctx.fillRect(0, 540, W, 1200); ctx.restore();
  ground(ctx, 1500, "#4A3424");
}
function warungCounter(ctx) {
  rr(ctx, 40, 1180, 640, 330, 8, "#9C6B45");
  ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = 4; for (let x = 60; x < 680; x += 60) { ctx.beginPath(); ctx.moveTo(x, 1190); ctx.lineTo(x, 1500); ctx.stroke(); }
  rr(ctx, 20, 1160, 680, 36, 8, "#6B4A33");
  for (const x of [470, 560]) { rr(ctx, x, 1092, 50, 70, 8, "rgba(255,255,255,0.6)", 4); ctx.fillStyle = "#B5652B"; ctx.fillRect(x + 5, 1110, 40, 48); }
}

const flick = (t) => 0.85 + 0.1 * Math.sin(t * 13) + 0.05 * Math.sin(t * 31 + 1.3);
const WIN = { x: 70, y: 600, w: 420, h: 480 };
function redLight(ctx, t, near, cx = WIN.x + 120, cy = WIN.y + 230) {
  const bob = Math.sin(t * 3) * 8;
  const lx = cx + (near ? 110 : t * 18), ly = cy + (near ? 20 : 0) + bob, r = near ? 90 : 16;
  const gl = ctx.createRadialGradient(lx, ly, 2, lx, ly, r * 3.2);
  gl.addColorStop(0, "rgba(255,90,60,0.95)"); gl.addColorStop(0.35, "rgba(220,30,30,0.45)"); gl.addColorStop(1, "rgba(180,0,0,0)");
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(lx, ly, r * 3.2, 0, Math.PI * 2); ctx.fill();
}
function outside(ctx, t, ev) {
  const { x, y, w, h } = WIN;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, "#0B1222"); g.addColorStop(1, "#16243A");
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "rgba(246,239,200,0.85)"; ctx.beginPath(); ctx.arc(x + 330, y + 90, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#0B1222"; ctx.beginPath(); ctx.arc(x + 344, y + 82, 28, 0, Math.PI * 2); ctx.fill();
  const layer = (base, col, n, amp, seed) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y + h); for (let k = 0; k <= n; k++) ctx.lineTo(x + (k / n) * w, y + base - amp * (0.4 + rnd(k, seed))); ctx.lineTo(x + w, y + h); ctx.fill(); };
  layer(300, "#14223A", 9, 120, 21);
  if (ev === "lampu-merah") redLight(ctx, t, false);
  layer(380, "#0E1828", 7, 110, 31);
  layer(470, "#09111E", 6, 80, 41);
  ctx.restore();
}
function eyesFigure(ctx, t, cx, cy, s = 1, clipRect = null) {
  const k = ease.outCubic(clamp((t - 0.3) / 0.25));
  ctx.save();
  if (clipRect) { ctx.beginPath(); ctx.rect(...clipRect); ctx.clip(); }
  const gl = ctx.createRadialGradient(cx, cy + 120 * s, 10, cx, cy + 60 * s, 320 * s); gl.addColorStop(0, "rgba(255,60,40,0.9)"); gl.addColorStop(1, "rgba(120,0,0,0)");
  ctx.globalAlpha = k; ctx.fillStyle = gl; ctx.fillRect(cx - 400 * s, cy - 400 * s, 800 * s, 900 * s);
  ctx.fillStyle = "#050608";
  ctx.beginPath(); ctx.ellipse(cx, cy, 120 * s, 140 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - 130 * s, cy - 60 * s); ctx.quadraticCurveTo(cx - 190 * s, cy + 160 * s, cx - 150 * s + Math.sin(t * 4) * 10, cy + 520 * s); ctx.lineTo(cx + 150 * s + Math.sin(t * 4 + 1) * 10, cy + 520 * s); ctx.quadraticCurveTo(cx + 190 * s, cy + 160 * s, cx + 130 * s, cy - 60 * s); ctx.fill();
  const blink = (t % 2.2) > 2.05 ? 0.2 : 1;
  for (const sd of [-1, 1]) {
    const ex = cx + sd * 45 * s, ey = cy - 10 * s;
    const eg = ctx.createRadialGradient(ex, ey, 1, ex, ey, 40 * s); eg.addColorStop(0, "rgba(255,80,60,0.9)"); eg.addColorStop(1, "rgba(255,0,0,0)");
    ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(ex, ey, 40 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#FFE1D6"; ctx.beginPath(); ctx.ellipse(ex, ey, 16 * s, 10 * s * blink, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#C20000"; ctx.beginPath(); ctx.arc(ex, ey, 5 * s * blink, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
function kamarSet(ctx, t, ev) {
  ctx.fillStyle = "#5A3B28"; ctx.fillRect(-600, -600, W + 1200, H + 1200);
  for (let i = -8; i < 20; i++) { ctx.fillStyle = i % 2 ? "#62412C" : "#563826"; ctx.fillRect(i * 90, 300, 90, 1300); ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(i * 90, 300, 4, 1300); }
  rr(ctx, -600, 540, W + 1200, 54, 0, "#3E2819");
  outside(ctx, t, ev);
  const open = ev === "mata-merah" || ev === "lampu-merah";
  if (ev === "mata-merah") eyesFigure(ctx, t, WIN.x + WIN.w / 2 + 20, WIN.y + WIN.h * 0.55 + Math.sin(t * 2.2) * 6, 1, [WIN.x, WIN.y, WIN.w, WIN.h]);
  const { x, y, w, h } = WIN;
  const shutter = open ? 0 : 1;
  for (const sd of [-1, 1]) {
    const sw = w / 2, hinge = sd < 0 ? x : x + w, wNow = sw * (0.12 + 0.88 * shutter), sx = sd < 0 ? hinge : hinge - wNow;
    rr(ctx, sx, y, wNow, h, 4, "#6B4630");
    ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 4; for (let k = 1; k < 8; k++) { ctx.beginPath(); ctx.moveTo(sx + 6, y + k * 60); ctx.lineTo(sx + wNow - 6, y + k * 60); ctx.stroke(); }
  }
  rr(ctx, x - 16, y - 16, w + 32, h + 32, 6, null, 14, "#2E1E13");
  rr(ctx, x - 16, y + h + 10, w + 32, 26, 6, "#3E2819");
  rr(ctx, 640, 640, 300, 200, 6, "#7A1F1F");
  ctx.strokeStyle = "#E8C36A"; ctx.lineWidth = 6;
  for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(660, 690 + k * 50); for (let j = 0; j < 6; j++) ctx.lineTo(680 + j * 44, 690 + k * 50 + (j % 2 ? -18 : 18)); ctx.stroke(); }
  ground(ctx, 1500, "#3E2819");
  ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 4; for (let k = -6; k <= 6; k++) { ctx.beginPath(); ctx.moveTo(540 + k * 120, 1504); ctx.lineTo(540 + k * 300, H); ctx.stroke(); }
  pelita(ctx, t, ev !== "lampu-mati");
}
function pelita(ctx, t, lit) {
  const x = 960, y = 1270;
  rr(ctx, x - 50, y + 60, 100, 22, 6, "#5E3826"); rr(ctx, x - 40, y + 82, 16, 150, 4, "#5E3826"); rr(ctx, x + 24, y + 82, 16, 150, 4, "#5E3826");
  ctx.beginPath(); ctx.moveTo(x - 34, y + 60); ctx.quadraticCurveTo(x - 40, y + 10, x, y + 6); ctx.quadraticCurveTo(x + 40, y + 10, x + 34, y + 60); path(ctx, "#8C8F96");
  if (lit) {
    const f = flick(t);
    ctx.beginPath(); ctx.moveTo(x, y - 60 * f); ctx.quadraticCurveTo(x + 18, y - 20, x, y - 6); ctx.quadraticCurveTo(x - 18, y - 20, x, y - 60 * f); ctx.closePath(); ctx.fillStyle = "#FFB547"; ctx.fill();
  } else {
    ctx.strokeStyle = `rgba(200,200,200,${0.5 * clamp(1 - t / 2)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y - 10);
    for (let k = 1; k < 8; k++) ctx.lineTo(x + Math.sin(t * 4 + k) * 10, y - 10 - k * 14 - t * 30); ctx.stroke();
  }
}
function nightLight(ctx, t, lit, red) {
  ctx.save(); ctx.globalCompositeOperation = "multiply";
  if (lit) {
    const f = flick(t);
    const g = ctx.createRadialGradient(960, 1230, 40, 820, 1150, 1000);
    g.addColorStop(0, "#FFFFFF"); g.addColorStop(0.5, `rgba(${Math.round(240 * f)},${Math.round(215 * f)},185,1)`); g.addColorStop(1, "#5A5470");
    ctx.fillStyle = g; ctx.fillRect(-600, -600, W + 1200, H + 1200);
  } else {
    const g = ctx.createRadialGradient(WIN.x + WIN.w / 2, WIN.y + WIN.h * 0.6, 60, WIN.x + WIN.w / 2, WIN.y + WIN.h * 0.6, 1100);
    g.addColorStop(0, red ? "#FF8A80" : "#8A96B8"); g.addColorStop(0.5, red ? "#4A1A28" : "#2A2A40"); g.addColorStop(1, "#0C0A14");
    ctx.fillStyle = g; ctx.fillRect(-600, -600, W + 1200, H + 1200);
  }
  ctx.restore();
}

function jalanSet(ctx, t, ev) {
  sky(ctx, "#0B1222", "#26304F", 0, 1150); stars(ctx, 22, 81);
  ctx.fillStyle = "rgba(246,239,200,0.9)"; ctx.beginPath(); ctx.arc(820, 300, 60, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#111A2E"; for (let i = 0; i < 9; i++) { const x = -200 + i * 170, r = 110 + rnd(i, 5) * 80; ctx.beginPath(); ctx.arc(x, 1050 - rnd(i, 6) * 120, r, 0, Math.PI * 2); ctx.fill(); }
  ground(ctx, 1120, "#2A2B33");
  ctx.fillStyle = "#3A3B45"; ctx.beginPath(); ctx.moveTo(380, 1120); ctx.lineTo(700, 1120); ctx.lineTo(1300, H + 600); ctx.lineTo(-300, H + 600); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 10; ctx.setLineDash([60, 70]); ctx.beginPath(); ctx.moveTo(540, 1130); ctx.lineTo(540, H + 400); ctx.stroke(); ctx.setLineDash([]);
  // tiang lampu berkedip
  const on = ev === "lampu-mati" ? (t < 0.6 ? (Math.sin(t * 60) > 0 ? 1 : 0.2) : 0) : 0.85 + 0.15 * Math.sin(t * 17);
  rr(ctx, 860, 640, 22, 520, 4, "#1C1F28"); rr(ctx, 790, 630, 120, 22, 8, "#1C1F28");
  ctx.save(); ctx.globalAlpha = 0.5 * on; const lg = ctx.createRadialGradient(800, 660, 5, 800, 1100, 520); lg.addColorStop(0, "#FFE9A8"); lg.addColorStop(1, "rgba(255,233,168,0)"); ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(800, 650); ctx.lineTo(560, 1500); ctx.lineTo(1080, 1500); ctx.fill(); ctx.restore();
  circ(ctx, 800, 660, 16, on > 0.5 ? "#FFE38A" : "#555", 4);
  if (ev === "lampu-merah") redLight(ctx, t, false, 180, 820);
  if (ev === "mata-merah") eyesFigure(ctx, t, 220, 900, 0.6);
}
function rumahTuaSet(ctx, t, ev) {
  sky(ctx, "#0E1426", "#3A3A5E", 0, 1150); stars(ctx, 26, 91);
  ctx.fillStyle = "rgba(246,239,200,0.95)"; ctx.beginPath(); ctx.arc(300, 330, 110, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(246,239,200,0.15)"; ctx.beginPath(); ctx.arc(300, 330, 190, 0, Math.PI * 2); ctx.fill();
  ground(ctx, 1240, "#2B2A28");
  // rumah
  rr(ctx, 200, 720, 680, 520, 4, "#4A4038");
  ctx.beginPath(); ctx.moveTo(150, 740); ctx.lineTo(540, 480); ctx.lineTo(930, 740); path(ctx, "#2E2622");
  for (const x of [260, 680]) { rr(ctx, x, 820, 140, 170, 4, ev === "mata-merah" && x === 680 ? "#3A0B0B" : "#14141A"); ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, 905); ctx.lineTo(x + 140, 905); ctx.moveTo(x + 70, 820); ctx.lineTo(x + 70, 990); ctx.stroke(); }
  if (ev === "mata-merah") eyesFigure(ctx, t, 750, 900, 0.32, [680, 820, 140, 170]);
  rr(ctx, 470, 940, 140, 300, 4, "#1A1414");
  ctx.strokeStyle = "#5A4A3A"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(240, 760); ctx.lineTo(320, 830); ctx.stroke();
  // pagar rusak
  for (let i = 0; i < 12; i++) { const x = -80 + i * 110, tilt = (rnd(i, 3) - 0.5) * 0.3; ctx.save(); ctx.translate(x, 1360); ctx.rotate(tilt); rr(ctx, -12, -150, 24, 170, 4, "#3E3328"); ctx.restore(); }
  rr(ctx, -200, 1260, W + 400, 18, 4, "#3E3328");
  if (ev === "lampu-merah") redLight(ctx, t, false, 700, 560);
}
function hutanSet(ctx, t, ev) {
  sky(ctx, "#08110F", "#1C2B28", 0, 1300);
  for (let layer = 0; layer < 3; layer++) {
    const col = ["#14221F", "#0F1A18", "#0A1211"][layer];
    for (let i = 0; i < 8; i++) { const x = -260 + i * 220 + layer * 70, w = 60 + layer * 24; rr(ctx, x, 200 - layer * 60, w, 1400, 10, col, 0); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + w / 2, 260 - layer * 60, 200 + layer * 30, 0, Math.PI * 2); ctx.fill(); }
    if (layer === 0 && ev === "mata-merah") eyesFigure(ctx, t, 820, 980, 0.5);
    if (layer === 0 && ev === "lampu-merah") redLight(ctx, t, false, 760, 700);
  }
  ground(ctx, 1450, "#18201C");
  ctx.strokeStyle = "#0A0F0D"; ctx.lineWidth = 30; ctx.lineCap = "round"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-100 + i * 380, 1450); ctx.quadraticCurveTo(80 + i * 380, 1380, 200 + i * 380, 1470); ctx.stroke(); }
  ctx.fillStyle = "rgba(170,200,190,0.12)"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(((t * 30 + i * 340) % (W + 600)) - 300, 1300 + i * 60, 360, 46, 0, 0, Math.PI * 2); ctx.fill(); }
}

/* ---------------- posisi tokoh ---------------- */
const FLOOR = { kamar: 1470, posko: 1460, warung: 1460, jalan: 1480, "rumah-tua": 1430, hutan: 1440 };
function drawCast(ctx, t, inp, sitting) {
  const cast = inp.anim.cast || [];
  const n = cast.length;
  cast.forEach((c, i) => {
    const look = inp.looks[c.who] || LOOK_PRESETS[c.who] || LOOK_PRESETS["pemuda"];
    const [poseKind, arms] = POSE[c.pose] || POSE.berdiri;
    const set = inp.anim.set;
    if (c.pose === "tidur") return sleeper(ctx, t, look, n === 1 ? 420 : 260 + i * 300);
    let x, y, s;
    if (sitting) { x = n === 1 ? 540 : lerp(300, 780, n === 1 ? 0.5 : i / (n - 1)); y = 1300; s = 0.78; }
    else {
      const span = n === 1 ? [600, 600] : n === 2 ? [380, 760] : [250, 870];
      x = n === 1 ? (set === "kamar" ? 680 : 560) : lerp(span[0], span[1], i / (n - 1));
      y = FLOOR[set] || 1460; s = n >= 3 ? 0.74 : 0.84;
      y -= 256 * s;
    }
    const mood = MOOD[c.mood] || "calm";
    const ev = inp.anim.event;
    const scared = c.pose === "peluk" || mood === "shock" ? 1 : 0;
    person(ctx, x, y, s, t, look, {
      pose: sitting ? "sit" : poseKind, arms: sitting && arms === "down" ? "hug" : arms, mood, talk: c.talk, glow: c.pose === "hp" ? 1 : 0,
      look: n === 1 ? (set === "kamar" ? -0.8 : 0) : x < 540 ? 0.6 : -0.6, shake: scared, bag: c.pose === "ransel" ? ["#E07A2F", "#2F6FA0", "#3B4252"][i % 3] : null, seed: i,
      bob: ev === "ketukan" && t > 0.35 ? -Math.max(0, Math.sin(clamp((t - 0.35) / 0.25) * Math.PI)) * 18 : 0,
    });
  });
}
function sleeper(ctx, t, look, x) {
  const br = Math.sin(t * 1.6) * 4;
  ctx.beginPath(); ctx.ellipse(x - 220, 1620 - br, 200, 64 + br, 0, Math.PI, 0); path(ctx, "#3C6E5A");
  rr(ctx, x - 70, 1560, 130, 60, 26, "#E8E2D6");
  ell(ctx, x, 1560, 44, 32, look.hair === "hijab" ? look.hijabCol : look.hairCol, 5);
  txt(ctx, "z", x + 70, 1500 - ((t * 30) % 40), 34, "rgba(255,255,255,0.6)", { weight: 800 });
}
function tint(ctx, col, a) { ctx.save(); ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(-600, -600, W + 1200, H + 1200); ctx.restore(); }

/* ---------------- overlay ---------------- */
function topBand(ctx) { const g = ctx.createLinearGradient(0, 0, 0, 620); g.addColorStop(0, "rgba(8,10,18,0.8)"); g.addColorStop(1, "rgba(8,10,18,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 620); }
function overlay(ctx, t, inp) {
  const top = 250;
  const parts = (inp.anim.stamp || "").split("|").map((s) => s.trim());
  if (inp.anim.set !== "kartu" && parts[0]) {
    txt(ctx, parts[0] || "", 70, top, 26, C.white, { weight: 800 });
    if (parts[1]) outlined(ctx, parts[1], 70, top + 62, 66, C.white, { align: "left", sw: 0.12 });
    if (parts[2]) txt(ctx, parts[2], 70, top + 94, 24, "rgba(255,255,255,0.85)", { weight: 600 });
  }
  if (inp.episode) { rr(ctx, W - 240, top - 34, 170, 54, 10, C.red, 0); txt(ctx, inp.episode.toUpperCase(), W - 155, top + 4, 30, C.white, { weight: 800, align: "center", maxW: 150 }); }
  const [a, b] = twoLines(inp.screenText);
  if (inp.title) outlined(ctx, inp.title.toUpperCase(), 540, top + 210, 84, C.white, { maxW: 950 });
  const sub = [a, b].filter(Boolean).join(" ");
  if (sub) {
    const k = inp.index === 0 ? 1 : pop(t, 0.05, 0.3, 2);
    ctx.save(); ctx.translate(540, top + 302); ctx.scale(k, k); outlined(ctx, sub.toUpperCase(), 0, 0, 74, C.yellow, { maxW: 950 }); ctx.restore();
  }
}
function toks(ctx, t) {
  for (const [tt, x, y, r] of [[0.35, 330, 760, -0.15], [1.05, 420, 930, 0.12]]) {
    if (t < tt || t > tt + 1.6) continue;
    const p = pop(t, tt, 0.15, 3);
    ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(p, p); outlined(ctx, "TOK!", 0, 0, 110, "#FF4A3D", { sw: 0.14 }); ctx.restore();
  }
}
function voteBox(ctx, t, vote) {
  const t0 = 0.6;
  if (t < t0) return;
  ctx.fillStyle = `rgba(10,15,25,${0.55 * clamp((t - t0) / 0.2)})`; ctx.fillRect(0, 0, W, H);
  const p = ease.outBack(clamp((t - t0) / 0.3), 1.8);
  const n = vote.options.length;
  ctx.save(); ctx.translate(540, 900); ctx.scale(p, p);
  rr(ctx, -430, -230, 860, 200 + n * 140, 32, "#16233A", 6, C.lime);
  outlined(ctx, vote.title.toUpperCase(), 0, -140, 60, C.lime, { sw: 0, maxW: 780 });
  vote.options.forEach((o, i) => {
    const q = pop(t, t0 + 0.3 + i * 0.25, 0.28, 2.2);
    if (q <= 0) return;
    ctx.save(); ctx.translate(0, -40 + i * 140); ctx.scale(q, q);
    rr(ctx, -380, -54, 760, 108, 22, "#22324F", 3, "rgba(255,255,255,0.3)");
    circ(ctx, -318, 0, 36, i === 0 ? C.yellow : C.lime, 0);
    txt(ctx, String(i + 1), -318, 15, 42, C.navy, { weight: 800, align: "center" });
    txt(ctx, o, -260, 14, 40, "#FFFFFF", { weight: 700, maxW: 610 });
    ctx.restore();
  });
  ctx.restore();
}

/** Gambar satu frame scene horor kartun. */
export function drawHoror(ctx, inp: AnimInput) {
  const { t, dur, anim } = inp;
  const ev = anim.event;
  ctx.fillStyle = "#07080C"; ctx.fillRect(0, 0, W, H);
  if (anim.set === "kartu") {
    const [a, b] = twoLines(inp.screenText);
    const full = [a, b].filter(Boolean).join(" ") + "…";
    const n = Math.floor(clamp(t / 0.9) * full.length);
    outlined(ctx, full.slice(0, n), 540, 1040, 96, "#F4F1EA", { sw: 0, maxW: 940 });
    return;
  }
  const base = anim.set === "kamar" ? { fx: 520, fy: 1060, cy: 1060 } : { fx: 540, fy: 1100, cy: 1100 };
  const cam = camFor(ev === "ketukan" ? "guncang" : anim.camera, t, dur, base);
  withCam(ctx, cam, () => {
    if (anim.set === "sungai") sungaiSet(ctx, t, () => drawCast(ctx, t, inp, true));
    else {
      if (anim.set === "kamar") kamarSet(ctx, t, ev);
      else if (anim.set === "posko") poskoSet(ctx);
      else if (anim.set === "warung") warungSet(ctx);
      else if (anim.set === "jalan") jalanSet(ctx, t, ev);
      else if (anim.set === "rumah-tua") rumahTuaSet(ctx, t, ev);
      else hutanSet(ctx, t, ev);
      if (ev === "lampu-merah" && anim.set === "posko") redLight(ctx, t, false, 880, 500);
      if (ev === "mata-merah" && (anim.set === "posko" || anim.set === "warung")) eyesFigure(ctx, t, 960, 700, 0.45);
      drawCast(ctx, t, inp, false);
      if (anim.set === "warung") warungCounter(ctx);
    }
    if (anim.set === "kamar") nightLight(ctx, t, ev !== "lampu-mati" && ev !== "mata-merah", ev === "mata-merah");
    else if (ev === "lampu-mati") tint(ctx, "#1A1A30", clamp((t - 0.4) / 0.3) * 0.75);
    if (anim.set === "posko" || anim.set === "warung") tint(ctx, "#C9A0B8", 0.2);
  });
  if (ev === "bayangan") { const u = clamp((t - 0.4) / 0.5); if (u > 0 && u < 1) { ctx.fillStyle = "rgba(5,5,8,0.92)"; const x = lerp(-500, W + 500, ease.inOutQuad(u)); ctx.beginPath(); ctx.ellipse(x, 1000, 260, 900, 0.1, 0, Math.PI * 2); ctx.fill(); } }
  if (ev === "mata-merah" && t >= 0.3 && t < 0.62) { ctx.fillStyle = `rgba(255,40,40,${0.35 * (1 - (t - 0.3) / 0.32)})`; ctx.fillRect(0, 0, W, H); }
  topBand(ctx);
  overlay(ctx, t, inp);
  if (ev === "ketukan") toks(ctx, t);
  if (inp.vote) voteBox(ctx, t, inp.vote);
}
