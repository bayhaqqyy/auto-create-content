import { getCharacters, getTemplates, saveTemplates } from "../../../lib/store";
import crypto from "node:crypto";
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const channel = new URL(req.url).searchParams.get("channel") || undefined;
  return Response.json({ templates: getTemplates(channel), characters: getCharacters(channel) });
}

export async function POST(req: Request) {
  const { channelId } = await req.json().catch(() => ({}));
  const chars = getCharacters(channelId);
  if (!channelId || !chars.length) return Response.json({ error: "Pilih channel yang sudah punya karakter." }, { status: 400 });
  const list = getTemplates();
  const t = {
    id: "tpl-" + crypto.randomBytes(3).toString("hex"),
    channelId,
    name: "Template baru",
    description: "",
    minSec: 60,
    maxSec: 75,
    characters: [chars[0].id],
    scenes: [{ speaker: chars[0].id, purpose: "Hook: klaim atau pertanyaan paling menarik", seconds: 5 }],
    rules: [],
  };
  saveTemplates([...list, t]);
  return Response.json(t);
}
