import { startPreviews } from "../../../lib/jobs";
import crypto from "node:crypto";
import { getChannels, getCharacters, getTemplates, saveChannels, saveCharacters, saveTemplates } from "../../../lib/store";
import { DEFAULT_CHANNELS, presetToTemplate, TEMPLATE_LIBRARY, LAYOUTS } from "../../../lib/defaults";
import { LOOK_PRESETS } from "../../../lib/anim";
import type { Channel } from "../../../lib/types";
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ channels: getChannels() });
}

const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "channel";

/** Buat channel baru. Kalau body berisi brand kit (dari "Saran AI"), dipakai; selain itu salinan gaya KodeKepo! dengan nama baru. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Partial<Channel> & {
    name?: string;
    characters?: { name: string; role: string; style: string; voice: string; look: string; lookPreset?: string }[];
    /** id alur dari galeri yang langsung dipasang */
    alur?: string[];
  };
  const name = String(b.name || "").trim();
  if (name.length < 2) return Response.json({ error: "Isi nama channel dulu." }, { status: 400 });
  const list = getChannels();
  let id = slug(name);
  if (list.some((c) => c.id === id)) id += "-" + crypto.randomBytes(2).toString("hex");
  const base = DEFAULT_CHANNELS[0];
  const ch: Channel = {
    ...base,
    ...b,
    id,
    name,
    headerText: b.headerText || name.toUpperCase(),
    tagline: b.tagline || "",
    outroFollow: b.outroFollow || "Follow biar nggak ketinggalan!",
    colors: { ...base.colors, ...(b.colors || {}) },
    voiceRules: b.voiceRules?.length ? b.voiceRules : ["Bahasa Indonesia santai dan jelas.", "Hook di detik pertama, jangan dibuka dengan sapaan."],
    outroTeaser: b.outroTeaser || "Sampai jumpa di video berikutnya",
    hashtagNote: b.hashtagNote || "Pakai 5 hashtag yang relevan dan umum.",
    layout: LAYOUTS.some((l) => l.id === b.layout) ? b.layout! : base.layout,
    bgmPreset: ["tech", "ceria", "horor", "motivasi", "none"].includes(b.bgmPreset as string) ? b.bgmPreset! : base.bgmPreset,
    logo: undefined,
    bgm: undefined,
  };
  delete (ch as any).characters;
  delete (ch as any).alur;
  delete (ch as any).demo;
  saveChannels([...list, ch]);
  // karakter & template awal supaya channel langsung bisa dipakai
  const chars = (b.characters?.length ? b.characters : [{ name: "Narator", role: "Narator utama channel.", style: "Jelas dan antusias", voice: "Kore", look: "" }]).slice(0, 4);
  const newChars = chars.map((c, i) => ({
    id: `${id}-${slug(c.name)}`.slice(0, 60),
    channelId: id,
    name: c.name,
    role: c.role || "",
    style: c.style || "",
    voice: c.voice || "Kore",
    look: c.look || "",
    color: i === 0 ? ch.colors.accent : ch.colors.accent2,
    textColor: ch.colors.bg,
    group: (chars.length === 2 ? "duo" : "lain") as "duo" | "lain",
    look2d: c.lookPreset && LOOK_PRESETS[c.lookPreset] ? (({ label: _l, ...l }) => l)(LOOK_PRESETS[c.lookPreset]) : undefined,
  }));
  saveCharacters([...getCharacters(), ...newChars]);
  const ids = newChars.map((c) => c.id);
  const presets = (b.alur || []).map((pid) => TEMPLATE_LIBRARY.find((t) => t.id === pid)).filter((x): x is NonNullable<typeof x> => !!x);
  if (presets.length) {
    // alur dari wizard: salin dari galeri, peran diisi karakter channel ini
    saveTemplates([...getTemplates(), ...presets.map((pr) => presetToTemplate(pr, id, newChars, `${id}-${pr.id}`))]);
  } else {
    const narr = ids.length >= 2;
    saveTemplates([
      ...getTemplates(),
      {
        id: `${id}-utama`,
        channelId: id,
        name: narr ? "Dialog" : "Narasi",
        description: narr ? `${newChars[0].name} dan ${newChars[1].name} bergantian.` : "Satu narator, kartu visual per scene.",
        minSec: 45,
        maxSec: 60,
        characters: ids,
        scenes: (narr
          ? ["Hook: klaim atau pertanyaan paling menarik", "Jawaban inti", "Pertanyaan lanjutan", "Penjelasan dengan perumpamaan", "Langkah praktis atau dampak", "Penutup dan ajakan komentar"]
          : ["Hook: klaim atau angka paling menarik", "Konteks singkat", "Inti penjelasan", "Contoh nyata", "Penutup dan ajakan komentar"]
        ).map((purpose, i) => ({ speaker: ids[i % ids.length], purpose, seconds: i === 0 ? 5 : 10 })),
        rules: ["Cukup satu part.", "Jangan mengarang angka, kutipan, atau kejadian. Semua fakta harus dari hasil riset."],
      },
    ]);
  }
  startPreviews(ch.id);
  return Response.json(ch);
}
