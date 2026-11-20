import { startPreviews } from "../../../lib/jobs";
import { getCharacters, getTemplates, saveTemplates } from "../../../lib/store";
import { LAYOUTS, TEMPLATE_LIBRARY, presetToTemplate } from "../../../lib/defaults";
import crypto from "node:crypto";
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const channel = new URL(req.url).searchParams.get("channel") || undefined;
  return Response.json({ templates: getTemplates(channel), characters: getCharacters(channel), library: TEMPLATE_LIBRARY, layouts: LAYOUTS });
}

/** Buat template baru di channel: kosong, atau salinan preset galeri (`presetId`). */
export async function POST(req: Request) {
  const { channelId, presetId } = await req.json().catch(() => ({}));
  const chars = getCharacters(channelId);
  if (!channelId || !chars.length) return Response.json({ error: "Pilih channel yang sudah punya karakter." }, { status: 400 });
  const list = getTemplates();
  const id = "tpl-" + crypto.randomBytes(3).toString("hex");
  let t;
  if (presetId) {
    const preset = TEMPLATE_LIBRARY.find((p) => p.id === presetId);
    if (!preset) return Response.json({ error: "Preset tidak ditemukan." }, { status: 404 });
    if (preset.scenes.some((s) => s.speaker !== "utama") && chars.length < 2) {
      return Response.json({ error: "Preset ini butuh dua karakter. Tambahkan karakter dulu di menu Karakter & suara." }, { status: 400 });
    }
    t = presetToTemplate(preset, channelId, chars, id);
  } else {
    t = {
      id,
      channelId,
      name: "Template baru",
      description: "",
      minSec: 60,
      maxSec: 75,
      characters: [chars[0].id],
      scenes: [{ speaker: chars[0].id, purpose: "Hook: klaim atau pertanyaan paling menarik", seconds: 5 }],
      rules: [],
    };
  }
  saveTemplates([...list, t]);
  startPreviews(channelId);
  return Response.json(t);
}
