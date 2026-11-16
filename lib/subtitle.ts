import type { Scene } from "./types";

export type Cue = { start: number; end: number; text: string; keyword?: string };

/** Pecah kalimat jadi potongan pendek (maks ~5 kata / 2 baris di layar) dan bagi waktunya proporsional panjang huruf. */
export function sceneCues(scene: Scene, offset: number, maxWords = 5): Cue[] {
  const dur = scene.voiceSec || scene.durationSec || 0;
  const words = scene.text.split(/\s+/).filter(Boolean);
  const chunks: string[][] = [];
  let cur: string[] = [];
  for (const w of words) {
    cur.push(w);
    const endsSentence = /[.?!,]$/.test(w);
    if (cur.length >= maxWords || (endsSentence && cur.length >= 2)) {
      chunks.push(cur);
      cur = [];
    }
  }
  if (cur.length) chunks.push(cur);
  const total = chunks.reduce((n, c) => n + c.join(" ").length, 0) || 1;
  const kw = scene.keyword?.toLowerCase();
  let t = offset;
  return chunks.map((c) => {
    const text = c.join(" ");
    const len = (dur * text.length) / total;
    const cue: Cue = { start: t, end: t + len, text };
    if (kw && c.some((w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "") === kw.replace(/[^\p{L}\p{N}]/gu, ""))) cue.keyword = scene.keyword;
    t += len;
    return cue;
  });
}

export function allCues(scenes: Scene[], maxWords = 5): Cue[] {
  let off = 0;
  const out: Cue[] = [];
  for (const s of scenes) {
    out.push(...sceneCues(s, off, maxWords));
    off += s.durationSec || 0;
  }
  return out;
}

function ts(sec: number) {
  const ms = Math.round(sec * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(r, 3)}`;
}

export function toSrt(scenes: Scene[]) {
  return allCues(scenes)
    .map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.text}\n`)
    .join("\n");
}
