export type VisualKind = "question" | "statement" | "steps" | "compare" | "number" | "chat" | "notification" | "call" | "product" | "proscons" | "clip";

export type Visual = {
  kind: VisualKind;
  /**
   * steps: 2-4 item; compare: tepat 2 item; number: [angka dari riset, keterangan];
   * chat: tiap item "Pengirim: pesan"; notification: [aplikasi, judul, isi]; call: [nama penelepon, status];
   * product: [id produk]; proscons: item diawali "+" (kelebihan) atau "-" (kekurangan)
   */
  items: string[];
  /** nama ikon (lihat ICONS di lib/icons.ts) yang mewakili isi scene */
  icon?: string;
  /** klip milik sendiri (mis. Google Flow) yang di-upload ke scene ini */
  clip?: string;
};

export type Scene = {
  id: string;
  speaker: string;
  text: string;
  /** label bab (pill), mis. "MODUSNYA", "CARA KERJA", "SOLUSI" */
  tag?: string;
  /** judul bab; baris kedua diberi warna aksen. Pisahkan dua baris dengan "|" */
  screenText: string;
  keyword: string;
  visual: Visual;
  /** prompt gambar/klip 3D untuk scene ini (bahasa Inggris) */
  prompt: string;
  /** gambar latar 3D hasil generate atau upload */
  image?: string;
  audio?: string;
  durationSec?: number;
  /** panjang suara sebenarnya bila durationSec sengaja diperpanjang (mode satu take); dipakai untuk caption */
  voiceSec?: number;
  /** durasi klip video terpasang (detik), untuk menyesuaikan kecepatan putar */
  clipSec?: number;
};

export type Source = { title: string; url: string; date?: string; verified: boolean };

export type CheckItem = { ok: boolean; text: string };

export type ProjectStatus = "queued" | "researching" | "writing" | "voicing" | "imaging" | "rendering" | "ready" | "draft" | "failed";

export type Project = {
  id: string;
  channelId: string;
  /** "affiliate" = konten promosi produk dengan link komisi */
  kind?: "edu" | "affiliate";
  productIds?: string[];
  /** video affiliate: suara narator (Gemini TTS) dan nuansa video */
  voice?: string;
  vibe?: string;
  /** video affiliate: "review" = POV tangan unboxing & demo fitur; "harian" = produk dipakai sehari-hari */
  adStyle?: "review" | "harian";
  /** video affiliate: audio bawaan klip AI dipertahankan pelan (suara suasana) */
  ambient?: boolean;
  /** video affiliate satu take: satu klip panjang jadi latar seluruh video (adegan hanya mengatur voice over & teks) */
  adClip?: string;
  createdAt: string;
  updatedAt: string;
  topic: string;
  templateId: string;
  platform: string;
  durationTarget: number;
  audience: string;
  visualStyle: string;
  episode?: string;
  status: ProjectStatus;
  stage?: string;
  progress?: number;
  error?: string;
  demo?: boolean;
  title?: string;
  titleOptions?: string[];
  scenes: Scene[];
  caption?: string;
  hashtags?: string[];
  coverText?: string;
  coverKeyword?: string;
  facts?: string[];
  sources: Source[];
  checks?: CheckItem[];
  video?: string;
  srt?: string;
  views?: string;
  review?: "draft" | "review" | "tayang";
};

export type TemplateScene = { speaker: string; purpose: string; seconds: number };

export type Template = {
  id: string;
  channelId: string;
  name: string;
  description: string;
  minSec: number;
  maxSec: number;
  characters: string[];
  scenes: TemplateScene[];
  rules: string[];
  /** paksa gaya visual untuk template ini (kosong = ikut channel) */
  visualMode?: "cards" | "3d";
  /** "affiliate" memakai data produk, bukan riset web */
  kind?: "edu" | "affiliate";
  /** jumlah produk yang dibahas (affiliate) */
  productCount?: number;
};

export type Product = {
  id: string;
  channelId: string;
  name: string;
  brand: string;
  platform: "TikTok Shop" | "Shopee" | "Tokopedia" | "Lainnya";
  /** link affiliate milikmu, hanya untuk disalin saat upload */
  link: string;
  /** harga seperti tertulis di toko + tanggal dicek; kosongkan kalau tidak mau menyebut harga */
  price: string;
  priceCheckedAt?: string;
  category: string;
  /** fakta & spesifikasi dari halaman produk resmi, satu per baris */
  facts: string[];
  /** pengalaman sendiri */
  pros: string[];
  cons: string[];
  /** sudah dicoba sendiri? kalau belum, naskah tidak boleh mengaku sudah memakai */
  tried: boolean;
  /** foto/screenshot milik sendiri */
  photos: string[];
  notes: string;
};

export type Character = {
  id: string;
  channelId: string;
  name: string;
  role: string;
  style: string;
  voice: string;
  /** deskripsi tampilan untuk gambar 3D (bahasa Inggris), dipakai bila belum ada gambar referensi */
  look: string;
  /** file gambar referensi karakter (upload sendiri atau hasil generate yang disetujui) */
  refImage?: string;
  color: string;
  textColor: string;
  group: "duo" | "lain";
};

export type Channel = {
  id: string;
  name: string;
  /** teks header kecil di video, mis. "KODEKEPO?" */
  headerText: string;
  tagline: string;
  /** apa isi channel ini & positioning */
  niche: string;
  audience: string;
  /** aturan bahasa & gaya yang berlaku untuk semua template di channel ini */
  voiceRules: string[];
  /** ditampilkan di outro, mis. "Episode depan kita kepoin teknologi lainnya" */
  outroTeaser: string;
  hashtagNote: string;
  /** gaya visual gambar 3D (bahasa Inggris) */
  imageStyle: string;
  colors: { bg: string; card: string; accent: string; accent2: string; text: string; muted: string; outroBg: string; outroText: string };
  font: "jakarta" | "archivo";
  /** "cards" = kartu motion graphic seperti EP KodeKepo!; "3d" = gambar 3D AI per scene di belakang kartu */
  visualMode: "cards" | "3d";
  /** teks pill ajakan follow di outro */
  outroFollow: string;
  bgmPreset: "tech" | "ceria" | "none";
  /** latar grid tipis seperti storyboard brand */
  grid: boolean;
  bgmVolume: number;
  logo?: string;
  bgm?: string;
};
