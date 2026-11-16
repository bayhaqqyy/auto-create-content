import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Channel, Character, Product, Project, Template } from "./types";
import { DEFAULT_CHANNELS, DEFAULT_CHARACTERS, DEFAULT_TEMPLATES } from "./defaults";

export const ROOT = process.cwd();
export const DATA = path.join(ROOT, "data");
export const PROJECTS = path.join(DATA, "projects");

function ensure(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, value: unknown) {
  ensure(path.dirname(file));
  const tmp = file + "." + process.pid + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(value, null, 2));
  fs.renameSync(tmp, file);
}

/* ---------- channels, templates & characters ---------- */
export const CHANNELS = path.join(DATA, "channels");

/** Lengkapi channel lama dengan field baru supaya data yang sudah tersimpan tetap jalan. */
function normalizeChannel(c: Partial<Channel>): Channel {
  const base = DEFAULT_CHANNELS.find((d) => d.id === c.id) || DEFAULT_CHANNELS[0];
  return { ...base, ...c, colors: { ...base.colors, ...(c.colors || {}) }, voiceRules: c.voiceRules || base.voiceRules } as Channel;
}
export function getChannels(): Channel[] {
  return readJson<Partial<Channel>[]>(path.join(DATA, "channels.json"), DEFAULT_CHANNELS).map(normalizeChannel);
}
export function saveChannels(list: Channel[]) {
  writeJson(path.join(DATA, "channels.json"), list);
}
export function getChannel(id: string) {
  return getChannels().find((c) => c.id === id);
}
/** Folder aset channel (logo, musik, gambar karakter). */
export function channelDir(id: string) {
  if (!/^[a-z0-9-]{2,64}$/.test(id)) throw new Error("id channel tidak valid");
  const d = path.join(CHANNELS, id);
  ensure(d);
  return d;
}

const defaultChannelOf = (id: string, fallback: string) =>
  DEFAULT_TEMPLATES.find((t) => t.id === id)?.channelId || DEFAULT_CHARACTERS.find((c) => c.id === id)?.channelId || fallback;

export function getTemplates(channelId?: string): Template[] {
  const all = readJson<Template[]>(path.join(DATA, "templates.json"), DEFAULT_TEMPLATES).map((t) => ({ ...t, channelId: t.channelId || defaultChannelOf(t.id, "kodekepo") }))
    // template affiliate format episode sudah diganti alur "Video affiliate"
    .filter((t) => t.kind !== "affiliate");
  return channelId ? all.filter((t) => t.channelId === channelId) : all;
}
export function saveTemplates(list: Template[]) {
  writeJson(path.join(DATA, "templates.json"), list);
}
export function getTemplate(id: string) {
  return getTemplates().find((t) => t.id === id);
}
export function getCharacters(channelId?: string): Character[] {
  const all = readJson<Character[]>(path.join(DATA, "characters.json"), DEFAULT_CHARACTERS).map((c) => {
    const d = DEFAULT_CHARACTERS.find((x) => x.id === c.id);
    return { ...c, channelId: c.channelId || defaultChannelOf(c.id, "kodekepo"), look: c.look ?? d?.look ?? "", group: c.group || "lain" };
  });
  return channelId ? all.filter((c) => c.channelId === channelId) : all;
}
export function saveCharacters(list: Character[]) {
  writeJson(path.join(DATA, "characters.json"), list);
}

export function getProducts(channelId?: string): Product[] {
  const all = readJson<Product[]>(path.join(DATA, "products.json"), []);
  return channelId ? all.filter((p) => p.channelId === channelId) : all;
}
export function saveProducts(list: Product[]) {
  writeJson(path.join(DATA, "products.json"), list);
}

/* ---------- projects ---------- */
export function isSafeId(id: string) {
  return /^[a-z0-9-]{6,64}$/.test(id);
}
export function projectDir(id: string) {
  if (!isSafeId(id)) throw new Error("id proyek tidak valid");
  return path.join(PROJECTS, id);
}
export function newId() {
  return new Date().toISOString().slice(0, 10) + "-" + crypto.randomBytes(3).toString("hex");
}
export function getProject(id: string): Project | null {
  if (!isSafeId(id)) return null;
  const p = readJson<Project | null>(path.join(projectDir(id), "project.json"), null);
  if (p && !p.channelId) p.channelId = getTemplate(p.templateId)?.channelId || "kodekepo";
  return p;
}
export function saveProject(p: Project) {
  p.updatedAt = new Date().toISOString();
  writeJson(path.join(projectDir(p.id), "project.json"), p);
}
export function updateProject(id: string, patch: Partial<Project>) {
  const p = getProject(id);
  if (!p) throw new Error("proyek tidak ditemukan");
  const next = { ...p, ...patch };
  saveProject(next);
  return next;
}
export function listProjects(): Project[] {
  ensure(PROJECTS);
  return fs
    .readdirSync(PROJECTS)
    .filter(isSafeId)
    .map((id) => getProject(id))
    .filter((p): p is Project => !!p)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function deleteProject(id: string) {
  fs.rmSync(projectDir(id), { recursive: true, force: true });
}
/** Resolve file di dalam folder proyek tanpa bisa keluar dari folder itu. */
export function projectFile(id: string, rel: string) {
  const base = projectDir(id);
  const full = path.resolve(base, rel);
  if (!full.startsWith(base + path.sep)) throw new Error("path tidak valid");
  return full;
}
