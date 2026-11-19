/**
 * Naskah dan riset lewat Claude Code headless (`claude -p`), memakai login Claude kamu sendiri.
 * Auth: CLAUDE_CODE_OAUTH_TOKEN (dari `claude setup-token`) atau login yang sudah ada di ~/.claude.
 * Gemini tetap dipakai untuk suara (TTS) dan gambar/klip 3D, lihat lib/gemini.ts.
 */
import { execFile, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { RefImage } from "./gemini";

const bin = () => process.env.CLAUDE_BIN || "claude";
const model = () => process.env.CLAUDE_MODEL || "opus";

let available: boolean | undefined;
/** true kalau CLI Claude terpasang dan sudah login; kalau tidak, naskah memakai mode demo. */
export function hasTextAI() {
  if (process.env.CLAUDE_DISABLED === "1") return false;
  const loggedIn =
    !!process.env.CLAUDE_CODE_OAUTH_TOKEN || !!process.env.ANTHROPIC_API_KEY || fs.existsSync(path.join(os.homedir(), ".claude", ".credentials.json"));
  if (!loggedIn) return false;
  if (available === undefined) {
    try {
      execFileSync(bin(), ["--version"], { stdio: "ignore", timeout: 15000 });
      available = true;
    } catch {
      available = false;
    }
  }
  return available;
}

type Opts = { tools?: string[]; addDir?: string; timeoutMs?: number };

async function ask<T>(prompt: string, schema: object, opts: Opts = {}): Promise<T> {
  const tools = opts.tools || [];
  const args = [
    "-p",
    prompt,
    "--model",
    model(),
    "--output-format",
    "json",
    "--json-schema",
    JSON.stringify(schema),
    // jangan bawa hook, plugin, MCP, atau CLAUDE.md dari mesin ini
    "--setting-sources",
    "",
    "--strict-mcp-config",
    "--tools",
    tools.join(","),
  ];
  if (tools.length) args.push("--allowedTools", ...tools);
  if (opts.addDir) args.push("--add-dir", opts.addDir);
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "claude-"));
  try {
    const out = await new Promise<string>((resolve, reject) => {
      execFile(bin(), args, { cwd, timeout: opts.timeoutMs || 600_000, maxBuffer: 32 * 1024 * 1024 }, (err, stdout, stderr) => {
        if (err && !stdout) return reject(new Error(`Claude gagal: ${String(stderr || err.message).slice(0, 400)}`));
        resolve(stdout);
      });
    });
    let res: any;
    try {
      res = JSON.parse(out);
    } catch {
      throw new Error(`Claude membalas bukan JSON: ${out.slice(0, 300)}`);
    }
    if (res.is_error || res.subtype !== "success") throw new Error(`Claude gagal: ${String(res.result || res.subtype).slice(0, 400)}`);
    if (res.structured_output) return res.structured_output as T;
    return JSON.parse(String(res.result || "").replace(/^```json\s*|```$/g, "")) as T;
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

const RESEARCH_SCHEMA = {
  type: "object",
  properties: {
    facts: { type: "array", items: { type: "string" } },
    sources: {
      type: "array",
      items: { type: "object", properties: { title: { type: "string" }, url: { type: "string" } }, required: ["title", "url"] },
    },
  },
  required: ["facts", "sources"],
};

export async function research(topic: string) {
  const r = await ask<{ facts: string[]; sources: { title: string; url: string }[] }>(
    `Riset faktual untuk video edukasi teknologi berbahasa Indonesia tentang: "${topic}".\n` +
      `Pakai WebSearch (dan WebFetch bila perlu) untuk mencari sumber. Tulis 5-8 poin fakta singkat yang bisa diverifikasi, masing-masing satu kalimat, sebutkan sumber dan tanggalnya kalau ada. ` +
      `Utamakan sumber resmi (pemerintah, bank, vendor, lembaga riset, media kredibel). Jangan menebak angka. ` +
      `sources hanya berisi URL asli yang benar-benar muncul di hasil pencarian. Kalau tidak menemukan sumber, kembalikan array kosong.`,
    RESEARCH_SCHEMA,
    { tools: ["WebSearch", "WebFetch"] },
  );
  const facts = (r.facts || []).map((f) => String(f).trim()).filter((f) => f.length > 20);
  const sources = (r.sources || []).filter((s) => /^https?:\/\//.test(String(s?.url)));
  return { facts, sources };
}

/** JSON terstruktur sesuai schema. Gambar (mis. foto produk) disimpan sementara lalu dibaca Claude dengan tool Read. */
export async function generateJson<T>(prompt: string, schema: object, images: RefImage[] = []): Promise<T> {
  if (!images.length) return ask<T>(prompt, schema);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "claude-img-"));
  try {
    const files = images.slice(0, 4).map((r, i) => {
      const f = path.join(dir, `foto-${i + 1}.${r.mime.split("/")[1] || "jpg"}`);
      fs.writeFileSync(f, r.data);
      return f;
    });
    return await ask<T>(`Lihat dulu foto berikut dengan tool Read:\n${files.join("\n")}\n\n${prompt}`, schema, { tools: ["Read"], addDir: dir });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
