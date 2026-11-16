import crypto from "node:crypto";
import { getChannel, getProducts, saveProducts } from "../../../lib/store";
import type { Product } from "../../../lib/types";
export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const channel = new URL(req.url).searchParams.get("channel") || undefined;
  return Response.json({ products: getProducts(channel) });
}

export async function POST(req: Request) {
  const { channelId } = await req.json().catch(() => ({}));
  if (!getChannel(channelId)) return Response.json({ error: "Channel tidak ditemukan" }, { status: 400 });
  const p: Product = {
    id: "prd-" + crypto.randomBytes(3).toString("hex"),
    channelId,
    name: "Produk baru",
    brand: "",
    platform: "TikTok Shop",
    link: "",
    price: "",
    category: "",
    facts: [],
    pros: [],
    cons: [],
    tried: false,
    photos: [],
    notes: "",
  };
  saveProducts([...getProducts(), p]);
  return Response.json(p);
}
