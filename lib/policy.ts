import type { Channel, CheckItem, Product, Project, Template } from "./types";

/** Kata yang perlu dicek manual sebelum tayang (aturan TikTok + pengalaman takedown sebelumnya). */
const RISKY: [RegExp, string][] = [
  [/\b(judol|judi|slot|gacor|togel|maxwin|deposit)\b/i, "menyebut judi online"],
  [/\b(bobol|hack(ing)?|retas|exploit|crack|carding|phishing kit|payload|bypass)\b/i, "bisa terbaca sebagai cara meretas"],
  [/\b(pinjol ilegal|jual akun|jual data|data bocor gratis)\b/i, "menyebut jual-beli data/akun"],
  [/\b(bunuh|senjata|narkoba)\b/i, "topik sensitif"],
];

export function runChecks(p: Project, t: Template | undefined, ch?: Channel): CheckItem[] {
  const out: CheckItem[] = [];
  const total = p.scenes.reduce((n, s) => n + (s.durationSec || 0), 0);
  if (t) {
    if (total > 0) {
      const ok = total >= t.minSec && total <= t.maxSec;
      out.push({ ok, text: `Durasi ${Math.round(total)} detik, ${ok ? "masuk" : "di luar"} target ${t.minSec}–${t.maxSec} detik.` });
    }
    const allowed = new Set(t.characters);
    const wrong = p.scenes.filter((s) => !allowed.has(s.speaker));
    out.push(
      wrong.length
        ? { ok: false, text: `${wrong.length} scene memakai karakter di luar template.` }
        : { ok: true, text: "Suara tiap karakter konsisten sampai penutup." },
    );
  }
  const all = [p.title, ...p.scenes.map((s) => s.text + " " + s.screenText), p.caption].join(" ");
  if (/\b(part|bagian)\s*2\b|bersambung/i.test(all)) out.push({ ok: false, text: "Ada \"part 2\" atau \"bersambung\". Cukup satu part." });
  else out.push({ ok: true, text: "Satu part, tanpa \"part 2\"." });
  p.scenes.forEach((s, i) => {
    for (const [re, why] of RISKY) {
      const m = (s.text + " " + s.screenText).match(re);
      if (m) out.push({ ok: false, text: `Scene ${i + 1} memuat "${m[0]}", ${why}. Pastikan hanya edukasi pencegahan.` });
    }
  });
  const banned = [...(ch?.hashtagNote || "").matchAll(/jangan pakai\s+(#[\p{L}\p{N}_]+)/giu)].map((m) => m[1].toLowerCase());
  for (const b of banned) if ((p.hashtags || []).some((h) => h.toLowerCase() === b)) out.push({ ok: false, text: `Hapus ${b} dari hashtag sesuai aturan channel.` });
  const unverified = p.sources.filter((s) => !s.verified).length;
  if (!p.sources.length) out.push({ ok: false, text: "Belum ada sumber. Fakta di naskah belum bisa dicek." });
  else if (unverified) out.push({ ok: false, text: `${unverified} dari ${p.sources.length} sumber belum kamu tandai terverifikasi.` });
  else out.push({ ok: true, text: `${p.sources.length} sumber sudah terverifikasi.` });
  return out;
}

/** Klaim yang sering bermasalah di konten affiliate (menyesatkan atau butuh bukti). */
const AFF_CLAIMS: [RegExp, string][] = [
  [/\b(termurah|paling murah|harga terendah)\b/i, "klaim harga termurah butuh bukti dan cepat berubah"],
  [/\b(dijamin|100\s?%|pasti (berhasil|ampuh)|anti gagal)\b/i, "klaim mutlak"],
  [/\b(menyembuhkan|sembuh|obat|aman untuk semua|tanpa efek samping|bpom)\b/i, "klaim kesehatan/keamanan perlu izin dan bukti"],
  [/\b(terlaris|best ?seller|nomor 1|no\.? ?1)\b/i, "klaim peringkat butuh sumber"],
  [/\b(original|ori|asli 100)\b/i, "klaim keaslian butuh bukti dari toko resmi"],
];
const RESTRICTED = /(obat|suplemen|herbal|pelangsing|diet|kosmetik|skincare|pinjol|pinjaman|investasi|kripto|crypto|trading|rokok|vape|alkohol|senjata)/i;


/** Pemeriksaan untuk video affiliate (produk dipakai sehari-hari). */
export function adChecks(p: Project, x: Product | undefined, recentCount: number): CheckItem[] {
  const out: CheckItem[] = [];
  const all = [p.title, p.coverText, ...p.scenes.map((s) => s.text + " " + s.screenText), p.caption].join(" ");
  for (const [re, why] of AFF_CLAIMS) {
    const m = all.match(re);
    if (m) out.push({ ok: false, text: `Ada kata "${m[0]}": ${why}.` });
  }
  const urgent = all.match(/(stok(nya)? (tinggal|tersisa) (dikit|sedikit)|sebelum kehabisan|harga(nya)? (mau|bakal|jadi) naik|promo(nya)? (mau )?(habis|berakhir))/i);
  if (urgent) out.push({ ok: false, text: `Ada "${urgent[0]}". Pakai hanya kalau memang benar saat tayang; urgensi palsu termasuk iklan menyesatkan.` });
  if (!out.length) out.push({ ok: true, text: "Tidak ada klaim mutlak, harga termurah, urgensi palsu, atau klaim kesehatan." });
  if (x) {
    if (!x.tried && /\b(udah|sudah) (gue|aku|saya) (coba|pakai|pake)|gue pake sendiri|aku pakai sendiri/i.test(all))
      out.push({ ok: false, text: "Produk belum kamu coba, tapi naskah terdengar seperti sudah memakai." });
    if (RESTRICTED.test(`${x.category} ${x.name}`)) out.push({ ok: false, text: `Kategori ${x.category || x.name} termasuk yang dibatasi TikTok. Cek aturan kategori sebelum tayang.` });
    if (!x.price && /\brp\s?\d|ribu|\d+\s?rb\b/i.test(all)) out.push({ ok: false, text: "Naskah menyebut harga padahal harga belum diisi. Hapus atau isi harga yang benar." });
    if (x.price && x.priceCheckedAt) {
      const days = (Date.now() - new Date(x.priceCheckedAt).getTime()) / 86400000;
      if (days > 3) out.push({ ok: false, text: `Harga terakhir dicek ${Math.floor(days)} hari lalu. Cek lagi sebelum tayang.` });
    }
    if (!x.link) out.push({ ok: false, text: "Link affiliate belum diisi. Tambahkan supaya bisa disalin saat upload." });
  }
  const clips = p.scenes.filter((s) => s.visual.clip).length;
  out.push(
    clips === p.scenes.length
      ? { ok: true, text: "Semua adegan punya klip video." }
      : { ok: false, text: `${p.scenes.length - clips} adegan belum punya klip, masih memakai foto produk.` },
  );
  out.push({ ok: false, text: "Tonton tiap klip: pastikan produk di video sama persis dengan aslinya (warna, ukuran, bentuk). AI bisa salah menggambar detail." });
  if (recentCount >= 5) out.push({ ok: false, text: `Sudah ${recentCount} video affiliate dalam 7 hari. TikTok Shop bisa membatasi kreator yang memposting 5+ video produk non-interaktif dalam 7 hari.` });
  else out.push({ ok: true, text: `${recentCount} video affiliate dalam 7 hari terakhir (batas aman di bawah 5).` });
  return out;
}

/** Checklist saat upload, ditampilkan terpisah dari pemeriksaan otomatis. */
export const AFFILIATE_UPLOAD = [
  "Nyalakan \"Disclose commercial content\" saat upload (konten affiliate wajib).",
  "Nyalakan label \"AI-generated\" karena video dan suaranya dibuat AI.",
  "Tautkan produk yang sama dengan yang dibahas di video.",
  "Cek harga dan stok di keranjang sekali lagi sebelum posting.",
];
