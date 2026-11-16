import fs from "node:fs";
import path from "node:path";
import { channelDir, getProducts, listProjects, saveProducts } from "../../../../lib/store";
import type { Product } from "../../../../lib/types";
export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  const b = (await req.json()) as Product;
  if (!b.name?.trim()) return Response.json({ error: "Nama produk wajib diisi" }, { status: 400 });
  if (b.link && !/^https:\/\//i.test(b.link)) return Response.json({ error: "Link harus diawali https://" }, { status: 400 });
  const list = getProducts();
  const i = list.findIndex((p) => p.id === id);
  if (i < 0) return Response.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  const clean = (a: string[]) => (a || []).map((x) => x.trim()).filter(Boolean).slice(0, 12);
  const priceChanged = (b.price || "") !== (list[i].price || "");
  list[i] = {
    ...b,
    id,
    channelId: list[i].channelId,
    photos: list[i].photos,
    facts: clean(b.facts),
    pros: clean(b.pros),
    cons: clean(b.cons),
    priceCheckedAt: priceChanged && b.price ? new Date().toISOString().slice(0, 10) : list[i].priceCheckedAt,
  };
  saveProducts(list);
  return Response.json(list[i]);
}

export async function DELETE(_: Request, { params }: Ctx) {
  const { id } = await params;
  if (listProjects().some((p) => p.productIds?.includes(id) && p.review !== "tayang"))
    return Response.json({ error: "Produk masih dipakai proyek yang belum tayang." }, { status: 409 });
  const list = getProducts();
  const p = list.find((x) => x.id === id);
  if (!p) return Response.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  for (const f of p.photos) fs.rmSync(path.join(channelDir(p.channelId), f), { force: true });
  saveProducts(list.filter((x) => x.id !== id));
  return Response.json({ ok: true });
}
