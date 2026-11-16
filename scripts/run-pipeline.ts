/**
 * Pipeline produksi: riset → naskah → suara → gambar 3D → render.
 * Jalan sebagai proses terpisah supaya halaman web tetap responsif.
 *   npx tsx scripts/run-pipeline.ts <projectId> <all|script|voice|images|render|rewrite|image> [sceneId]
 */
import fs from "node:fs";
import path from "node:path";
import { channelDir, getChannel, getCharacters, getProducts, saveProducts, getProject, getTemplate, listProjects, projectDir, ROOT, saveProject } from "../lib/store";
import { generateJson, hasApiKey, image, pcmToWav, research, tts, video, wavDuration, type RefImage } from "../lib/gemini";
import { AD_SCHEMA, AD_TEMPLATE_ID, adScenes, buildAdPrompt, demoAd, sanitizeAd, type AdResult } from "../lib/adscript";
import { execFileSync } from "node:child_process";
import { buildPrompt, demoScript, sanitizeScript, SCRIPT_SCHEMA, type ScriptResult } from "../lib/script";
import { adChecks, runChecks } from "../lib/policy";
import { allCues, toSrt } from "../lib/subtitle";
import type { Channel, Character, Project, Scene } from "../lib/types";
import { DEFAULT_CHANNELS } from "../lib/defaults";

const [id, step = "all", sceneId] = process.argv.slice(2);

function set(p: Project, patch: Partial<Project>) {
  Object.assign(p, patch);
  saveProject(p);
}

const channelOf = (p: Project): Channel => getChannel(p.channelId) || DEFAULT_CHANNELS[0];

const productsOf = (p: Project) => (p.productIds || []).map((id) => getProducts().find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x);

function refreshChecks(p: Project) {
  if (p.kind === "affiliate" && p.templateId === "product-ad") {
    const week = Date.now() - 7 * 86400000;
    const recent = listProjects().filter((x) => x.kind === "affiliate" && x.channelId === p.channelId && new Date(x.createdAt).getTime() > week).length;
    p.checks = adChecks(p, productsOf(p)[0], recent);
    return;
  }
  p.checks = runChecks(p, getTemplate(p.templateId), channelOf(p));
}

const isAd = (p: Project) => p.kind === "affiliate" && p.templateId === AD_TEMPLATE_ID;

function productRefs(p: Project): RefImage[] {
  const x = productsOf(p)[0];
  if (!x) return [];
  return x.photos
    .map((f) => path.join(channelDir(x.channelId), f))
    .filter((f) => fs.existsSync(f))
    .slice(0, 3)
    .map((f) => ({ data: fs.readFileSync(f), mime: /\.png$/i.test(f) ? "image/png" : /\.webp$/i.test(f) ? "image/webp" : "image/jpeg" }));
}

async function doAdScript(p: Project) {
  const x = productsOf(p)[0];
  if (!x) throw new Error("Produk untuk video ini tidak ditemukan. Mungkin sudah dihapus.");
  let r: AdResult;
  if (!hasApiKey()) {
    set(p, { status: "writing", stage: "Mode demo: naskah contoh", progress: 0.12, demo: true });
    r = demoAd(p, x);
  } else {
    set(p, { status: "writing", stage: "Melihat foto produk dan menulis adegan", progress: 0.12, demo: false });
    r = await generateJson<AdResult>(buildAdPrompt(p, x, x.facts.join("; ")), AD_SCHEMA, productRefs(p));
  }
  r = sanitizeAd(r, p, x);
  const dir = path.join(projectDir(p.id), "public");
  for (const s of p.scenes) {
    for (const f of [s.audio, s.visual.clip]) if (f) fs.rmSync(path.join(dir, f), { force: true });
  }
  p.scenes = adScenes(r);
  p.title = r.title;
  p.titleOptions = r.titleOptions;
  p.coverText = r.hook;
  p.caption = r.caption;
  p.hashtags = r.hashtags;
  p.facts = x.facts;
  p.sources = x.link ? [{ title: `Halaman produk ${x.name}`, url: x.link, verified: false }] : [];
  if (x.name === "Produk baru" && r.productName) {
    const list = getProducts();
    const own = list.find((y) => y.id === x.id);
    if (own) {
      own.name = r.productName;
      if (!own.category) own.category = r.category;
      saveProducts(list);
    }
  }
  if (p.topic === "Produk baru") p.topic = r.productName;
  saveProject(p);
}

function probeSec(file: string) {
  try {
    return Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim()) || 0;
  } catch {
    return 0;
  }
}

async function clipScene(p: Project, s: Scene) {
  const dir = path.join(projectDir(p.id), "public");
  fs.mkdirSync(dir, { recursive: true });
  const secs = Math.min(10, Math.max(4, Math.ceil((s.durationSec || 5) + 0.5)));
  const prompt = `${s.prompt}\nDuration: about ${secs} seconds, one continuous vertical shot, no cuts. [0-${secs}s]`;
  const buf = await video(prompt, productRefs(p));
  const name = `clip-${s.id}-${Date.now().toString(36)}.mp4`;
  if (s.visual.clip) fs.rmSync(path.join(dir, s.visual.clip), { force: true });
  fs.writeFileSync(path.join(dir, name), buf);
  s.visual = { ...s.visual, kind: "clip", clip: name };
  s.clipSec = probeSec(path.join(dir, name));
}

async function doClips(p: Project, only?: string) {
  if (!hasApiKey()) {
    set(p, { stage: "Mode demo: klip AI butuh GEMINI_API_KEY, memakai foto produk" });
    return;
  }
  const list = p.scenes.filter((s) => (only ? s.id === only : !s.visual.clip));
  for (let i = 0; i < list.length; i++) {
    set(p, { status: "imaging", stage: `Membuat klip AI adegan ${i + 1} dari ${list.length} (bisa 1–3 menit per klip)`, progress: 0.4 + (0.3 * i) / list.length });
    await clipScene(p, list[i]);
    saveProject(p);
  }
}

async function doScript(p: Project) {
  const t = getTemplate(p.templateId);
  if (!t) throw new Error("Template tidak ditemukan");
  const ch = channelOf(p);
  const chars = getCharacters(ch.id);
  let result: ScriptResult;
  if (!hasApiKey()) {
    set(p, { status: "researching", stage: "Mode demo: memakai naskah contoh", progress: 0.1, demo: true });
    result = demoScript(ch.id);
    p.facts = [];
    p.sources = [];
  } else {
    set(p, { status: "researching", stage: "Riset sumber", progress: 0.05, demo: false });
    const r = await research(p.topic);
    if (!r.sources.length || !r.facts.length) {
      set(p, {
        status: "failed",
        stage: "Riset gagal",
        error:
          "Riset belum menemukan sumber yang bisa dicek, jadi naskah tidak ditulis supaya tidak ada klaim yang dikarang. Coba perjelas topiknya: sebut nama aplikasi, jenis kejadian, atau tempatnya.",
      });
      return false;
    }
    p.facts = r.facts;
    p.sources = r.sources.slice(0, 8).map((s) => ({ ...s, verified: false }));
    set(p, { status: "writing", stage: `Menulis naskah (${r.sources.length} sumber ditemukan)`, progress: 0.2 });
    result = await generateJson<ScriptResult>(buildPrompt(p, t, chars, r.facts, ch), SCRIPT_SCHEMA);
  }
  result = sanitizeScript(result, t, p.productIds || []);
  const scenes: Scene[] = result.scenes.map((s, i) => ({ ...s, id: `s${i + 1}` }));
  set(p, {
    title: result.title,
    titleOptions: result.titleOptions,
    scenes,
    caption: result.caption,
    hashtags: result.hashtags,
    coverText: result.coverText,
    coverKeyword: result.coverKeyword,
    progress: 0.3,
  });
  return true;
}

/** Samakan kerasnya suara antar scene (RMS sekitar -18 dBFS, puncak dibatasi -1 dBFS). */
function normalizeWav(buf: Buffer) {
  const off = buf.indexOf("data") + 8;
  if (off < 8 || buf.readUInt16LE(34) !== 16) return buf;
  const n = Math.floor((buf.length - off) / 2);
  if (!n) return buf;
  let sum = 0, peak = 0;
  for (let i = 0; i < n; i++) {
    const v = buf.readInt16LE(off + i * 2) / 32768;
    sum += v * v;
    peak = Math.max(peak, Math.abs(v));
  }
  const rms = Math.sqrt(sum / n);
  if (rms < 1e-4) return buf;
  const gain = Math.min(Math.pow(10, -18 / 20) / rms, 0.89 / peak);
  const out = Buffer.from(buf);
  for (let i = 0; i < n; i++) out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(buf.readInt16LE(off + i * 2) * gain))), off + i * 2);
  return out;
}

/** Perkiraan durasi bicara untuk mode demo (≈2,6 kata/detik). */
function estimateSec(text: string) {
  return Math.max(2, text.split(/\s+/).length / 2.6 + 0.4);
}

async function voiceScene(p: Project, s: Scene) {
  const ch = isAd(p) ? undefined : getCharacters().find((c) => c.id === s.speaker);
  const dir = path.join(projectDir(p.id), "public");
  fs.mkdirSync(dir, { recursive: true });
  let wav: Buffer;
  if (!hasApiKey()) {
    wav = pcmToWav(Buffer.alloc(Math.round(estimateSec(s.text) * 24000) * 2), 24000);
  } else {
    const style = isAd(p)
      ? `Bahasa Indonesia, kreator TikTok yang ${p.vibe === "elegan" ? "tenang dan meyakinkan" : p.vibe === "ceria" ? "ceria dan bersemangat" : "santai dan hangat seperti cerita ke teman"}. Natural, tidak seperti iklan TV.`
      : `Bahasa Indonesia, ${ch?.style || "santai dan jelas"}. Karakter ${ch?.name || s.speaker}.`;
    wav = await tts(s.text, (isAd(p) ? p.voice : ch?.voice) || "Kore", style);
  }
  wav = normalizeWav(wav);
  const file = `${s.id}-${Date.now().toString(36)}.wav`;
  if (s.audio) fs.rmSync(path.join(dir, s.audio), { force: true });
  fs.writeFileSync(path.join(dir, file), wav);
  s.audio = file;
  s.durationSec = Math.round(wavDuration(wav) * 100) / 100;
}

async function doVoice(p: Project, only?: string) {
  const list = p.scenes.filter((s) => (only ? s.id === only : true));
  for (let i = 0; i < list.length; i++) {
    set(p, { status: "voicing", stage: `Membuat suara scene ${i + 1} dari ${list.length}`, progress: 0.3 + (0.2 * i) / list.length });
    await voiceScene(p, list[i]);
    saveProject(p);
  }
  fs.writeFileSync(path.join(projectDir(p.id), "subtitle.srt"), toSrt(p.scenes));
  p.srt = "subtitle.srt";
}

function refFor(c: Character | undefined): RefImage | null {
  if (!c?.refImage) return null;
  const f = path.join(channelDir(c.channelId), c.refImage);
  if (!fs.existsSync(f)) return null;
  return { data: fs.readFileSync(f), mime: /\.png$/i.test(f) ? "image/png" : "image/jpeg" };
}

/** Prompt gambar: gaya channel + adegan + karakter (pakai gambar referensi kalau ada, kalau tidak pakai deskripsi tampilan). */
export function imagePrompt(scene: Scene, ch: Channel, chars: Character[], refs: Character[]) {
  const named = chars.filter((c) => new RegExp(`\\b${c.id}\\b|\\b${c.name}\\b`, "i").test(scene.prompt) || c.id === scene.speaker);
  const who = named
    .map((c) => {
      const ri = refs.indexOf(c);
      return ri >= 0 ? `${c.name} looks exactly like the character in reference image ${ri + 1}` : c.look ? `${c.name} is a ${c.look}` : "";
    })
    .filter(Boolean)
    .join(". ");
  return [
    `Vertical 9:16 frame. ${ch.imageStyle}.`,
    `Scene: ${scene.prompt}.`,
    who ? `Characters: ${who}. Keep every character's design consistent with its description or reference.` : "",
    "Leave calm negative space in the top third of the frame for on-screen text.",
    "No text, letters, numbers, captions, watermarks or logos anywhere in the image.",
  ]
    .filter(Boolean)
    .join(" ");
}

async function imageScene(p: Project, s: Scene) {
  const ch = channelOf(p);
  const chars = getCharacters(ch.id);
  const involved = chars.filter((c) => c.id === s.speaker || new RegExp(`\\b${c.name}\\b`, "i").test(s.prompt));
  const refChars = involved.filter((c) => refFor(c));
  const buf = await image(
    imagePrompt(s, ch, chars, refChars),
    refChars.map((c) => refFor(c)!),
  );
  const dir = path.join(projectDir(p.id), "public");
  fs.mkdirSync(dir, { recursive: true });
  const isPng = buf.subarray(1, 4).toString() === "PNG";
  const file = `img-${s.id}-${Date.now().toString(36)}.${isPng ? "png" : "jpg"}`;
  if (s.image) fs.rmSync(path.join(dir, s.image), { force: true });
  fs.writeFileSync(path.join(dir, file), buf);
  s.image = file;
}

export function visualModeOf(p: Project): "cards" | "3d" {
  if (p.visualStyle === "3d" || p.visualStyle === "cards") return p.visualStyle;
  return getTemplate(p.templateId)?.visualMode || channelOf(p).visualMode;
}

async function doImages(p: Project, only?: string) {
  if (!hasApiKey()) return; // mode demo: tetap motion graphic
  if (!only && visualModeOf(p) !== "3d") return;
  const list = p.scenes.filter((s) => (only ? s.id === only : !s.image && s.visual.kind !== "clip" && s.visual.kind !== "product"));
  for (let i = 0; i < list.length; i++) {
    set(p, { status: "imaging", stage: `Membuat gambar 3D scene ${i + 1} dari ${list.length}`, progress: 0.5 + (0.2 * i) / list.length });
    try {
      await imageScene(p, list[i]);
    } catch (e: any) {
      // satu gambar gagal tidak menghentikan video; scene itu tetap pakai motion graphic
      console.error("gambar gagal", list[i].id, e?.message);
      p.stage = `Gambar scene ${p.scenes.indexOf(list[i]) + 1} gagal, scene itu pakai motion graphic`;
    }
    saveProject(p);
  }
}

async function doRender(p: Project) {
  for (const s of p.scenes.filter((x) => !x.audio || !x.durationSec)) await doVoice(p, s.id);
  set(p, { status: "rendering", stage: "Menyiapkan render", progress: 0.72 });
  const ch = channelOf(p);
  const dir = projectDir(p.id);
  const pub = path.join(dir, "public");
  fs.mkdirSync(path.join(pub, "fonts"), { recursive: true });
  fs.mkdirSync(path.join(pub, "audio"), { recursive: true });
  for (const f of fs.readdirSync(path.join(ROOT, "remotion/public/fonts"))) fs.copyFileSync(path.join(ROOT, "remotion/public/fonts", f), path.join(pub, "fonts", f));
  for (const f of fs.readdirSync(path.join(ROOT, "remotion/public/audio"))) fs.copyFileSync(path.join(ROOT, "remotion/public/audio", f), path.join(pub, "audio", f));
  const cdir = channelDir(ch.id);
  let logo: string | undefined;
  if (ch.logo && fs.existsSync(path.join(cdir, ch.logo))) {
    logo = "brand-" + ch.logo;
    fs.copyFileSync(path.join(cdir, ch.logo), path.join(pub, logo));
  }
  let bgm: string | undefined = ch.bgmPreset === "none" ? undefined : `audio/bgm-${ch.bgmPreset}.wav`;
  if (ch.bgm && fs.existsSync(path.join(cdir, ch.bgm))) {
    bgm = "brand-" + ch.bgm;
    fs.copyFileSync(path.join(cdir, ch.bgm), path.join(pub, bgm));
  }

  const products: Record<string, { name: string; brand: string; price: string; platform: string; photo?: string }> = {};
  for (const x of productsOf(p)) {
    let photo: string | undefined;
    if (x.photos[0] && fs.existsSync(path.join(channelDir(x.channelId), x.photos[0]))) {
      photo = "prod-" + path.basename(x.photos[0]);
      fs.copyFileSync(path.join(channelDir(x.channelId), x.photos[0]), path.join(pub, photo));
    }
    products[x.id] = { name: x.name, brand: x.brand, price: x.price, platform: x.platform, photo };
  }

  if (isAd(p)) return renderAd(p, pub, dir, ch, products);
  const { bundle } = await import("@remotion/bundler");
  const { renderMedia, selectComposition } = await import("@remotion/renderer");
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, "remotion/index.ts"), publicDir: pub });
  const inputProps = {
    scenes: p.scenes,
    cues: allCues(p.scenes),
    characters: getCharacters(ch.id).map((c) => ({ id: c.id, name: c.name, color: c.color, textColor: c.textColor })),
    theme: {
      headerText: ch.headerText,
      tagline: ch.tagline,
      outroTeaser: ch.outroTeaser,
      outroFollow: ch.outroFollow,
      colors: ch.colors,
      grid: ch.grid,
      bgmVolume: ch.bgmVolume,
      channelName: ch.name,
      font: ch.font,
    },
    episode: p.episode || "",
    hookTitle: p.coverText || p.title || "",
    products,
    hookKeyword: p.coverKeyword || "",
    logo,
    bgm,
  };
  const browserExecutable = process.env.REMOTION_BROWSER || null;
  const composition = await selectComposition({ serveUrl, id: "KodeKepoVideo", inputProps, browserExecutable });
  const out = `video-${Date.now().toString(36)}.mp4`;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: path.join(dir, out),
    inputProps,
    browserExecutable,
    concurrency: Number(process.env.RENDER_CONCURRENCY) || null,
    onProgress: ({ progress }) => {
      const pr = 0.75 + progress * 0.24;
      if (Math.abs((p.progress || 0) - pr) > 0.02) set(p, { stage: `Render video ${Math.round(progress * 100)}%`, progress: pr });
    },
  });
  if (p.video) fs.rmSync(path.join(dir, p.video), { force: true });
  p.video = out;
}

async function renderAd(p: Project, pub: string, dir: string, ch: Channel, products: Record<string, { name: string; brand: string; price: string; platform: string; photo?: string }>) {
  const x = productsOf(p)[0];
  const info = x ? products[x.id] : undefined;
  const photos: string[] = [];
  for (const f of x?.photos || []) {
    const src = path.join(channelDir(x!.channelId), f);
    if (!fs.existsSync(src)) continue;
    const n = "prod-" + path.basename(f);
    fs.copyFileSync(src, path.join(pub, n));
    photos.push(n);
  }
  const { bundle } = await import("@remotion/bundler");
  const { renderMedia, selectComposition } = await import("@remotion/renderer");
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, "remotion/index.ts"), publicDir: pub });
  const inputProps = {
    scenes: p.scenes,
    cues: allCues(p.scenes, 3),
    hook: p.coverText || "",
    product: { name: info?.name || p.topic, price: info?.price || "", photos },
    cta: "Cek keranjang kuning",
    accent: ch.colors.accent,
    font: ch.font,
    ambient: !!p.ambient,
    bgm: "audio/bgm-ceria.wav",
    bgClip: p.adClip,
  };
  const browserExecutable = process.env.REMOTION_BROWSER || null;
  const composition = await selectComposition({ serveUrl, id: "ProductAd", inputProps, browserExecutable });
  const out = `video-${Date.now().toString(36)}.mp4`;
  await renderMedia({
    composition, serveUrl, codec: "h264", outputLocation: path.join(dir, out), inputProps, browserExecutable,
    concurrency: Number(process.env.RENDER_CONCURRENCY) || null,
    onProgress: ({ progress }) => {
      const pr = 0.75 + progress * 0.24;
      if (Math.abs((p.progress || 0) - pr) > 0.02) set(p, { status: "rendering", stage: `Render video ${Math.round(progress * 100)}%`, progress: pr });
    },
  });
  if (p.video) fs.rmSync(path.join(dir, p.video), { force: true });
  p.video = out;
}

async function doRewrite(p: Project, sid: string) {
  const t = getTemplate(p.templateId);
  const idx = p.scenes.findIndex((s) => s.id === sid);
  if (!t || idx < 0) throw new Error("Scene tidak ditemukan");
  if (!hasApiKey()) {
    set(p, { stage: "Mode demo: tulis ulang butuh GEMINI_API_KEY" });
    return;
  }
  set(p, { status: "writing", stage: `Menulis ulang scene ${idx + 1}`, progress: 0.3 });
  const ch = channelOf(p);
  const base = buildPrompt(p, t, getCharacters(ch.id), p.facts || [], ch);
  const ctx = p.scenes.map((s, i) => `${i + 1}. [${s.speaker}] ${s.text}`).join("\n");
  const one = await generateJson<ScriptResult["scenes"][number]>(
    `${base}\n\nNASKAH SAAT INI:\n${ctx}\n\nTulis ulang HANYA scene ${idx + 1} (speaker tetap ${p.scenes[idx].speaker}) supaya lebih nyambung dan menarik. Balas JSON satu scene.`,
    (SCRIPT_SCHEMA.properties.scenes as any).items,
  );
  const clean = sanitizeScript({ ...demoScript(), scenes: [{ ...one, speaker: p.scenes[idx].speaker }] }, t, p.productIds || []).scenes[0];
  p.scenes[idx] = { ...p.scenes[idx], ...clean, audio: p.scenes[idx].audio, durationSec: p.scenes[idx].durationSec, image: p.scenes[idx].image };
  await voiceScene(p, p.scenes[idx]);
}

async function main() {
  const p = getProject(id);
  if (!p) throw new Error("Proyek tidak ditemukan: " + id);
  if (isAd(p)) {
    if (step === "all" || step === "script") await doAdScript(p);
    if (step === "all" || step === "script" || step === "voice") await doVoice(p, sceneId);
    if (step === "all") await doClips(p);
    if (step === "clip") await doClips(p, sceneId);
  } else {
  if (step === "all" || step === "script") {
    if (!(await doScript(p))) return;
  }
  if (step === "all" || step === "voice") await doVoice(p, sceneId);
  if (step === "rewrite") await doRewrite(p, sceneId);
  if (step === "all" || step === "images") await doImages(p);
  if (step === "image") {
    if (!hasApiKey()) set(p, { stage: "Membuat gambar butuh GEMINI_API_KEY" });
    else await doImages(p, sceneId);
  }
  }
  const rendered = step === "all" || step === "render";
  if (rendered) await doRender(p);
  refreshChecks(p);
  set(p, {
    status: p.video && rendered ? "ready" : "draft",
    stage: p.video && rendered ? "Video siap" : "Ada perubahan, render ulang untuk memperbarui video",
    progress: 1,
    error: undefined,
  });
}

main().catch((e) => {
  console.error(e);
  const p = getProject(id);
  if (p) set(p, { status: "failed", stage: "Gagal", error: String(e?.message || e) });
  process.exitCode = 1;
});
