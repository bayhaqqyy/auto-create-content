import type { Product, Project, Scene } from "./types";

/**
 * Naskah video affiliate: produk ditunjukkan dipakai di kehidupan sehari-hari.
 * Bukan format episode. Satu narator, adegan cepat, ajakan beli di akhir.
 */
const lc = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

export const AD_TEMPLATE_ID = "product-ad";

export const VIBES: Record<string, string> = {
  santai: "santai seperti teman yang cerita barang favoritnya, hangat dan meyakinkan",
  ceria: "ceria dan semangat, tempo cepat, cocok untuk barang rumah tangga dan gaya hidup",
  elegan: "tenang dan rapi, kesan premium, kalimat pendek",
};

export type AdResult = {
  productName: string;
  category: string;
  title: string;
  titleOptions: string[];
  hook: string;
  scenes: { text: string; screenText: string; videoPrompt: string }[];
  caption: string;
  hashtags: string[];
};

export const AD_SCHEMA = {
  type: "object",
  properties: {
    productName: { type: "string", description: "nama produk singkat dan generik dari foto/data, tanpa klaim" },
    category: { type: "string" },
    title: { type: "string" },
    titleOptions: { type: "array", items: { type: "string" } },
    hook: { type: "string", description: "teks besar di detik pertama, maks 6 kata, memancing penasaran" },
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string", description: "kalimat voice over adegan ini, bahasa Indonesia lisan" },
          screenText: { type: "string", description: "teks singkat di layar, maks 5 kata" },
          videoPrompt: { type: "string", description: "prompt klip video dalam bahasa Inggris" },
        },
        required: ["text", "screenText", "videoPrompt"],
      },
    },
    caption: { type: "string" },
    hashtags: { type: "array", items: { type: "string" } },
  },
  required: ["productName", "category", "title", "titleOptions", "hook", "scenes", "caption", "hashtags"],
};

export function sceneCount(sec: number, style: Project["adStyle"] = "harian") {
  if (style === "review") return sec <= 18 ? 4 : sec <= 28 ? 6 : 8;
  return sec <= 18 ? 3 : sec <= 28 ? 4 : 5;
}

const REVIEW_STRUCTURE = (n: number) => `STRUKTUR REVIEW HANDS-ON (${n} adegan pendek, potongan cepat 3-5 detik):
1. Hook: kalimat menantang yang bikin penonton merasa barang mereka kurang, pola seperti "Jangan harap [barang] kalian bisa kayak gini kalau masih pakai [versi biasa]". Visual: produk/kotaknya diletakkan di meja.
2. Unboxing: tangan membuka kotak/kemasan, produk dikeluarkan.
3. Adegan tengah: SATU fitur per adegan, ditunjukkan langsung oleh tangan (close-up detail, dipasang, dilipat, ditekan, dipakai). Voice over menjelaskan fitur yang SEDANG terlihat.
4. Satu adegan hasil: produk terpasang dan dipakai, terlihat keren/rapi.
5. Penutup: ajakan "cek keranjang kuning" yang santai. JANGAN bilang stok tinggal sedikit, harga mau naik, atau promo berakhir kecuali ada di catatan pengguna (itu urgensi palsu).`;

const DAILY_STRUCTURE = (n: number, sec: number) => `STRUKTUR (${n} adegan, total ±${sec} detik):
1. Adegan 1 = hook: momen masalah sehari-hari yang relatable (mis. lemari berantakan pagi-pagi mau kerja), lalu produk muncul.
2. Adegan tengah = produk dipakai di situasi nyata yang berbeda-beda, tiap adegan menonjolkan SATU kegunaan yang terlihat jelas.
3. Adegan terakhir = hasil akhir yang bikin pengen + ajakan: "cek keranjang kuning" (jangan "link di bio").`;

export function buildAdPrompt(p: Project, x: Product, linkInfo: string) {
  const review = p.adStyle === "review";
  const n = sceneCount(p.durationTarget, p.adStyle);
  const vibe = VIBES[p.vibe || "santai"] || VIBES.santai;
  return `Kamu kreator konten affiliate TikTok Indonesia. Gambar yang dilampirkan adalah foto produk yang mau dipromosikan.

TUGAS: ${review
    ? `buat video review hands-on ${p.durationTarget} detik gaya TikTok affiliate: kamera POV melihat tangan kreator membuka, menunjukkan, dan mencoba produk di atas meja, sambil voice over menjelaskan fiturnya.`
    : `buat video jualan ${p.durationTarget} detik yang menunjukkan produk ini DIPAKAI dalam kehidupan sehari-hari di Indonesia, sampai penonton kepikiran "gue butuh ini".`}

DATA PRODUK (hanya ini dan yang terlihat di foto yang boleh dipakai sebagai fakta):
- Nama dari pengguna: ${x.name && x.name !== "Produk baru" ? x.name : "(belum diisi, tebak nama generik dari foto)"}
- Harga: ${x.price || "(jangan sebut harga)"}
- Fitur/catatan dari pengguna: ${x.notes || "-"}
- Sudah dicoba sendiri oleh kreator: ${x.tried ? "ya" : "BELUM. Jangan pernah bilang 'udah gue pakai' atau pengalaman pribadi jangka panjang"}
${linkInfo ? `- Info dari halaman toko: ${linkInfo}` : ""}

${review ? REVIEW_STRUCTURE(n) : DAILY_STRUCTURE(n, p.durationTarget)}

ATURAN VOICE OVER:
- Nuansa: ${vibe}. Bahasa lisan Indonesia sehari-hari${review ? ' menyapa penonton dengan "kalian", partikel natural seperti "nih", "ya", "tuh"' : ' (boleh "kamu")'}, ${review ? "1 kalimat" : "1-2 kalimat"} per adegan, 2,2-3 kata per detik.
- Fokus ke manfaat yang TERLIHAT di adegan, bukan spesifikasi yang tidak diketahui.
- Dilarang: klaim mutlak (dijamin, 100%, pasti), "termurah", "terlaris", "nomor 1", "original", klaim kesehatan, membandingkan merek lain, testimoni palsu, menyebut harga kalau harga kosong.
- Jangan menyebut nama merek kalau tidak terlihat jelas di foto atau diberikan pengguna.

ATURAN videoPrompt (bahasa Inggris, satu klip per adegan):
${review
    ? `- Satu shot kontinu ±4 detik, vertikal 9:16, first-person POV looking down at a table, only the creator's hands visible (no face), handheld phone camera, natural light. Gaya unboxing/review TikTok yang nyata, BUKAN iklan TV.
- Setting konsisten di semua adegan: meja yang sama (mis. meja marmer abu di kafe mal atau meja kerja kayu), supaya terasa satu sesi rekaman.`
    : `- Satu shot kontinu ±6 detik, vertikal 9:16, gaya UGC TikTok yang terasa nyata (handheld ringan, cahaya natural), BUKAN iklan TV.
- Setting rumah/kos/kantor/jalanan Indonesia yang wajar sesuai produk. Orang dewasa Asia Tenggara, wajah boleh terlihat tapi jangan selebriti.`}
- Produk HARUS persis seperti di foto referensi dan menjadi pusat perhatian; jelaskan aksi tangan yang memakai produk.
- Tulis: "No dialogue. No on-screen text. No music." di akhir setiap prompt.

caption: kalimat pertama berisi kata kunci produk (untuk pencarian TikTok), lalu manfaat utama, catatan pilih varian kalau ada, tutup dengan ajakan "Cek keranjang kuning". JANGAN menyebut komisi dan JANGAN menyebut harga. hashtags: 3-5 hashtag umum yang relevan (tanpa #fyp spam).
Balas JSON sesuai skema.`;
}

const CLAIMS = /\b(dijamin|100\s?%|pasti|termurah|terlaris|nomor 1|no\.? ?1|original|best ?seller)\b/gi;
/** urgensi palsu yang sering dipakai video affiliate */
export const FAKE_URGENCY = /(stok(nya)? (tinggal|tersisa) (dikit|sedikit)|sebelum kehabisan|harga(nya)? (mau|bakal|jadi) naik|promo(nya)? (mau )?(habis|berakhir))/i;

export function sanitizeAd(r: AdResult, p: Project, x: Product): AdResult {
  const n = sceneCount(p.durationTarget, p.adStyle);
  const scenes = (r.scenes || []).slice(0, n + 1).map((s) => ({
    text: String(s.text || "").replace(CLAIMS, "").replace(/\s{2,}/g, " ").trim(),
    screenText: String(s.screenText || "").slice(0, 40),
    videoPrompt: String(s.videoPrompt || "").trim(),
  })).filter((s) => s.text);
  if (!scenes.length) throw new Error("Naskah dari AI kosong. Coba buat ulang.");
  if (!x.tried) scenes.forEach((s) => (s.text = s.text.replace(/\b(udah|sudah) (gue|aku|saya) (coba|pakai|pake)\b/gi, "")));
  const tags = (r.hashtags || []).map((h) => "#" + String(h).replace(/^#+/, "").replace(/\s+/g, "")).filter((h) => h.length > 1).slice(0, 5);
  return { ...r, scenes, hashtags: tags, hook: String(r.hook || "").slice(0, 60) };
}

export function adScenes(r: AdResult): Scene[] {
  return r.scenes.map((s, i) => ({
    id: `s${i + 1}`,
    speaker: "narator",
    text: s.text,
    screenText: s.screenText,
    keyword: "",
    visual: { kind: "clip", items: [] },
    prompt: s.videoPrompt,
  }));
}

/** Naskah contoh untuk mode demo (tanpa API key). Netral supaya cocok untuk produk apa pun. */
export function demoAd(p: Project, x: Product): AdResult {
  const name = x.name && x.name !== "Produk baru" ? x.name : "barang ini";
  if (p.adStyle === "review") {
    const feats = x.notes.split(/[,\n]/).map((f) => f.trim()).filter(Boolean);
    const pov = (a: string) => `First-person POV looking down at a grey marble cafe table, only the creator's hands visible, handheld phone camera, natural light. ${a} The product must match the reference image exactly. No dialogue. No on-screen text. No music.`;
    const mid = (feats.length ? feats : ["detailnya rapi", "gampang dipakai"]).slice(0, Math.max(2, sceneCount(p.durationTarget, "review") - 3));
    const scenes = [
      { text: `Jangan harap setup kalian bisa kayak gini kalau belum pakai ${name} ini.`, screenText: "Unboxing dulu", videoPrompt: pov("Hands place the product box on the table and slide it toward the camera.") },
      { text: "Kita buka dulu ya, isinya langsung kelihatan rapi nih.", screenText: "Isi kotaknya", videoPrompt: pov("Hands open the box lid and lift the product out.") },
      ...mid.map((f) => ({ text: `Yang aku suka, ${lc(f)}, langsung kelihatan kan?`, screenText: f.slice(0, 28), videoPrompt: pov(`Close-up as hands demonstrate this feature of the product: ${f}.`) })),
      { text: `Penasaran? Cek keranjang kuning ya, detail dan harganya ada di sana.`, screenText: "Cek keranjang kuning", videoPrompt: pov("Hands use the product fully set up, then give a small satisfied tap on the table.") },
    ];
    return {
      productName: name,
      category: x.category || "",
      title: `Review ${name}`,
      titleOptions: [`Review ${name}`, "Upgrade kecil yang kerasa banget", "Unboxing + coba langsung"],
      hook: "Jangan pakai yang biasa lagi",
      scenes,
      caption: `Unboxing dan coba langsung ${name}. Cek keranjang kuning ya!`,
      hashtags: ["#review", "#unboxing", "#racuntiktok"],
    };
  }
  const scenes = [
    { text: `Pagi-pagi udah ribet? Coba lihat ${name} ini.`, screenText: "Pagi-pagi ribet?", videoPrompt: `A person in a small Indonesian bedroom in the morning, slightly messy, then picks up the product from the reference image. Handheld vertical UGC shot, natural window light. No dialogue. No on-screen text. No music.` },
    { text: `Dipakainya gampang, tinggal taruh dan langsung kepake tiap hari.`, screenText: "Gampang dipakai", videoPrompt: `Close-up of hands using the product from the reference image in an everyday home setting in Indonesia, single continuous shot, soft natural light. No dialogue. No on-screen text. No music.` },
    { text: `Ruangan jadi lebih rapi dan enak dilihat.`, screenText: "Lebih rapi", videoPrompt: `Slow handheld pan revealing a tidy, cozy room with the product from the reference image in use, warm afternoon light. No dialogue. No on-screen text. No music.` },
    { text: `Penasaran? Cek keranjang kuning, lihat detail dan harganya di sana.`, screenText: "Cek keranjang kuning", videoPrompt: `A satisfied person glancing at the product from the reference image, then at their phone, cozy Indonesian home. No dialogue. No on-screen text. No music.` },
  ].slice(0, Math.max(3, sceneCount(p.durationTarget)));
  return {
    productName: name,
    category: x.category || "",
    title: `${name} buat sehari-hari`,
    titleOptions: [`${name} buat sehari-hari`, "Barang kecil, hidup lebih rapi", "Kenapa nggak dari dulu"],
    hook: "Kenapa nggak dari dulu?",
    scenes,
    caption: `Biar sehari-hari lebih praktis. Cek keranjang kuning ya!`,
    hashtags: ["#racuntiktok", "#rekomendasi", "#barangrumah"],
  };
}
