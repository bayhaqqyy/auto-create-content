import { getTemplates, saveTemplates, listProjects } from "../../../../lib/store";
import type { Template } from "../../../../lib/types";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const { id } = await params;
  const t = getTemplates().find((x) => x.id === id);
  return t ? Response.json(t) : Response.json({ error: "Template tidak ditemukan" }, { status: 404 });
}

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const body = (await req.json()) as Template;
  if (!body.name?.trim()) return Response.json({ error: "Nama template wajib diisi" }, { status: 400 });
  if (!body.scenes?.length) return Response.json({ error: "Minimal satu scene" }, { status: 400 });
  if (!(body.minSec > 0 && body.maxSec >= body.minSec)) return Response.json({ error: "Durasi maksimal harus lebih besar atau sama dengan minimal" }, { status: 400 });
  const list = getTemplates();
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) return Response.json({ error: "Template tidak ditemukan" }, { status: 404 });
  list[i] = { ...body, id, channelId: list[i].channelId };
  saveTemplates(list);
  return Response.json(list[i]);
}

export async function DELETE(_: Request, { params }: Ctx) {
  const { id } = await params;
  if (listProjects().some((p) => p.templateId === id)) return Response.json({ error: "Template masih dipakai proyek" }, { status: 409 });
  saveTemplates(getTemplates().filter((x) => x.id !== id));
  return Response.json({ ok: true });
}
