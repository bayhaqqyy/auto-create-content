import { startPreviews } from "../../../../lib/jobs";
import fs from "node:fs";
import { CHANNELS, getChannels, getCharacters, getTemplates, listProjects, saveChannels, saveCharacters, saveTemplates } from "../../../../lib/store";
import type { Channel } from "../../../../lib/types";
import path from "node:path";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const { id } = await params;
  const c = getChannels().find((x) => x.id === id);
  return c ? Response.json(c) : Response.json({ error: "Channel tidak ditemukan" }, { status: 404 });
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const b = (await req.json()) as Channel;
  if (!b.name?.trim()) return Response.json({ error: "Nama channel wajib diisi" }, { status: 400 });
  const hex = /^#[0-9a-fA-F]{6}$/;
  if (Object.values(b.colors || {}).some((c) => !hex.test(String(c)))) return Response.json({ error: "Warna harus format #RRGGBB" }, { status: 400 });
  const list = getChannels();
  const i = list.findIndex((c) => c.id === id);
  if (i < 0) return Response.json({ error: "Channel tidak ditemukan" }, { status: 404 });
  list[i] = { ...b, id, logo: list[i].logo, bgm: list[i].bgm, bgmVolume: Math.max(0, Math.min(0.5, Number(b.bgmVolume) || 0)) };
  saveChannels(list);
  startPreviews(id);
  return Response.json(list[i]);
}

export async function DELETE(_: Request, { params }: Ctx) {
  const { id } = await params;
  const list = getChannels();
  if (list.length <= 1) return Response.json({ error: "Minimal harus ada satu channel." }, { status: 409 });
  if (listProjects().some((p) => p.channelId === id)) return Response.json({ error: "Channel masih punya proyek. Hapus proyeknya dulu." }, { status: 409 });
  saveChannels(list.filter((c) => c.id !== id));
  saveCharacters(getCharacters().filter((c) => c.channelId !== id));
  saveTemplates(getTemplates().filter((t) => t.channelId !== id));
  fs.rmSync(path.join(CHANNELS, id), { recursive: true, force: true });
  return Response.json({ ok: true });
}
