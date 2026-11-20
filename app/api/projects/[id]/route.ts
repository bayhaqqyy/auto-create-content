import fs from "node:fs";
import path from "node:path";
import { deleteProject, getChannel, getProducts, getProject, getTemplate, listProjects, projectDir, saveProject } from "../../../../lib/store";
import { adChecks, runChecks } from "../../../../lib/policy";
import type { Project } from "../../../../lib/types";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const BUSY = ["queued", "asking", "researching", "writing", "voicing", "imaging", "rendering"];

export async function GET(_: Request, { params }: Ctx) {
  const { id } = await params;
  const p = getProject(id);
  return p ? Response.json(p) : Response.json({ error: "Proyek tidak ditemukan" }, { status: 404 });
}

/** Simpan suntingan. Scene yang teksnya berubah kehilangan suaranya supaya dibuat ulang saat render. */
export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const p = getProject(id);
  if (!p) return Response.json({ error: "Proyek tidak ditemukan" }, { status: 404 });
  if (BUSY.includes(p.status)) return Response.json({ error: "Proyek sedang diproses, tunggu sampai selesai." }, { status: 409 });
  const b = (await req.json()) as Partial<Project>;
  const allowed: (keyof Project)[] = ["title", "titleOptions", "caption", "hashtags", "coverText", "coverKeyword", "sources", "views", "review", "episode", "voice", "vibe", "ambient"];
  const next: Project = { ...p };
  for (const k of allowed) if (k in b) (next as any)[k] = (b as any)[k];
  if (Array.isArray(b.scenes)) {
    let changed = false;
    next.scenes = b.scenes.map((s) => {
      const old = p.scenes.find((o) => o.id === s.id);
      if (old && (old.text !== s.text || old.speaker !== s.speaker)) {
        changed = true;
        if (old.audio) fs.rmSync(path.join(projectDir(id), "public", old.audio), { force: true });
        return { ...s, audio: undefined, durationSec: undefined };
      }
      if (old && JSON.stringify(old) !== JSON.stringify(s)) changed = true;
      return { ...s, audio: old?.audio, durationSec: old?.durationSec, image: s.image === "" ? undefined : old?.image };
    });
    if (changed && next.status === "ready") {
      next.status = "draft";
      next.stage = "Naskah diubah, render ulang untuk memperbarui video";
    }
  }
  if (next.kind !== "affiliate") next.checks = runChecks(next, getTemplate(next.templateId), getChannel(next.channelId));
  else {
    const prods = (next.productIds || []).map((id) => getProducts().find((x) => x.id === id)).filter((x): x is NonNullable<typeof x> => !!x);
    const week = Date.now() - 7 * 86400000;
    const recent = listProjects().filter((x) => x.kind === "affiliate" && x.channelId === next.channelId && new Date(x.createdAt).getTime() > week).length;
    next.checks = adChecks(next, prods[0], recent);
  }
  saveProject(next);
  return Response.json(next);
}

export async function DELETE(_: Request, { params }: Ctx) {
  const { id } = await params;
  if (!getProject(id)) return Response.json({ error: "Proyek tidak ditemukan" }, { status: 404 });
  deleteProject(id);
  return Response.json({ ok: true });
}
