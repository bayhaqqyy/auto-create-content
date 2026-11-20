import { getProject, updateProject } from "../../../../../lib/store";
import { startJob } from "../../../../../lib/jobs";
export const dynamic = "force-dynamic";

/** Simpan jawaban perancangan (atau lewati), lalu tulis naskah. Naskah berhenti di status script_review. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProject(id);
  if (!p) return Response.json({ error: "Proyek tidak ditemukan" }, { status: 404 });
  if (p.status !== "brief") return Response.json({ error: "Pertanyaan sudah dijawab." }, { status: 409 });
  const b = await req.json().catch(() => ({}));
  const questions = p.brief?.questions || [];
  const answers: Record<string, string> = {};
  for (const q of questions) {
    const a = String(b.answers?.[q.id] || "").trim().slice(0, 300);
    if (a) answers[q.id] = a;
  }
  const skipped = !!b.skip;
  if (!skipped && questions.length && Object.keys(answers).length < questions.length)
    return Response.json({ error: "Jawab semua pertanyaan dulu, atau pilih lewati." }, { status: 400 });
  const next = updateProject(id, {
    brief: { questions, answers, note: String(b.note || "").trim().slice(0, 600) || undefined, skipped, answeredAt: new Date().toISOString() },
    status: "researching",
    stage: "Menulis naskah sesuai rancangan",
    progress: 0.02,
    error: undefined,
  });
  startJob(id, "script");
  return Response.json(next);
}
