import fs from "node:fs";
import path from "node:path";
import { channelDir } from "../../../../../../lib/store";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4" };

export async function GET(_: Request, { params }: { params: Promise<{ id: string; name: string }> }) {
  const { id, name: raw } = await params;
  // "chars~nama.png" = file di subfolder chars/
  const name = raw.replace(/^(chars|products)~/, "$1/");
  if (!/^((chars|products)\/)?[\w.-]+$/.test(name)) return new Response("Nama file tidak valid", { status: 400 });
  let full: string;
  try {
    full = path.join(channelDir(id), name);
  } catch {
    return new Response("Tidak ditemukan", { status: 404 });
  }
  if (!fs.existsSync(full)) return new Response("Tidak ditemukan", { status: 404 });
  return new Response(fs.readFileSync(full), { headers: { "Content-Type": TYPES[path.extname(full).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" } });
}
