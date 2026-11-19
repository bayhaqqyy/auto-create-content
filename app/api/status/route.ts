import { hasApiKey } from "../../../lib/gemini";
import { hasTextAI } from "../../../lib/claude";
export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ demo: !hasTextAI(), voice: hasApiKey() });
}
