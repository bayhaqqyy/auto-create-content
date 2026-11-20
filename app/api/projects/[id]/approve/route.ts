import { getProject, updateProject } from "../../../../../lib/store";
import { startJob } from "../../../../../lib/jobs";
export const dynamic = "force-dynamic";

/**
 * target "script": naskah disetujui → buat suara, gambar, dan render video.
 * target "video": video disetujui → siap diunggah (status publikasi "approved").
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProject(id);
  if (!p) return Response.json({ error: "Proyek tidak ditemukan" }, { status: 404 });
  const { target } = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  if (target === "script") {
    if (p.status !== "script_review" && p.status !== "draft") return Response.json({ error: "Naskah tidak sedang menunggu persetujuan." }, { status: 409 });
    if (!p.scenes.length) return Response.json({ error: "Naskah masih kosong." }, { status: 400 });
    const next = updateProject(id, { approvedScriptAt: now, status: "voicing", stage: "Naskah disetujui, membuat suara", progress: 0.05, error: undefined });
    startJob(id, "produce");
    return Response.json(next);
  }
  if (target === "video") {
    if (p.status !== "ready" || !p.video) return Response.json({ error: "Videonya belum jadi." }, { status: 409 });
    return Response.json(updateProject(id, { review: "approved", approvedVideoAt: now, stage: "Video disetujui, siap diunggah" }));
  }
  return Response.json({ error: "Target tidak dikenal" }, { status: 400 });
}
