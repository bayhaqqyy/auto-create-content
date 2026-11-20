import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { channelDir, projectDir, ROOT } from "./store";

export type Step = "all" | "questions" | "script" | "revise" | "produce" | "voice" | "images" | "image" | "render" | "rewrite" | "clip";

/** Jalankan pipeline di proses terpisah; log ditulis ke data/projects/<id>/pipeline.log */
export function startJob(id: string, step: Step, sceneId?: string) {
  const dir = projectDir(id);
  fs.mkdirSync(dir, { recursive: true });
  const log = fs.openSync(path.join(dir, "pipeline.log"), "a");
  const cli = path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs");
  const args = [cli, path.join(ROOT, "scripts", "run-pipeline.ts"), id, step];
  if (sceneId) args.push(sceneId);
  const child = spawn(process.execPath, args, { cwd: ROOT, detached: true, stdio: ["ignore", log, log], env: process.env });
  child.unref();
}

/** Render ulang gambar contoh template satu channel di latar belakang. Kalau sedang jalan, tandai supaya diulang setelah selesai. */
export function startPreviews(channelId: string) {
  const dir = path.join(channelDir(channelId), "previews");
  fs.mkdirSync(dir, { recursive: true });
  const lock = path.join(dir, ".running");
  if (fs.existsSync(lock) && Date.now() - fs.statSync(lock).mtimeMs < 10 * 60_000) {
    fs.writeFileSync(path.join(dir, ".again"), "");
    return;
  }
  fs.writeFileSync(lock, "");
  const log = fs.openSync(path.join(dir, "render.log"), "a");
  const cli = path.join(ROOT, "node_modules", "tsx", "dist", "cli.mjs");
  const child = spawn(process.execPath, [cli, path.join(ROOT, "scripts", "template-previews.ts"), channelId], { cwd: ROOT, detached: true, stdio: ["ignore", log, log], env: process.env });
  child.unref();
}
