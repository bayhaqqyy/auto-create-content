import { hasApiKey } from "../../../lib/gemini";
export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ demo: !hasApiKey() });
}
