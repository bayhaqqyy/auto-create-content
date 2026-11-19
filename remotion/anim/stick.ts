// @ts-nocheck — stickman ekspresif: rig bersendi, ekspresi besar, properti, kamera hidup.
import { W, H, clamp, lerp, ease, hash, pop, outlined, withCam, camFor, shakeAt, twoLines } from "./kit";
import type { AnimInput } from "./types";

const INK = "#141414", RED = "#E5484D";
const rad = (d) => (d * Math.PI) / 180;

const POSES = {
  stand: { la: [-12, -8], ra: [12, 8], ll: [-8, -4], rl: [8, 4], lean: 0 },
  phone: { la: [-12, -8], ra: [25, 125], ll: [-8, -4], rl: [8, 4], lean: 0.05 },
  trip: { la: [125, 150], ra: [105, 135], ll: [-35, -15], rl: [55, 95], lean: 0.55 },
  shock: { la: [-140, -165], ra: [140, 165], ll: [-20, -12], rl: [20, 12], lean: -0.08 },
  think: { la: [-12, -8], ra: [35, 170], ll: [-8, -4], rl: [8, 4], lean: 0 },
  facepalm: { la: [-15, -10], ra: [130, 215], ll: [-10, -4], rl: [10, 4], lean: 0.15 },
  point: { la: [-15, -10], ra: [-95, -92], ll: [-10, -4], rl: [12, 6], lean: -0.05 },
  hold: { la: [-30, 60], ra: [30, -60], ll: [-10, -4], rl: [10, 4], lean: 0 },
  thumbs: { la: [-15, -10], ra: [55, 170], ll: [-10, -4], rl: [10, 4], lean: -0.05 },
  cheer: { la: [-140, -160], ra: [140, 160], ll: [-14, -6], rl: [14, 6], lean: 0 },
};
const walkPose = (ph, amp = 1, run = false) => {
  const a = Math.sin(ph) * 28 * amp, k = Math.max(0, Math.sin(ph)) * (run ? 60 : 30);
  return { la: [-a * 1.1, -a * 1.1 + (run ? 70 : 10)], ra: [a * 1.1, a * 1.1 + (run ? 70 : 10)], ll: [a, a - Math.max(0, -Math.sin(ph)) * (run ? 60 : 30)], rl: [-a, -a - k], lean: run ? 0.25 : 0.04 };
};
const mix = (A, B, k) => { const o = { lean: lerp(A.lean, B.lean, k) }; for (const key of ["la", "ra", "ll", "rl"]) o[key] = [lerp(A[key][0], B[key][0], k), lerp(A[key][1], B[key][1], k)]; return o; };

const POSE_OF = { berdiri: "stand", hp: "phone", kaget: "shock", tersandung: "trip", mikir: "think", "tepok-jidat": "facepalm", tunjuk: "point", pegang: "hold", jempol: "thumbs", sorak: "cheer" };
const FACE_OF = {
  senang: { eyes: "normal", mouth: "smile" },
  bangga: { eyes: "happy", mouth: "grin", blush: 1 },
  kaget: { eyes: "wide", mouth: "o", look: [0, -0.3] },
  panik: { eyes: "wide", mouth: "open", sweat: 1, brows: "worried" },
  bingung: { eyes: "squint", mouth: "wavy", look: [0.3, 0.3] },
  sedih: { eyes: "normal", mouth: "frown", brows: "worried", look: [0, 0.5] },
  marah: { eyes: "normal", mouth: "frown", brows: "angry" },
  datar: { eyes: "normal", mouth: "flat" },
  pingsan: { eyes: "x", mouth: "wavy" },
};

function limb(ctx, p, a1, a2, l1, l2) {
  const e = [p[0] + Math.sin(rad(a1)) * l1, p[1] + Math.cos(rad(a1)) * l1];
  const h = [e[0] + Math.sin(rad(a2)) * l2, e[1] + Math.cos(rad(a2)) * l2];
  ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(e[0], e[1]); ctx.lineTo(h[0], h[1]); ctx.stroke();
  return h;
}
function stick(ctx, { x, y, s = 1, pose, face = {}, prop, flip = 1, t = 0, squash = 0, color = "#FFFFFF" }) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * flip * (1 + squash * 0.12), s * (1 - squash * 0.12));
  ctx.strokeStyle = INK; ctx.lineWidth = 15; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.fillStyle = "rgba(0,0,0,0.14)"; ctx.beginPath(); ctx.ellipse(0, 8, 90, 16, 0, 0, 7); ctx.fill();
  const hip = [0, -185], neck = [0, -335], head = [0, -412];
  limb(ctx, hip, pose.ll[0], pose.ll[1], 96, 92);
  limb(ctx, hip, pose.rl[0], pose.rl[1], 96, 92);
  ctx.save(); ctx.translate(hip[0], hip[1]); ctx.rotate(pose.lean * 0.6); ctx.translate(-hip[0], -hip[1]);
  ctx.beginPath(); ctx.moveTo(hip[0], hip[1]); ctx.lineTo(neck[0], neck[1]); ctx.stroke();
  const sh = [0, -318];
  limb(ctx, sh, pose.la[0], pose.la[1], 92, 88);
  const hand = limb(ctx, sh, pose.ra[0], pose.ra[1], 92, 88);
  if (prop) prop(ctx, hand);
  ctx.fillStyle = color; ctx.lineWidth = 13;
  ctx.beginPath(); ctx.arc(head[0], head[1], 72, 0, 7); ctx.fill(); ctx.stroke();
  const [lx, ly] = face.look || [0, 0];
  const ex = head[0] + lx * 14, ey = head[1] - 12 + ly * 12;
  const eyes = face.eyes || "normal";
  ctx.fillStyle = INK; ctx.lineWidth = 8;
  const blink = eyes === "normal" && ((t + x * 0.001) % 3.3) > 3.18;
  for (const d of [-26, 26]) {
    const cx = ex + d;
    if (blink) { ctx.beginPath(); ctx.moveTo(cx - 10, ey); ctx.lineTo(cx + 10, ey); ctx.stroke(); }
    else if (eyes === "wide") { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, ey, 21, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx + lx * 6, ey + ly * 6, 8, 0, 7); ctx.fill(); }
    else if (eyes === "happy") { ctx.beginPath(); ctx.arc(cx, ey + 6, 13, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    else if (eyes === "x") { ctx.beginPath(); ctx.moveTo(cx - 11, ey - 11); ctx.lineTo(cx + 11, ey + 11); ctx.moveTo(cx + 11, ey - 11); ctx.lineTo(cx - 11, ey + 11); ctx.stroke(); }
    else if (eyes === "squint") { ctx.beginPath(); ctx.moveTo(cx - 13, ey); ctx.lineTo(cx + 13, ey); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(cx, ey, 9, 0, 7); ctx.fill(); }
  }
  if (face.brows) { ctx.lineWidth = 7; for (const d of [-1, 1]) { const cx = ex + d * 26; const tilt = face.brows === "angry" ? 8 : -8; ctx.beginPath(); ctx.moveTo(cx - 15, ey - 30 + d * tilt); ctx.lineTo(cx + 15, ey - 30 - d * tilt); ctx.stroke(); } }
  const mx = head[0] + lx * 10, my = head[1] + 30;
  const mouth = face.talk && Math.sin(t * 18) > 0 ? "open" : face.mouth || "smile";
  ctx.lineWidth = 8;
  if (mouth === "smile") { ctx.beginPath(); ctx.arc(mx, my - 12, 22, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
  else if (mouth === "grin") { ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(mx - 30, my - 6); ctx.quadraticCurveTo(mx, my + 34, mx + 30, my - 6); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillRect(mx - 22, my - 5, 44, 8); }
  else if (mouth === "o") { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(mx, my + 2, 12, 15, 0, 0, 7); ctx.fill(); }
  else if (mouth === "open") { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(mx, my + 4, 20, 22 + Math.sin(t * 30) * 3, 0, 0, 7); ctx.fill(); ctx.fillStyle = RED; ctx.beginPath(); ctx.ellipse(mx, my + 16, 11, 7, 0, 0, 7); ctx.fill(); }
  else if (mouth === "frown") { ctx.beginPath(); ctx.arc(mx, my + 18, 20, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
  else if (mouth === "wavy") { ctx.beginPath(); ctx.moveTo(mx - 20, my); for (let i = 0; i <= 4; i++) ctx.lineTo(mx - 20 + i * 10, my + (i % 2 ? -6 : 6)); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(mx - 16, my); ctx.lineTo(mx + 16, my); ctx.stroke(); }
  if (face.blush) { ctx.fillStyle = "rgba(229,72,77,0.35)"; for (const d of [-42, 42]) { ctx.beginPath(); ctx.ellipse(head[0] + d, head[1] + 14, 14, 8, 0, 0, 7); ctx.fill(); } }
  if (face.sweat) { ctx.fillStyle = "#5BC0EB"; ctx.strokeStyle = INK; ctx.lineWidth = 4; const sy = head[1] - 40 + ((t * 120) % 40); ctx.beginPath(); ctx.moveTo(head[0] + 70, sy - 22); ctx.quadraticCurveTo(head[0] + 88, sy + 4, head[0] + 70, sy + 8); ctx.quadraticCurveTo(head[0] + 52, sy + 4, head[0] + 70, sy - 22); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  ctx.restore();
}
const phoneProp = (ctx, h) => {
  ctx.save(); ctx.translate(h[0], h[1]); ctx.rotate(-0.25);
  ctx.fillStyle = "#2B2F3A"; ctx.strokeStyle = INK; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.roundRect(-20, -40, 40, 72, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#8FD3FF"; ctx.fillRect(-13, -32, 26, 50);
  ctx.restore();
};

/* ---------------- set ---------------- */
const FLOOR = 1500;
function wall(ctx, a, b, floor) { ctx.fillStyle = a; ctx.fillRect(-600, -600, W + 1200, FLOOR + 600); if (b) { ctx.fillStyle = b; for (let i = -5; i < 11; i++) ctx.fillRect(i * 180, -600, 70, FLOOR + 600); } ctx.fillStyle = floor; ctx.fillRect(-600, FLOOR, W + 1200, H); ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-600, FLOOR); ctx.lineTo(W + 600, FLOOR); ctx.stroke(); }
function box(ctx, x, y, w, h, fill, r = 16) { ctx.fillStyle = fill; ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); ctx.stroke(); }
const SETS = {
  kamar(ctx) { wall(ctx, "#FFD86B", "#F2C14E", "#E9A24B"); box(ctx, 640, 620, 300, 260, "#A5E1FF"); ctx.beginPath(); ctx.moveTo(790, 620); ctx.lineTo(790, 880); ctx.stroke(); },
  dapur(ctx) { wall(ctx, "#9ED8F5", null, "#C98A55"); for (let r = 0; r < 6; r++) for (let c = -1; c < 7; c++) { ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 4; ctx.strokeRect(c * 190 - 40, 500 + r * 150, 190, 150); } box(ctx, 700, 1240, 420, 260, "#E8B07A", 6); },
  kantor(ctx) { wall(ctx, "#E4E9F2", null, "#9AA7BD"); box(ctx, 600, 560, 340, 220, "#FFFFFF"); ctx.fillStyle = "#4C8DF6"; ctx.fillRect(630, 600, 120, 14); ctx.fillRect(630, 640, 220, 14); box(ctx, 620, 1230, 440, 40, "#C98A55", 8); box(ctx, 720, 1100, 200, 130, "#2B2F3A", 10); ctx.fillStyle = "#8FD3FF"; ctx.fillRect(735, 1112, 170, 100); box(ctx, 90, 1300, 120, 200, "#E5484D", 20); ctx.fillStyle = "#3FA34D"; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(150 + (i - 2) * 24, 1250 - Math.abs(i - 2) * 14, 22, 70, (i - 2) * 0.3, 0, 7); ctx.fill(); } },
  kelas(ctx) { wall(ctx, "#F6E7C8", null, "#B98A5E"); box(ctx, 120, 520, 840, 460, "#2F5D50", 10); ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(200, 640); ctx.lineTo(520, 640); ctx.moveTo(200, 720); ctx.lineTo(700, 720); ctx.moveTo(200, 800); ctx.lineTo(420, 800); ctx.stroke(); box(ctx, 100, 980, 880, 26, "#8B5A2B", 6); },
  jalan(ctx) { ctx.fillStyle = "#9ED8F5"; ctx.fillRect(-600, -600, W + 1200, FLOOR + 600); ctx.fillStyle = "#C9D6E8"; for (let i = 0; i < 6; i++) { const x = -200 + i * 240, h = 500 + hash(i, 2) * 500; box(ctx, x, FLOOR - h - 80, 200, h, ["#F2C14E", "#E5484D", "#4C8DF6", "#9B7BE0"][i % 4], 6); ctx.fillStyle = "rgba(255,255,255,0.7)"; for (let r = 0; r < 4; r++) ctx.fillRect(x + 30, FLOOR - h - 40 + r * 110, 50, 60); } ctx.fillStyle = "#8C8C8C"; ctx.fillRect(-600, FLOOR - 80, W + 1200, 80); ctx.fillStyle = "#4A4D57"; ctx.fillRect(-600, FLOOR, W + 1200, H); ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-600, FLOOR); ctx.lineTo(W + 600, FLOOR); ctx.stroke(); },
  taman(ctx) { ctx.fillStyle = "#B8F2C8"; ctx.fillRect(-600, -600, W + 1200, H + 1200); ctx.fillStyle = "#FFF6B0"; ctx.beginPath(); ctx.arc(860, 360, 90, 0, 7); ctx.fill(); for (const x of [120, 920]) { ctx.fillStyle = "#8B5A2B"; ctx.fillRect(x - 24, 1000, 48, 500); ctx.fillStyle = "#3FA34D"; ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(x, 940, 190, 0, 7); ctx.fill(); ctx.stroke(); } ctx.fillStyle = "#6CCB8A"; ctx.fillRect(-600, FLOOR, W + 1200, H); ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-600, FLOOR); ctx.lineTo(W + 600, FLOOR); ctx.stroke(); },
  panggung(ctx, t) { ctx.fillStyle = "#C9B6FF"; ctx.fillRect(-600, -600, W + 1200, H + 1200); ctx.save(); ctx.translate(540, 1150); ctx.rotate(t * 0.4); ctx.fillStyle = "rgba(255,255,255,0.35)"; for (let i = 0; i < 16; i++) { ctx.rotate(Math.PI / 8); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-60, -1500); ctx.lineTo(60, -1500); ctx.fill(); } ctx.restore(); ctx.fillStyle = "#9B7BE0"; ctx.fillRect(-600, FLOOR, W + 1200, H); },
};

/* ---------------- efek ---------------- */
function burst(ctx, x, y, t, t0, cols, n = 18) {
  const u = t - t0; if (u < 0 || u > 1.2) return;
  for (let i = 0; i < n; i++) {
    const a = rad(-90 - 80 + (160 * i) / (n - 1)) + hash(i, 9) * 0.3, v = 700 + hash(i, 4) * 500;
    const px = x + Math.cos(a) * v * u, py = y + Math.sin(a) * v * u + 1400 * u * u;
    ctx.fillStyle = cols[i % cols.length]; ctx.globalAlpha = 1 - u / 1.2; ctx.beginPath(); ctx.ellipse(px, py, 11, 16, a + u * 6, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function speedLines(ctx, t, y0, y1) { ctx.strokeStyle = "rgba(20,20,20,0.35)"; ctx.lineWidth = 6; ctx.lineCap = "round"; for (let i = 0; i < 9; i++) { const y = lerp(y0, y1, hash(i, 3)); const x = ((t * 1800 + i * 260) % (W + 400)) - 200; ctx.beginPath(); ctx.moveTo(W - x, y); ctx.lineTo(W - x + 160, y); ctx.stroke(); } }
function bulb(ctx, x, y, t) {
  const k = pop(t, 0.3, 0.3, 3); if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  ctx.strokeStyle = "rgba(255,200,60,0.8)"; ctx.lineWidth = 8; for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 80, Math.sin(a) * 80 - 10); ctx.lineTo(Math.cos(a) * 110, Math.sin(a) * 110 - 10); ctx.stroke(); }
  ctx.fillStyle = "#FFE066"; ctx.strokeStyle = INK; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, -10, 58, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#B8BCC6"; ctx.beginPath(); ctx.roundRect(-28, 44, 56, 40, 8); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function stamp(ctx, t, word, col) {
  const k = ease.outBack(clamp((t - 0.35) / 0.16), 3); if (t < 0.35) return;
  const sc = 2.2 - 1.2 * k;
  ctx.save(); ctx.translate(760, 820); ctx.rotate(-0.12); ctx.scale(sc * 0.62, sc * 0.62); ctx.globalAlpha = clamp((t - 0.35) / 0.06);
  ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.beginPath(); ctx.roundRect(-270, -110, 540, 190, 24); ctx.stroke();
  outlined(ctx, word, 0, 50, 140, col, { fam: "Bungee", sw: 0, maxW: 500 });
  ctx.restore();
}
function check(ctx, t) {
  const k = pop(t, 0.35, 0.3, 3); if (k <= 0) return;
  ctx.save(); ctx.translate(800, 820); ctx.scale(k * 0.85, k * 0.85);
  ctx.fillStyle = "#2FB36B"; ctx.strokeStyle = INK; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, 120, 0, 7); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 26; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-55, 0); ctx.lineTo(-12, 45); ctx.lineTo(60, -45); ctx.stroke();
  ctx.restore();
}

/** Gambar satu frame scene stickman ekspresif. */
export function drawStick(ctx, inp: AnimInput) {
  const { t, dur, anim } = inp;
  const ev = anim.event;
  const camKind = ev === "kaget" ? "guncang" : anim.camera;
  const cam = camFor(camKind, t, dur, { fx: 540, fy: 1180, cy: 1180 });
  const cast = anim.cast || [];
  const n = cast.length;
  withCam(ctx, cam, () => {
    (SETS[anim.set] || SETS.kamar)(ctx, t);
    cast.forEach((c, i) => {
      const side = ev === "salah" || ev === "benar";
      const home = n === 1 ? (side ? 380 : 540) : i === 0 ? 330 : 750;
      let x = home, pose, flip = n > 1 && i === 1 ? -1 : 1, hop = 0;
      if (c.pose === "jalan") { x = lerp(home - 260, home, clamp(t / Math.min(dur, 2.4))); pose = t < Math.min(dur, 2.4) ? walkPose(t * 9) : POSES.stand; }
      else if (c.pose === "lari") { x = lerp(-150, home, ease.outCubic(clamp(t / Math.min(dur, 1.6)))); pose = t < Math.min(dur, 1.6) ? walkPose(t * 16, 1.3, true) : POSES.shock; }
      else {
        const key = POSE_OF[c.pose] || "stand";
        // masuk ke pose dari berdiri dalam 0.2 dtk biar terasa bergerak
        pose = mix(POSES.stand, POSES[key], ease.outCubic(clamp((t - 0.08) / 0.2)));
        if (key === "cheer") hop = Math.abs(Math.sin(t * Math.PI * 2.2)) * 26;
        else hop = Math.abs(Math.sin(t * Math.PI * 1.4)) * 6;
      }
      const face = { ...(FACE_OF[c.mood] || FACE_OF.senang), talk: c.talk, look: (FACE_OF[c.mood] || {}).look || [n > 1 ? 0.6 : 0, 0] };
      if (ev === "keringat") face.sweat = 1;
      stick(ctx, { x, y: FLOOR + 10 - hop, s: n > 1 ? 1.15 : 1.35, pose, face, prop: c.pose === "hp" ? phoneProp : null, flip, t, squash: c.pose === "kaget" ? Math.max(0, 0.5 - t * 3) : 0 });
      if (c.pose === "lari" && t < 1.6) speedLines(ctx, t, 900, 1400);
      if (ev === "ide" && i === 0) bulb(ctx, x, FLOOR - 700, t);
    });
    if (ev === "menang") { burst(ctx, 540, 1000, t, 0.2, ["#E5484D", "#4C8DF6", "#F2C14E", "#2FB36B"], 26); }
  });
  if (ev === "kaget" && t >= 0.35 && t < 0.42) { ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.fillRect(0, 0, W, H); }
  if (ev === "salah") stamp(ctx, t, /mitos/i.test(inp.screenText) ? "MITOS!" : "SALAH!", RED);
  if (ev === "benar") check(ctx, t);
  // judul besar
  const [a, b] = twoLines(inp.screenText);
  const k = inp.index === 0 ? 1 : ease.outBack(clamp((t - 0.02) / 0.3), 2.6);
  if (a || b) {
    ctx.save(); ctx.translate(W / 2, 400); ctx.rotate(-0.03); ctx.scale(k, k);
    const size = Math.max(a.length, b.length) > 13 ? 84 : 100;
    if (a) outlined(ctx, a.toUpperCase(), 0, 0, size, INK, { fam: "Bungee", stroke: "#FFFFFF", sw: 0.16, maxW: 940 });
    if (b) outlined(ctx, b.toUpperCase(), 0, size * 1.08, size, RED, { fam: "Bungee", stroke: "#FFFFFF", sw: 0.16, maxW: 940 });
    ctx.restore();
  }
}
