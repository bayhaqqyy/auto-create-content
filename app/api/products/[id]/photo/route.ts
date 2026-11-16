import fs from "node:fs";
import path from "node:path";
import { channelDir, getProducts, saveProducts } from "../../../../../lib/store";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/** Foto/screenshot produk milik sendiri. Dipakai apa adanya di kartu produk, tidak digambar ulang AI. */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const list = getProducts();
  const p = list.find((x) => x.id === id);
  if (!p) return Response.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return Response.json({ error: "Pilih foto dulu" }, { status: 400 });
  const ext = path.extname(file.name).toLowerCase();
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) return Response.json({ error: "Foto harus PNG, JPG, atau WEBP" }, { status: 400 });
  if (file.size > 15 * 1024 * 1024) return Response.json({ error: "Ukuran foto maksimal 15 MB" }, { status: 400 });
  if (p.photos.length >= 6) return Response.json({ error: "Maksimal 6 foto per produk" }, { status: 400 });
  const dir = path.join(channelDir(p.channelId), "products");
  fs.mkdirSync(dir, { recursive: true });
  const name = `products/${p.id}-${Date.now().toString(36)}${ext}`;
  fs.writeFileSync(path.join(channelDir(p.channelId), name), Buffer.from(await file.arrayBuffer()));
  p.photos.push(name);
  saveProducts(list);
  return Response.json(p);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { id } = await params;
  const name = new URL(req.url).searchParams.get("name") || "";
  const list = getProducts();
  const p = list.find((x) => x.id === id);
  if (!p || !p.photos.includes(name)) return Response.json({ error: "Foto tidak ditemukan" }, { status: 404 });
  fs.rmSync(path.join(channelDir(p.channelId), name), { force: true });
  p.photos = p.photos.filter((x) => x !== name);
  saveProducts(list);
  return Response.json(p);
}
