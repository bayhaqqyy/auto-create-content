import { getCharacters } from "../../../../../lib/store";
import { hasApiKey, tts } from "../../../../../lib/gemini";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { voice } = await req.json().catch(() => ({}));
  const c = getCharacters().find((x) => x.id === id);
  if (!c) return Response.json({ error: "Karakter tidak ditemukan" }, { status: 404 });
  if (!hasApiKey()) return Response.json({ error: "Contoh suara butuh GEMINI_API_KEY di file .env.local" }, { status: 400 });
  try {
    const wav = await tts(`Halo, gue ${c.name}. Kepo dulu, paham kemudian.`, voice || c.voice, `Bahasa Indonesia, ${c.style}`);
    return new Response(new Uint8Array(wav), { headers: { "Content-Type": "audio/wav" } });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}
