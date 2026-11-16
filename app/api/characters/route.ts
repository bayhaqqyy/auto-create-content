import { getCharacters, saveCharacters } from "../../../lib/store";
import { GEMINI_VOICES } from "../../../lib/defaults";
import type { Character } from "../../../lib/types";
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const channel = new URL(req.url).searchParams.get("channel") || undefined;
  return Response.json({ characters: getCharacters(channel), voices: GEMINI_VOICES });
}

/** Simpan semua karakter satu channel (karakter channel lain tidak disentuh). */
export async function PUT(req: Request) {
  const { channelId, characters } = (await req.json()) as { channelId: string; characters: Character[] };
  if (!channelId) return Response.json({ error: "Channel tidak diketahui" }, { status: 400 });
  if (!Array.isArray(characters) || characters.some((c) => !c.id || !c.name?.trim() || !c.voice?.trim())) {
    return Response.json({ error: "Setiap karakter perlu nama dan voice" }, { status: 400 });
  }
  const rest = getCharacters().filter((c) => c.channelId !== channelId);
  const mine = characters.map((c) => ({ ...c, channelId }));
  saveCharacters([...rest, ...mine]);
  return Response.json({ characters: mine });
}
