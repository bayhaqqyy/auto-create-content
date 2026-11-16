/**
 * Ambil info dasar dari halaman produk (judul, foto, harga, deskripsi) lewat meta tag Open Graph / JSON-LD.
 * Banyak toko (TikTok Shop, Shopee) menolak permintaan server atau merender lewat JavaScript,
 * jadi hasilnya best-effort: kalau kosong, pengguna tinggal upload foto sendiri.
 */
export type LinkInfo = { title: string; image: string; price: string; description: string; platform: "TikTok Shop" | "Shopee" | "Tokopedia" | "Lainnya" };

export function platformOf(url: string): LinkInfo["platform"] {
  if (/tiktok\.com|tokopedia\.com\/.*tiktok|shop\.tiktok/i.test(url)) return /tokopedia/i.test(url) ? "Tokopedia" : "TikTok Shop";
  if (/shopee\./i.test(url)) return "Shopee";
  if (/tokopedia\./i.test(url)) return "Tokopedia";
  return "Lainnya";
}

const meta = (html: string, key: string) => {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, "i");
  const m = html.match(re);
  return decode((m?.[1] || m?.[2] || "").trim());
};
const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));

export async function fetchLinkInfo(url: string): Promise<LinkInfo> {
  const info: LinkInfo = { title: "", image: "", price: "", description: "", platform: platformOf(url) };
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36",
      "Accept-Language": "id-ID,id;q=0.9",
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Halaman toko menolak dibaca (${res.status}).`);
  info.platform = platformOf(res.url || url);
  const html = (await res.text()).slice(0, 2_000_000);
  info.title = meta(html, "og:title") || decode(html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || "");
  info.image = meta(html, "og:image") || meta(html, "twitter:image");
  info.description = (meta(html, "og:description") || meta(html, "description")).slice(0, 400);
  const amount = meta(html, "product:price:amount") || meta(html, "og:price:amount");
  if (amount) info.price = "Rp" + Number(amount.replace(/[^\d.]/g, "")).toLocaleString("id-ID");
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const j = JSON.parse(m[1]);
      const items = Array.isArray(j) ? j : [j, ...(j["@graph"] || [])];
      const prod = items.find((x: any) => /product/i.test(String(x?.["@type"])));
      if (!prod) continue;
      info.title ||= String(prod.name || "");
      info.image ||= String(Array.isArray(prod.image) ? prod.image[0] : prod.image || "");
      info.description ||= String(prod.description || "").slice(0, 400);
      const offer = Array.isArray(prod.offers) ? prod.offers[0] : prod.offers;
      const price = offer?.price || offer?.lowPrice;
      if (price && !info.price) info.price = "Rp" + Number(price).toLocaleString("id-ID");
    } catch {}
  }
  info.title = info.title.replace(/\s*[|\-–]\s*(Shopee|Tokopedia|TikTok)[^|]*$/i, "").trim();
  return info;
}
