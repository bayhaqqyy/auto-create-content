import fs from "node:fs";
import path from "node:path";
import { channelDir, getChannels, saveChannels } from "../../../../../lib/store";
export const dynamic = "force-dynamic";

/** Upload logo (png/jpg/webp) atau musik latar (mp3/wav/m4a) milik channel. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = getChannels();
  const ch = list.find((c) => c.id === id);
  if (!ch) return Response.json({ error: "Channel tidak ditemukan" }, { status: 404 });
  const form = await req.formData();
  const kind = String(form.get("kind"));
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Pilih file dulu" }, { status: 400 });
  const ext = path.extname(file.name).toLowerCase();
  const ok = kind === "logo" ? [".png", ".jpg", ".jpeg", ".webp"] : kind === "bgm" ? [".mp3", ".wav", ".m4a"] : [];
  if (!ok.includes(ext)) return Response.json({ error: kind === "logo" ? "Logo harus PNG, JPG, atau WEBP" : "Musik harus MP3, WAV, atau M4A" }, { status: 400 });
  if (file.size > 30 * 1024 * 1024) return Response.json({ error: "Ukuran maksimal 30 MB" }, { status: 400 });
  const dir = channelDir(id);
  const name = `${kind}-${Date.now().toString(36)}${ext}`;
  fs.writeFileSync(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  const old = kind === "logo" ? ch.logo : ch.bgm;
  if (old) fs.rmSync(path.join(dir, old), { force: true });
  if (kind === "logo") ch.logo = name;
  else ch.bgm = name;
  saveChannels(list);
  return Response.json(ch);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kind = new URL(req.url).searchParams.get("kind");
  const list = getChannels();
  const ch = list.find((c) => c.id === id);
  if (!ch) return Response.json({ error: "Channel tidak ditemukan" }, { status: 404 });
  const old = kind === "logo" ? ch.logo : ch.bgm;
  if (old) fs.rmSync(path.join(channelDir(id), old), { force: true });
  if (kind === "logo") ch.logo = undefined;
  else ch.bgm = undefined;
  saveChannels(list);
  return Response.json(ch);
}
