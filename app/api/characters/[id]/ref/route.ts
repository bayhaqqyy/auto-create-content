import fs from "node:fs";
import path from "node:path";
import { channelDir, getChannel, getCharacters, saveCharacters } from "../../../../../lib/store";
import { hasApiKey, image } from "../../../../../lib/gemini";
export const dynamic = "force-dynamic";

/**
 * Gambar referensi karakter: upload sendiri (multipart "file") atau buat dengan AI (JSON {generate:true}).
 * Gambar ini dikirim ke setiap pembuatan gambar scene supaya wujud karakter konsisten.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const all = getCharacters();
  const c = all.find((x) => x.id === id);
  if (!c) return Response.json({ error: "Karakter tidak ditemukan" }, { status: 404 });
  const dir = path.join(channelDir(c.channelId), "chars");
  fs.mkdirSync(dir, { recursive: true });
  let buf: Buffer;
  let ext = ".png";
  if ((req.headers.get("content-type") || "").includes("multipart/form-data")) {
    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) return Response.json({ error: "Pilih gambar dulu" }, { status: 400 });
    ext = path.extname(file.name).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) return Response.json({ error: "Gambar harus PNG, JPG, atau WEBP" }, { status: 400 });
    buf = Buffer.from(await file.arrayBuffer());
  } else {
    if (!hasApiKey()) return Response.json({ error: "Membuat gambar karakter butuh GEMINI_API_KEY. Kamu bisa upload gambar sendiri." }, { status: 400 });
    if (!c.look.trim()) return Response.json({ error: "Isi dulu deskripsi tampilan karakter." }, { status: 400 });
    const ch = getChannel(c.channelId);
    try {
      buf = await image(
        `Character reference sheet, full body front view, plain light grey background, ${ch?.imageStyle || "stylized 3D animated film style"}. The character: ${c.look}. Neutral friendly pose. No text, letters or logos.`,
        [],
        "1:1",
      );
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 502 });
    }
    ext = buf.subarray(1, 4).toString() === "PNG" ? ".png" : ".jpg";
  }
  const name = `chars/${c.id}-${Date.now().toString(36)}${ext}`;
  fs.writeFileSync(path.join(channelDir(c.channelId), name), buf);
  if (c.refImage) fs.rmSync(path.join(channelDir(c.channelId), c.refImage), { force: true });
  c.refImage = name;
  saveCharacters(all);
  return Response.json(c);
}
