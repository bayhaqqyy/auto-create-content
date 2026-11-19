/**
 * Gambar contoh hasil video untuk tiap template: satu frame dirender dari engine video yang sama, isi naskah contoh.
 *   npx tsx scripts/template-previews.ts [channelId]
 * Hasil: data/channels/<channelId>/previews/<templateId>.jpg
 */
import fs from "node:fs";
import path from "node:path";
import { channelDir, getChannels, getCharacters, getTemplates, ROOT } from "../lib/store";
import type { Channel, Scene, Template } from "../lib/types";

type Sample = Omit<Scene, "id" | "speaker" | "prompt"> & { slot?: number };

// Satu scene khas per template bawaan; template lain memakai contoh menurut jumlah tokohnya.
const SAMPLES: Record<string, Sample> = {
  "serial-dialog": { slot: 0, tag: "MODUSNYA", text: "Ada kurir minta kode OTP, katanya buat konfirmasi paket.", screenText: "KURIR MINTA|KODE OTP?", keyword: "OTP", visual: { kind: "chat", items: ["Kurir: Kak, paketnya udah di depan. Kodenya berapa ya?", "Kamu: Kode apa ya kak?", "Kurir: Yang barusan masuk SMS kak"], icon: "package" } },
  "explainer-data": { slot: 0, tag: "FAKTANYA", text: "Ratusan ribu laporan penipuan online masuk tiap tahun.", screenText: "LAPORAN|PENIPUAN ONLINE", keyword: "penipuan", visual: { kind: "number", items: ["120.000+ laporan", "penipuan online dalam setahun"], icon: "chart" } },
  "tips-kode": { slot: 1, tag: "TRIK #1", text: "Ketik bintang pagar enam nol pagar buat lihat nomor IMEI HP lo.", screenText: "CEK IMEI|DALAM 2 DETIK", keyword: "IMEI", visual: { kind: "steps", items: ["Buka aplikasi Telepon", "Ketik *#06#", "Nomor IMEI langsung muncul"], icon: "smartphone" } },
  listicle: { slot: 1, tag: "NOMOR 5", text: "Nomor lima: link undangan pernikahan yang ternyata file APK.", screenText: "UNDANGAN|BERISI APK", keyword: "APK", visual: { kind: "notification", items: ["WhatsApp", "Tante Rina", "Undangan Pernikahan.apk"], icon: "chat" } },
  "motion-graphic": { slot: 3, tag: "CARA KERJA", text: "Sistem nggak bisa bedain lo yang asli dengan orang yang pegang kodenya.", screenText: "SISTEM NGIRA|DIA ITU LO", keyword: "sistem", visual: { kind: "compare", items: ["Lo yang asli", "Orang yang pegang OTP"], icon: "users" } },
  "micro-drama": { slot: 2, tag: "EPISODE 3", text: "Malam itu, telepon dari nomor tak dikenal masuk ke HP Ayah.", screenText: "NOMOR|TAK DIKENAL", keyword: "nomor", visual: { kind: "call", items: ["Nomor tidak dikenal", "memanggil…"], icon: "phone" } },
  "anak-kepi": { slot: 2, tag: "CARA KERJA", text: "Waktu dicolok, listrik mengalir lewat kabel, lalu baterainya terisi lagi.", screenText: "COLOK,|LALU TERISI", keyword: "terisi", visual: { kind: "steps", items: ["Colok ke charger", "Listrik lewat kabel", "Baterai terisi"], icon: "plug" } },
  // preset galeri
  "cek-sekarang": { slot: 2, tag: "CARA NYALAIN", text: "Buka Setelan, Notifikasi, terus cari Riwayat notifikasi.", screenText: "RIWAYAT|NOTIFIKASI", keyword: "Riwayat", visual: { kind: "steps", items: ["Buka Setelan", "Pilih Notifikasi", "Nyalakan Riwayat notifikasi"], icon: "settings" } },
  "arti-tanda": { slot: 3, tag: "LAMPU 2", text: "Normalnya lampu LOS mati. Kalau merah, sinyal kabel optik hilang.", screenText: "LOS MERAH?|SINYAL OPTIK ILANG", keyword: "merah", visual: { kind: "compare", items: ["Mati = normal", "Merah = sinyal optik hilang"], icon: "wifi" } },
  "berita-cepat": { slot: 0, tag: "BARU TERJADI", text: "Ratusan ribu laporan gangguan masuk dalam beberapa jam.", screenText: "LAYANAN|TUMBANG GLOBAL", keyword: "tumbang", visual: { kind: "number", items: ["130.000+", "laporan gangguan dalam beberapa jam"], icon: "alert" } },
  "mitos-fakta": { slot: 2, tag: "FAKTANYA", text: "HP sekarang berhenti mengisi otomatis saat baterai penuh.", screenText: "NGECAS SEMALAMAN|NGGAK MASALAH", keyword: "semalaman", visual: { kind: "compare", items: ["Mitos: baterai rusak", "Fakta: pengisian berhenti otomatis"], icon: "battery" } },
  "top-3": { slot: 1, tag: "NOMOR 3", text: "Nomor tiga: lo bisa kunci chat tertentu pakai sidik jari.", screenText: "KUNCI CHAT|PAKAI SIDIK JARI", keyword: "kunci", visual: { kind: "statement", items: [], icon: "lock" } },
  "pov-cerita": { slot: 1, tag: "POV", text: "Chat masuk dari nomor yang namanya mirip bank lo.", screenText: "POV: CHAT|DARI \"BANK\"", keyword: "bank", visual: { kind: "chat", items: ["Bank: Akun Anda diblokir. Klik link berikut.", "Kamu: Hah? Kok bisa?"], icon: "chat" } },
};
const DIALOG = SAMPLES["serial-dialog"];
const SOLO = SAMPLES["motion-graphic"];

function sampleFor(t: Template): Sample {
  if (SAMPLES[t.id]) return SAMPLES[t.id];
  if (t.preset === "tanya-jawab") return DIALOG;
  if (t.preset && SAMPLES[t.preset]) return SAMPLES[t.preset];
  return new Set(t.scenes.map((s) => s.speaker)).size > 1 ? { ...DIALOG, slot: 0 } : { ...SOLO, slot: 1 };
}

function cuesOf(text: string, sec: number) {
  const words = text.split(/\s+/);
  const out: { start: number; end: number; text: string }[] = [];
  for (let i = 0; i < words.length; i += 4) {
    const a = (i / words.length) * sec, b = (Math.min(i + 4, words.length) / words.length) * sec;
    out.push({ start: a, end: b, text: words.slice(i, i + 4).join(" ") });
  }
  return out;
}

async function main() {
  const only = process.argv[2];
  const channels = getChannels().filter((c) => !only || c.id === only);
  const { bundle } = await import("@remotion/bundler");
  const { renderStill, selectComposition } = await import("@remotion/renderer");
  const browserExecutable = process.env.REMOTION_BROWSER || null;
  const pub = path.join(ROOT, "remotion/public");
  const serveUrl = await bundle({ entryPoint: path.join(ROOT, "remotion/index.ts"), publicDir: pub });
  for (const ch of channels) {
    const dir = path.join(channelDir(ch.id), "previews");
    fs.mkdirSync(dir, { recursive: true });
    const lock = path.join(dir, ".running"), again = path.join(dir, ".again");
    fs.writeFileSync(lock, String(process.pid));
    try {
      do {
        fs.rmSync(again, { force: true });
        await renderChannel(ch);
      } while (fs.existsSync(again));
    } finally {
      fs.rmSync(lock, { force: true });
    }
  }

  async function renderChannel(ch: Channel) {
    const out = path.join(channelDir(ch.id), "previews");
    fs.mkdirSync(out, { recursive: true });
    const chars = getCharacters(ch.id);
    // isi terbaru dibaca ulang tiap putaran, karena template bisa diedit selagi render
    const keep = new Set<string>();
    for (const t of getTemplates(ch.id)) {
      keep.add(`${t.id}.jpg`);
      if (t.kind === "affiliate") continue;
      const s = sampleFor(t);
      const slot = t.scenes[Math.min(s.slot ?? 0, t.scenes.length - 1)];
      const speaker = slot?.speaker || chars[0]?.id || "narator";
      const sec = 4;
      const scene: Scene = { id: "s1", speaker, tag: s.tag, text: s.text, screenText: s.screenText, keyword: s.keyword, visual: s.visual, prompt: "", durationSec: sec };
      const inputProps = {
        scenes: [scene],
        cues: cuesOf(s.text, sec),
        characters: chars.map((c) => ({ id: c.id, name: c.name, color: c.color, textColor: c.textColor })),
        theme: { headerText: ch.headerText, tagline: ch.tagline, outroTeaser: ch.outroTeaser, outroFollow: ch.outroFollow, colors: ch.colors, grid: ch.grid, bgmVolume: 0, channelName: ch.name, font: ch.font, layout: t.layout || ch.layout || "kartu", showHeader: !!ch.showHeader },
        episode: "",
        hookTitle: "",
        hookKeyword: "",
        products: {},
      };
      const composition = await selectComposition({ serveUrl, id: "KodeKepoVideo", inputProps, browserExecutable });
      await renderStill({ composition, serveUrl, inputProps, browserExecutable, frame: 100, output: path.join(out, `${t.id}.jpg`), imageFormat: "jpeg", jpegQuality: 82, scale: 0.4 });
      console.log(`${ch.id}/${t.id}`);
    }
    for (const f of fs.readdirSync(out)) if (f.endsWith(".jpg") && !keep.has(f)) fs.rmSync(path.join(out, f));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
