import { getTemplate, getTemplates, listProjects, newId, saveProject } from "../../../lib/store";
import { startJob } from "../../../lib/jobs";
import type { Project } from "../../../lib/types";
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ projects: listProjects() });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const topic = String(b.topic || "").trim();
  // alur dipilih otomatis dari alur milik channel kalau templateId "auto"
  const auto = !b.templateId || b.templateId === "auto";
  const t = auto ? getTemplates().find((x) => x.channelId === b.channelId && x.id !== "product-ad") : getTemplate(String(b.templateId));
  if (!t) return Response.json({ error: auto ? "Channel ini belum punya alur. Tambahkan alur dulu." : "Alur tidak ditemukan." }, { status: 400 });
  if (topic.length < 10) return Response.json({ error: "Tulis topik minimal satu kalimat (10 karakter)." }, { status: 400 });
  const now = new Date().toISOString();
  const p: Project = {
    id: newId(),
    channelId: t.channelId,
    kind: "edu",
    createdAt: now,
    updatedAt: now,
    topic,
    templateId: t.id,
    autoTemplate: auto || undefined,
    platform: b.platform || "TikTok",
    durationTarget: Number(b.durationTarget) || t.minSec,
    audience: b.audience || "Gen Z",
    visualStyle: b.visualStyle === "3d" || b.visualStyle === "cards" ? b.visualStyle : "",
    layout: ["kartu", "layar", "teks", "horor", "stickman", "motivasi"].includes(b.layout) ? b.layout : undefined,
    episode: String(b.episode || "").trim().slice(0, 20) || undefined,
    // langsung tulis naskah hanya kalau pembuat memilih melewati pertanyaan
    status: b.skipBrief ? "queued" : "asking",
    stage: b.skipBrief ? "Antre" : "Menyiapkan pertanyaan perancangan",
    progress: 0,
    scenes: [],
    sources: [],
    review: "draft",
  };
  if (b.skipBrief) p.brief = { questions: [], skipped: true };
  saveProject(p);
  startJob(p.id, b.skipBrief ? "script" : "questions");
  return Response.json(p);
}
