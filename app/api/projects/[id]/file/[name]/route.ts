import fs from "node:fs";
import path from "node:path";
import { getProject, projectFile } from "../../../../../../lib/store";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".mp4": "video/mp4", ".mov": "video/quicktime", ".webm": "video/webm", ".wav": "audio/wav", ".srt": "application/x-subrip", ".txt": "text/plain; charset=utf-8" };

export async function GET(req: Request, { params }: { params: Promise<{ id: string; name: string }> }) {
  const { id, name } = await params;
  const p = getProject(id);
  if (!p) return new Response("Tidak ditemukan", { status: 404 });
  const download = new URL(req.url).searchParams.has("download");
  const slug = (p.title || "kodekepo").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // berkas teks yang dibuat langsung dari data proyek
  if (name === "caption.txt" || name === "prompts.txt") {
    const body =
      name === "caption.txt"
        ? `${p.title || ""}\n\n${p.caption || ""}\n\n${(p.hashtags || []).join(" ")}\n`
        : p.scenes.map((s, i) => `Scene ${i + 1} (${s.speaker}): ${s.screenText}\n${s.prompt}\n`).join("\n");
    return new Response(body, { headers: { "Content-Type": TYPES[".txt"], "Content-Disposition": `attachment; filename="${slug}-${name}"` } });
  }
  if (name === "subtitle.srt" && !p.srt) return new Response("Subtitle belum dibuat", { status: 404 });
  if (!/^[\w.-]+$/.test(name)) return new Response("Nama file tidak valid", { status: 400 });
  let full: string;
  try {
    full = projectFile(id, name);
    if (!fs.existsSync(full)) full = projectFile(id, path.join("public", name));
  } catch {
    return new Response("Nama file tidak valid", { status: 400 });
  }
  if (!fs.existsSync(full)) return new Response("Tidak ditemukan", { status: 404 });
  const size = fs.statSync(full).size;
  const type = TYPES[path.extname(full).toLowerCase()] || "application/octet-stream";
  const headers: Record<string, string> = { "Content-Type": type, "Accept-Ranges": "bytes" };
  if (download) headers["Content-Disposition"] = `attachment; filename="${slug}${path.extname(full)}"`;
  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? parseInt(range[1]) : 0;
    const end = range[2] ? Math.min(parseInt(range[2]), size - 1) : size - 1;
    const stream = fs.createReadStream(full, { start, end });
    return new Response(stream as any, { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) } });
  }
  return new Response(fs.createReadStream(full) as any, { headers: { ...headers, "Content-Length": String(size) } });
}
