import { generateJson, hasTextAI } from "../../../../lib/claude";
import { GEMINI_VOICES } from "../../../../lib/defaults";
export const dynamic = "force-dynamic";

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    headerText: { type: "string" },
    tagline: { type: "string" },
    niche: { type: "string" },
    audience: { type: "string" },
    voiceRules: { type: "array", items: { type: "string" } },
    outroTeaser: { type: "string" },
    outroFollow: { type: "string" },
    hashtagNote: { type: "string" },
    imageStyle: { type: "string" },
    visualMode: { type: "string", enum: ["cards", "3d"] },
    colors: {
      type: "object",
      properties: { bg: { type: "string" }, card: { type: "string" }, accent: { type: "string" }, accent2: { type: "string" }, text: { type: "string" }, muted: { type: "string" }, outroBg: { type: "string" }, outroText: { type: "string" } },
      required: ["bg", "card", "accent", "accent2", "text", "muted", "outroBg", "outroText"],
    },
    characters: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, role: { type: "string" }, style: { type: "string" }, voice: { type: "string", enum: GEMINI_VOICES }, look: { type: "string" } },
        required: ["name", "role", "style", "voice", "look"],
      },
    },
  },
  required: ["name", "headerText", "tagline", "niche", "audience", "voiceRules", "outroTeaser", "outroFollow", "hashtagNote", "imageStyle", "visualMode", "colors", "characters"],
};

/** Usulan brand kit untuk channel baru dari deskripsi singkat. Hasilnya diedit dulu sebelum disimpan. */
export async function POST(req: Request) {
  const { description } = await req.json().catch(() => ({}));
  if (!String(description || "").trim()) return Response.json({ error: "Tulis dulu channel-nya tentang apa." }, { status: 400 });
  if (!hasTextAI()) return Response.json({ error: "Saran AI butuh Claude CLI. Isi brand kit secara manual dulu." }, { status: 400 });
  try {
    const kit = await generateJson(
      `Rancang brand kit untuk channel video pendek (TikTok/Reels/Shorts) berbahasa Indonesia dari deskripsi ini:\n"${description}"\n\n` +
        `Aturan: nama singkat dan mudah diingat; headerText huruf kapital; tagline maksimal 5 kata dengan koma di tengah; voiceRules 3-4 aturan gaya bahasa termasuk hook di detik pertama; ` +
        `warna hex #RRGGBB dengan kontras teks minimal 4.5:1 terhadap bg dan card; visualMode "cards" untuk konten edukasi/info, "3d" untuk cerita/anak; ` +
        `imageStyle dalam bahasa Inggris; 1-2 karakter dengan voice dari daftar yang tersedia dan look dalam bahasa Inggris. Jangan meniru brand lain yang sudah ada.`,
      SCHEMA,
    );
    return Response.json(kit);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
