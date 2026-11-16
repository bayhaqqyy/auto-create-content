import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { getProject, projectDir, saveProject } from "../../../../../lib/store";
export const dynamic = "force-dynamic";

const MAX = 200 * 1024 * 1024;

/** Upload klip milik sendiri (mis. hasil Google Flow) untuk satu scene. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProject(id);
  if (!p) return Response.json({ error: "Proyek tidak ditemukan" }, { status: 404 });
  const form = await req.formData();
  const sceneId = String(form.get("sceneId") || "");
  const file = form.get("file");
  const scene = p.scenes.find((s) => s.id === sceneId);
  if (!scene) return Response.json({ error: "Scene tidak ditemukan" }, { status: 400 });
  if (!(file instanceof File)) return Response.json({ error: "Pilih file video dulu" }, { status: 400 });
  const isImage = /\.(png|jpe?g|webp)$/i.test(file.name);
  if (!isImage && !/\.(mp4|mov|webm)$/i.test(file.name)) return Response.json({ error: "Format harus gambar (PNG, JPG, WEBP) atau video (MP4, MOV, WEBM)" }, { status: 400 });
  if (file.size > MAX) return Response.json({ error: "Ukuran klip maksimal 200 MB" }, { status: 400 });
  const dir = path.join(projectDir(id), "public");
  fs.mkdirSync(dir, { recursive: true });
  const name = `${isImage ? "img" : "clip"}-${scene.id}-${Date.now().toString(36)}${path.extname(file.name).toLowerCase()}`;
  fs.writeFileSync(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  if (isImage) {
    if (scene.image) fs.rmSync(path.join(dir, scene.image), { force: true });
    scene.image = name;
  } else {
    if (scene.visual.clip) fs.rmSync(path.join(dir, scene.visual.clip), { force: true });
    scene.visual = { ...scene.visual, kind: "clip", clip: name };
    try {
      scene.clipSec = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(dir, name)]).toString().trim()) || undefined;
    } catch {
      scene.clipSec = undefined;
    }
  }
  if (p.status === "ready") {
    p.status = "draft";
    p.stage = (isImage ? "Gambar" : "Klip") + " ditambahkan, render ulang untuk memperbarui video";
  }
  saveProject(p);
  return Response.json(p);
}
