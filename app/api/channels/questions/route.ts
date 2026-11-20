import { generateJson, hasTextAI } from "../../../../lib/claude";
import { cleanQuestions } from "../../../../lib/brief";
import { chQuestionsPrompt, CH_QUESTIONS_SCHEMA, demoChannelQuestions, guessLayout, styleQuestion } from "../../../../lib/channelWizard";
import { LAYOUTS } from "../../../../lib/defaults";
import type { Layout } from "../../../../lib/types";
export const dynamic = "force-dynamic";

/** Langkah pertama wizard channel: pertanyaan dari AI berdasarkan deskripsi channel. */
export async function POST(req: Request) {
  const { description } = await req.json().catch(() => ({}));
  const desc = String(description || "").trim();
  if (desc.length < 10) return Response.json({ error: "Ceritakan dulu channel-nya tentang apa (minimal satu kalimat)." }, { status: 400 });
  if (!hasTextAI()) return Response.json({ questions: demoChannelQuestions(desc), demo: true });
  try {
    const r = await generateJson<{ recommendedLayout: string; questions: any[] }>(chQuestionsPrompt(desc), CH_QUESTIONS_SCHEMA);
    const qs = cleanQuestions(r.questions).slice(0, 5);
    const rec = (LAYOUTS.some((l) => l.id === r.recommendedLayout) ? r.recommendedLayout : guessLayout(desc)) as Layout;
    if (qs.length < 2) return Response.json({ questions: demoChannelQuestions(desc), demo: true });
    return Response.json({ questions: [...qs, styleQuestion(rec)] });
  } catch (e) {
    console.error(e);
    return Response.json({ questions: demoChannelQuestions(desc), demo: true });
  }
}
