/**
 * Klien kecil untuk Gemini Interactions API (REST).
 * Docs: https://ai.google.dev/gemini-api/docs/speech-generation dan /structured-output
 */
const BASE = "https://generativelanguage.googleapis.com/v1beta/interactions";

export const hasApiKey = () => !!process.env.GEMINI_API_KEY;
const textModel = () => process.env.GEMINI_TEXT_MODEL || "gemini-3.8-flash";
const ttsModel = () => process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-tts";
const videoModel = () => process.env.GEMINI_VIDEO_MODEL || "gemini-omni-1.1-flash";
const imageModel = () => process.env.GEMINI_IMAGE_MODEL || "gemini-nano-banana-2.1";

/** Model cadangan kalau model utama sedang penuh (503) atau tidak tersedia (404). */
const FALLBACK: Record<string, string[]> = {
  "gemini-3.8-flash": ["gemini-3.7-flash", "gemini-3.5-flash"],
  "gemini-3.8-flash-tts": ["gemini-3.8-flash-lite-tts", "gemini-3.1-flash-tts-preview"],
  "gemini-omni-1.1-flash": ["gemini-omni-1.2-flash"],
};

async function call(body: any, attempt = 1, extraHeaders: Record<string, string> = {}): Promise<any> {
  try {
    return await callOnce(body, attempt, extraHeaders);
  } catch (e: any) {
    const alts = FALLBACK[body?.model] || [];
    if (!/Gemini API (503|404|429)/.test(String(e?.message)) || !alts.length) throw e;
    let last = e;
    for (const m of alts) {
      try {
        return await callOnce({ ...body, model: m }, 3, extraHeaders);
      } catch (e2: any) {
        last = e2;
      }
    }
    throw last;
  }
}

async function callOnce(body: unknown, attempt = 1, extraHeaders: Record<string, string> = {}): Promise<any> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY || "", "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  });
  if ((res.status === 429 || res.status >= 500) && attempt < 4) {
    await new Promise((r) => setTimeout(r, 1500 * attempt * attempt));
    return callOnce(body, attempt + 1, extraHeaders);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || res.statusText;
    throw new Error(`Gemini API ${res.status}: ${msg}`);
  }
  return json;
}

/** Ambil semua blok konten keluaran model dari respons Interactions API. */
function outputBlocks(json: any): any[] {
  const steps: any[] = Array.isArray(json?.steps) ? json.steps : [];
  const blocks = steps.filter((s) => s?.type === "model_output").flatMap((s) => (Array.isArray(s.content) ? s.content : []));
  if (blocks.length) return blocks;
  // cadangan untuk bentuk respons lain
  const parts = json?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) return parts.map((p: any) => (p.text ? { type: "text", text: p.text } : p));
  return Array.isArray(json?.outputs) ? json.outputs : [];
}

function outputText(json: any): string {
  return outputBlocks(json)
    .filter((b) => b?.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/** Kumpulkan URL sumber dari anotasi grounding (struktur dicari rekursif supaya tahan perubahan). */
function collectSources(json: any): { title: string; url: string }[] {
  const out = new Map<string, string>();
  const walk = (v: any) => {
    if (!v || typeof v !== "object") return;
    if (Array.isArray(v)) return v.forEach(walk);
    const url = v.url || v.uri;
    if (typeof url === "string" && /^https?:\/\//.test(url) && !url.includes("googleapis.com")) {
      out.set(url, String(v.title || v.name || v.domain || url));
    }
    Object.values(v).forEach(walk);
  };
  walk(json);
  return [...out].map(([url, title]) => ({ url, title }));
}

export async function research(topic: string) {
  const json = await call({
    model: textModel(),
    input:
      `Riset faktual untuk video edukasi teknologi berbahasa Indonesia tentang: "${topic}".\n` +
      `Tulis 5-8 poin fakta singkat yang bisa diverifikasi, masing-masing satu kalimat, sebutkan sumber dan tanggalnya kalau ada. ` +
      `Utamakan sumber resmi (pemerintah, bank, vendor, lembaga riset, media kredibel). Jangan menebak angka.`,
    tools: [{ type: "google_search" }],
  });
  const text = outputText(json);
  const facts = text
    .split("\n")
    .map((l) => l.replace(/^[-*\d.\s]+/, "").trim())
    .filter((l) => l.length > 20);
  return { facts, sources: collectSources(json) };
}

export async function generateJson<T>(prompt: string, schema: object, images: RefImage[] = []): Promise<T> {
  const input = images.length
    ? [...images.slice(0, 4).map((r) => ({ type: "image", mime_type: r.mime, data: r.data.toString("base64") })), { type: "text", text: prompt }]
    : prompt;
  const json = await call({
    model: textModel(),
    input,
    response_format: { type: "text", mime_type: "application/json", schema },
  });
  const text = outputText(json).replace(/^```json\s*|```$/g, "");
  return JSON.parse(text) as T;
}

/** Hasil: buffer WAV mono 24 kHz 16-bit. */
export async function tts(text: string, voice: string, style: string): Promise<Buffer> {
  const json = await call({
    model: ttsModel(),
    input: [{ type: "user_input", content: [{ type: "text", text, annotations: [{ type: "speech_metadata", style }] }] }],
    response_format: { type: "audio" },
    generation_config: { speech_config: [{ voice }] },
  }).catch((e: any) => {
    // model cadangan (lite) tidak menerima arahan gaya: ulangi tanpa annotations
    if (!/Speech metadata is not supported/i.test(String(e?.message))) throw e;
    return call({
      model: "gemini-3.8-flash-lite-tts",
      input: [{ type: "user_input", content: [{ type: "text", text }] }],
      response_format: { type: "audio" },
      generation_config: { speech_config: [{ voice }] },
    });
  });
  return wavFrom(json);
}

function wavFrom(json: any): Buffer {
  const audio = outputBlocks(json).filter((b) => b?.type === "audio" && b.data).pop();
  if (!audio) throw new Error("Gemini TTS tidak mengembalikan audio");
  const buf = Buffer.from(audio.data, "base64");
  return buf.subarray(0, 4).toString() === "RIFF" ? buf : pcmToWav(buf, 24000);
}


export type RefImage = { data: Buffer; mime: string };

/**
 * Gambar 3D per scene (Nano Banana). Referensi karakter dikirim sebagai blok gambar setelah teks,
 * dan disebut berurutan di prompt ("the first image", dst.). Hasil: buffer PNG/JPEG.
 */
export async function image(prompt: string, refs: RefImage[] = [], aspect = "9:16"): Promise<Buffer> {
  const input = [
    { type: "text", text: prompt },
    ...refs.slice(0, 4).map((r) => ({ type: "image", mime_type: r.mime, data: r.data.toString("base64") })),
  ];
  const headers: Record<string, string> = process.env.GEMINI_API_REVISION === "" ? {} : { "Api-Revision": process.env.GEMINI_API_REVISION || "2026-05-20" };
  let json: any;
  try {
    json = await call({ model: imageModel(), input, response_format: { type: "image", aspect_ratio: aspect, image_size: "2K" } }, 1, headers);
  } catch (e: any) {
    // Rasio 9:16 belum tercantum eksplisit di dokumentasi; kalau ditolak, minta tanpa rasio lalu potong saat render.
    if (!/\b400\b/.test(String(e?.message))) throw e;
    json = await call({ model: imageModel(), input, response_format: { type: "image" } }, 1, headers);
  }
  const img = outputBlocks(json).filter((b) => b?.type === "image" && b.data).pop() || json?.output_image;
  if (!img?.data) throw new Error("Gemini tidak mengembalikan gambar");
  return Buffer.from(img.data, "base64");
}

export function pcmToWav(pcm: Buffer, sampleRate: number) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sampleRate, 24);
  h.writeUInt32LE(sampleRate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

/** Durasi WAV PCM dalam detik, dibaca dari header. */
export function wavDuration(buf: Buffer) {
  const byteRate = buf.readUInt32LE(28);
  let off = 12;
  while (off + 8 <= buf.length) {
    const id = buf.toString("ascii", off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === "data") return Math.min(size, buf.length - off - 8) / byteRate;
    off += 8 + size;
  }
  return 0;
}

/**
 * Klip video (Gemini Omni Flash, Interactions API). Foto produk dikirim sebagai IMAGE_REF supaya
 * bentuk produknya dipertahankan, bukan dipakai sebagai frame pertama. Hasil: buffer MP4.
 * Docs: https://ai.google.dev/gemini-api/docs/omni
 */
export async function video(prompt: string, refs: RefImage[] = [], aspect = "9:16"): Promise<Buffer> {
  const tags = refs.slice(0, 3).map((_, i) => `<IMAGE_REF_${i}>`).join(" ");
  const text = refs.length
    ? `${tags}\nUse the given image(s) as references for the product's exact shape, color, material and details. They should not be used as literal initial frames.\n\n${prompt}`
    : prompt;
  const input = [...refs.slice(0, 3).map((r) => ({ type: "image", mime_type: r.mime, data: r.data.toString("base64") })), { type: "text", text }];
  const json = await call({
    model: videoModel(),
    input,
    response_format: { type: "video", aspect_ratio: aspect, resolution: "720p" },
    background: false,
    store: false,
  });
  const blocks = outputBlocks(json);
  const v = blocks.filter((b) => b?.type === "video").pop() || json?.output_video;
  if (v?.data) return Buffer.from(v.data, "base64");
  if (v?.uri) {
    // file besar dikirim sebagai URI Files API; tunggu ACTIVE lalu unduh
    const key = { "x-goog-api-key": process.env.GEMINI_API_KEY || "" };
    const name = String(v.uri).replace(/^.*\/(files\/[^/:?]+).*$/, "$1");
    for (let i = 0; i < 60; i++) {
      const meta = await fetch(`https://generativelanguage.googleapis.com/v1beta/${name}`, { headers: key }).then((r) => r.json()).catch(() => ({}));
      if (meta?.state === "ACTIVE" || !meta?.state) break;
      await new Promise((r) => setTimeout(r, 3000));
    }
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${name}:download?alt=media`, { headers: key });
    if (!res.ok) throw new Error(`Gagal mengunduh klip (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error("Gemini tidak mengembalikan video");
}
