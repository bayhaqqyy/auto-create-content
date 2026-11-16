import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { projectDir, ROOT } from "./store";

export type Step = "all" | "script" | "voice" | "images" | "image" | "render" | "rewrite" | "clip";

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
