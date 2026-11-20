import { generateJson, hasTextAI } from "../../../../lib/claude";
import { demoKit, guessLayout, KIT_SCHEMA, kitPrompt, layoutFromAnswer, STYLE_Q_ID, type QA } from "../../../../lib/channelWizard";
import { TEMPLATE_LIBRARY } from "../../../../lib/defaults";
import { LOOK_PRESETS } from "../../../../lib/anim";
import type { BriefQuestion } from "../../../../lib/types";
export const dynamic = "force-dynamic";

/** Usulan brand kit dari deskripsi + jawaban pertanyaan wizard. Hasilnya ditinjau dulu sebelum disimpan. */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const description = String(b.description || "").trim();
  if (!description) return Response.json({ error: "Tulis dulu channel-nya tentang apa." }, { status: 400 });
  const questions: BriefQuestion[] = Array.isArray(b.questions) ? b.questions : [];
  const answers: Record<string, string> = b.answers || {};
  const name = String(b.name || "").trim();
  const layout = layoutFromAnswer(answers[STYLE_Q_ID] || "") || guessLayout(description);
  const qa: QA[] = questions.filter((q) => q.id !== STYLE_Q_ID && answers[q.id]).map((q) => ({ question: q.question, answer: answers[q.id] }));
  let kit: any;
  if (!hasTextAI()) kit = { ...demoKit(description, answers, name, layout), demo: true };
  else {
    try {
      kit = await generateJson(kitPrompt(description, qa, String(b.note || ""), name, layout), KIT_SCHEMA());
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 502 });
    }
  }
  if (name) kit.name = name;
  kit.layout = layout;
  kit.visualMode = "cards";
  kit.alur = (kit.alur || []).filter((id: string) => TEMPLATE_LIBRARY.some((t) => t.id === id)).slice(0, 3);
  if (!kit.alur.length) kit.alur = [layout === "horor" ? "horor-kartun" : layout === "motivasi" ? "motivasi-siluet" : layout === "stickman" ? "stickman-mitos" : TEMPLATE_LIBRARY[0].id];
  kit.characters = (kit.characters || []).slice(0, 3).map((c: any) => ({ ...c, lookPreset: LOOK_PRESETS[c.lookPreset] ? c.lookPreset : "pemuda" }));
  return Response.json(kit);
}
