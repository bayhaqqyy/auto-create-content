import { getTemplate, listProjects, newId, saveProject } from "../../../lib/store";
import { startJob } from "../../../lib/jobs";
import type { Project } from "../../../lib/types";
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ projects: listProjects() });
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const topic = String(b.topic || "").trim();
  const t = getTemplate(String(b.templateId || ""));
  if (!t) return Response.json({ error: "Pilih template dulu." }, { status: 400 });
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
    platform: b.platform || "TikTok",
    durationTarget: Number(b.durationTarget) || t.minSec,
    audience: b.audience || "Gen Z",
    visualStyle: b.visualStyle === "3d" || b.visualStyle === "cards" ? b.visualStyle : "",
    layout: ["kartu", "layar", "teks"].includes(b.layout) ? b.layout : undefined,
    episode: String(b.episode || "").trim().slice(0, 20) || undefined,
    status: "queued",
    stage: "Antre",
    progress: 0,
    scenes: [],
    sources: [],
    review: "draft",
  };
  saveProject(p);
  startJob(p.id, "all");
  return Response.json(p);
}
