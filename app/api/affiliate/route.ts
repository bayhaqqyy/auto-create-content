import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { channelDir, getChannel, getProducts, listProjects, newId, saveProducts, saveProject } from "../../../lib/store";
import { startJob } from "../../../lib/jobs";
import { fetchLinkInfo, platformOf } from "../../../lib/linkinfo";
import { AD_TEMPLATE_ID, VIBES } from "../../../lib/adscript";
import { GEMINI_VOICES } from "../../../lib/defaults";
import type { Product, Project } from "../../../lib/types";
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const channel = new URL(req.url).searchParams.get("channel");
  const projects = listProjects().filter((p) => p.templateId === AD_TEMPLATE_ID && (!channel || p.channelId === channel));
  return Response.json({ projects });
}

const EXT: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

/** Buat produk + proyek video affiliate dari foto upload dan/atau link toko, lalu jalankan pipeline. */
export async function POST(req: Request) {
  const form = await req.formData();
  const channelId = String(form.get("channelId") || "");
  if (!getChannel(channelId)) return Response.json({ error: "Pilih channel dulu." }, { status: 400 });
  const link = String(form.get("link") || "").trim();
  if (link && !/^https:\/\//i.test(link)) return Response.json({ error: "Link harus diawali https://" }, { status: 400 });
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 3);
  for (const f of files) {
    if (!EXT[f.type]) return Response.json({ error: `${f.name}: foto harus JPG, PNG, atau WEBP.` }, { status: 400 });
    if (f.size > 15 * 1024 * 1024) return Response.json({ error: `${f.name}: ukuran foto maksimal 15 MB.` }, { status: 400 });
  }

  const id = "prd-" + crypto.randomBytes(3).toString("hex");
  const dir = path.join(channelDir(channelId), "products");
  fs.mkdirSync(dir, { recursive: true });
  const photos: string[] = [];
  for (const f of files) {
    const name = `products/${id}-${photos.length}${EXT[f.type]}`;
    fs.writeFileSync(path.join(channelDir(channelId), name), Buffer.from(await f.arrayBuffer()));
    photos.push(name);
  }

  let name = String(form.get("name") || "").trim();
  let price = String(form.get("price") || "").trim();
  const facts: string[] = [];
  let note = "";
  if (link) {
    try {
      const info = await fetchLinkInfo(link);
      name ||= info.title;
      price ||= info.price;
      if (info.description) facts.push(info.description);
      if (!photos.length && info.image) {
        const r = await fetch(info.image, { signal: AbortSignal.timeout(12000) });
        const type = (r.headers.get("content-type") || "").split(";")[0];
        if (r.ok && EXT[type]) {
          const n = `products/${id}-0${EXT[type]}`;
          fs.writeFileSync(path.join(channelDir(channelId), n), Buffer.from(await r.arrayBuffer()));
          photos.push(n);
        }
      }
    } catch (e: any) {
      note = /fetch failed|abort|timeout/i.test(String(e?.message)) ? "halaman tidak bisa dibuka" : String(e?.message || e);
    }
  }
  if (!photos.length) {
    return Response.json(
      { error: link ? `Foto produk tidak bisa diambil dari link${note ? ` (${note})` : ""}. Upload 1–3 foto produknya, link tetap disimpan untuk keranjang.` : "Upload minimal 1 foto produk atau tempel link toko." },
      { status: 400 },
    );
  }

  const product: Product = {
    id,
    channelId,
    name: name.slice(0, 120) || "Produk baru",
    brand: "",
    platform: link ? platformOf(link) : "TikTok Shop",
    link,
    price: price.slice(0, 40),
    priceCheckedAt: price ? new Date().toISOString().slice(0, 10) : undefined,
    category: "",
    facts,
    pros: [],
    cons: [],
    tried: form.get("tried") === "1",
    photos,
    notes: String(form.get("notes") || "").trim().slice(0, 500),
  };
  saveProducts([...getProducts(), product]);

  const voice = String(form.get("voice") || "Leda");
  const vibe = String(form.get("vibe") || "santai");
  const now = new Date().toISOString();
  const p: Project = {
    id: newId(),
    channelId,
    kind: "affiliate",
    productIds: [id],
    voice: GEMINI_VOICES.includes(voice) ? voice : "Leda",
    vibe: vibe in VIBES ? vibe : "santai",
    adStyle: form.get("style") === "harian" ? "harian" : "review",
    ambient: form.get("ambient") === "1",
    createdAt: now,
    updatedAt: now,
    topic: product.name,
    templateId: AD_TEMPLATE_ID,
    platform: "TikTok",
    durationTarget: [15, 25, 35].includes(Number(form.get("duration"))) ? Number(form.get("duration")) : 25,
    audience: "Umum",
    visualStyle: "",
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
