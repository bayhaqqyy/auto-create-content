import { getProject, updateProject } from "../../../../../lib/store";
import { startJob, type Step } from "../../../../../lib/jobs";
export const dynamic = "force-dynamic";

const BUSY = ["queued", "asking", "researching", "writing", "voicing", "imaging", "rendering"];
const STEPS: Step[] = ["all", "questions", "script", "voice", "images", "image", "render", "rewrite", "clip"];
const LABEL: Record<Step, string> = { all: "Memulai ulang", questions: "Menyiapkan pertanyaan", revise: "Merevisi naskah", produce: "Membuat video", script: "Menulis ulang naskah", voice: "Membuat suara", images: "Membuat gambar 3D", image: "Membuat gambar scene", render: "Menyiapkan render", rewrite: "Menulis ulang scene", clip: "Membuat klip AI" };

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getProject(id);
  if (!p) return Response.json({ error: "Proyek tidak ditemukan" }, { status: 404 });
  if (BUSY.includes(p.status)) return Response.json({ error: "Proyek sedang diproses." }, { status: 409 });
  const { step, sceneId } = await req.json().catch(() => ({}));
  if (!STEPS.includes(step)) return Response.json({ error: "Langkah tidak dikenal" }, { status: 400 });
  if ((step === "rewrite" || step === "image" || step === "clip" || (step === "voice" && sceneId)) && !p.scenes.some((s) => s.id === sceneId)) {
    return Response.json({ error: "Scene tidak ditemukan" }, { status: 400 });
  }
  const status = step === "questions" ? "asking" : step === "render" ? "rendering" : step === "voice" ? "voicing" : step === "images" || step === "image" || step === "clip" ? "imaging" : step === "all" ? "queued" : "writing";
  const next = updateProject(id, { status, stage: LABEL[step as Step], progress: 0.02, error: undefined });
  startJob(id, step, sceneId);
  return Response.json(next);
}
