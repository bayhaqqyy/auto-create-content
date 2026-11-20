import { getProject, updateProject } from "../../../../../lib/store";
import { startJob } from "../../../../../lib/jobs";
export const dynamic = "force-dynamic";

/**
 * Minta revisi dengan catatan. Naskah ditulis ulang oleh AI lalu kembali menunggu persetujuan;
 * untuk revisi video, video lama tetap ada sampai naskah baru disetujui dan dirender.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProject(id);
  if (!p) return Response.json({ error: "Proyek tidak ditemukan" }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const target = b.target === "video" ? "video" : "script";
  const note = String(b.note || "").trim().slice(0, 1500);
  if (note.length < 3) return Response.json({ error: "Tulis dulu apa yang mau diubah." }, { status: 400 });
  const ok = target === "script" ? p.status === "script_review" || p.status === "draft" : p.status === "ready" || p.status === "draft";
  if (!ok || !p.scenes.length) return Response.json({ error: "Proyek tidak sedang menunggu tinjauan." }, { status: 409 });
  const next = updateProject(id, {
    revisions: [...(p.revisions || []), { at: new Date().toISOString(), target, note }],
    status: "writing",
    stage: "Merevisi naskah sesuai catatan",
    progress: 0.05,
    error: undefined,
    review: target === "video" ? "draft" : p.review,
    approvedVideoAt: target === "video" ? undefined : p.approvedVideoAt,
  });
  startJob(id, "revise");
  return Response.json(next);
}
