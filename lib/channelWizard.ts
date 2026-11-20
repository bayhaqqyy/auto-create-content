/**
 * Wizard channel baru: AI bertanya dulu, lalu menyusun brand kit, karakter, style bawaan, dan alur dari jawabannya.
 */
import { GEMINI_VOICES, LAYOUTS, TEMPLATE_LIBRARY } from "./defaults";
import { LOOK_PRESETS } from "./anim";
import type { BriefQuestion, Layout } from "./types";

export type QA = { question: string; answer: string };

export const STYLE_Q_ID = "style";

export const CH_QUESTIONS_SCHEMA = {
  type: "object",
  properties: {
    recommendedLayout: { type: "string", enum: LAYOUTS.map((l) => l.id) },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: { question: { type: "string" }, why: { type: "string" }, options: { type: "array", items: { type: "string" } } },
        required: ["question", "why", "options"],
      },
    },
  },
  required: ["recommendedLayout", "questions"],
};

export function chQuestionsPrompt(description: string) {
  return `Kamu konsultan branding channel video pendek (TikTok/Reels/Shorts) di Indonesia. Pembuat konten ingin membuat channel baru:
"${description}"

Sebelum merancang brand kit, tanyakan 4-5 hal yang paling menentukan karakter channel ini. Contoh hal yang biasanya perlu diputuskan:
- siapa penonton utamanya (umur, kebiasaan),
- nada dan sapaan (lo/gue, aku/kamu, formal),
- narator: satu pencerita atau beberapa tokoh, suaranya seperti apa,
- format/alur andalan (mis. serial bersambung, cerita sekali tamat, daftar, mitos vs fakta),
- suasana warna dan musik,
- cara menutup video (pertanyaan komentar, voting, teaser).
JANGAN tanya soal style visual; itu ditanyakan terpisah.
Tiap pertanyaan punya 3-4 pilihan jawaban yang konkret dan spesifik untuk channel ini (pilihan pertama = rekomendasimu), plus why satu kalimat.
recommendedLayout: style visual yang paling cocok dari daftar: ${LAYOUTS.map((l) => `${l.id} (${l.desc})`).join("; ")}.
Balas hanya JSON.`;
}

/** Pertanyaan style visual: semua style, rekomendasi di urutan pertama. */
export function styleQuestion(recommended: Layout): BriefQuestion {
  const order = [...LAYOUTS].sort((a, b) => (a.id === recommended ? -1 : b.id === recommended ? 1 : 0));
  return {
    id: STYLE_Q_ID,
    question: "Style visual bawaan channel ini?",
    why: "Otomatis terpilih saat membuat video, tapi tetap bisa diganti per video.",
    options: order.map((l) => `${l.name} — ${l.desc}`),
  };
}

export const layoutFromAnswer = (a: string): Layout | undefined => LAYOUTS.find((l) => a.startsWith(l.name))?.id as Layout | undefined;

/** Tebakan style dari deskripsi saat tanpa AI. */
export function guessLayout(desc: string): Layout {
  const d = desc.toLowerCase();
  if (/horor|horror|seram|hantu|mistis|misteri/.test(d)) return "horor";
  if (/motivasi|semangat|quote|inspirasi/.test(d)) return "motivasi";
  if (/lucu|komedi|fun ?fact|funfact|fakta unik|stickman/.test(d)) return "stickman";
  if (/tips|aplikasi|hp|whatsapp|settingan/.test(d)) return "layar";
  return "kartu";
}

export function demoChannelQuestions(desc: string): BriefQuestion[] {
  const q = (question: string, options: string[], why: string): BriefQuestion => ({ id: "", question, options, why });
  const list = [
    q("Penonton utamanya siapa?", ["Gen Z 16-24 tahun", "Dewasa muda 25-35 tahun", "Semua umur (keluarga)"], "Menentukan bahasa dan contoh yang dipakai."),
    q("Sapaan dan nadanya?", ["Santai pakai aku/kamu", "Gaul pakai lo/gue", "Tenang dan sopan"], "Jadi aturan bahasa di semua naskah."),
    q("Siapa yang membawakan?", ["Satu narator/pencerita", "Dua tokoh bergantian", "Narator + tokoh tamu sesekali"], "Menentukan karakter dan suara awal."),
    q("Video ditutup dengan apa?", ["Pertanyaan pancingan komentar", "Voting pilihan penonton", "Teaser video berikutnya"], "Penutup yang konsisten bikin penonton hafal."),
  ];
  return [...list.map((x, i) => ({ ...x, id: `q${i + 1}` })), styleQuestion(guessLayout(desc))];
}

export const KIT_SCHEMA = (voices = GEMINI_VOICES) => ({
  type: "object",
  properties: {
    name: { type: "string" },
    headerText: { type: "string" },
    tagline: { type: "string" },
    niche: { type: "string" },
    audience: { type: "string" },
    voiceRules: { type: "array", items: { type: "string" } },
    outroTeaser: { type: "string" },
    outroFollow: { type: "string" },
    hashtagNote: { type: "string" },
    imageStyle: { type: "string" },
    bgmPreset: { type: "string", enum: ["tech", "ceria", "horor", "motivasi"] },
    colors: {
      type: "object",
      properties: { bg: { type: "string" }, card: { type: "string" }, accent: { type: "string" }, accent2: { type: "string" }, text: { type: "string" }, muted: { type: "string" }, outroBg: { type: "string" }, outroText: { type: "string" } },
      required: ["bg", "card", "accent", "accent2", "text", "muted", "outroBg", "outroText"],
    },
    characters: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" }, role: { type: "string" }, style: { type: "string" }, voice: { type: "string", enum: voices }, look: { type: "string" },
          lookPreset: { type: "string", enum: Object.keys(LOOK_PRESETS) },
        },
        required: ["name", "role", "style", "voice", "look", "lookPreset"],
      },
    },
    alur: { type: "array", items: { type: "string", enum: TEMPLATE_LIBRARY.map((t) => t.id) } },
  },
  required: ["name", "headerText", "tagline", "niche", "audience", "voiceRules", "outroTeaser", "outroFollow", "hashtagNote", "imageStyle", "bgmPreset", "colors", "characters", "alur"],
});

export function kitPrompt(description: string, qa: QA[], note: string, name: string, layout: Layout) {
  return `Rancang brand kit channel video pendek (TikTok/Reels/Shorts) berbahasa Indonesia.

DESKRIPSI DARI PEMBUAT: "${description}"
${name ? `NAMA YANG SUDAH DIPILIH: ${name} (pakai persis)\n` : ""}KEPUTUSAN PEMBUAT (wajib diikuti):
${qa.map((x) => `- ${x.question} → ${x.answer}`).join("\n")}
${note ? `- Catatan: ${note}\n` : ""}STYLE VISUAL BAWAAN: ${layout} (${LAYOUTS.find((l) => l.id === layout)?.desc})

Aturan:
- name singkat dan mudah diingat, tidak meniru brand lain; headerText huruf kapital; tagline maksimal 5 kata dengan koma di tengah.
- voiceRules 4-6 aturan konkret: sapaan, nada, hook di detik pertama tanpa sapaan, panjang kalimat, larangan (mis. tidak menjanjikan part 2 kalau bukan serial, tidak mengarang fakta untuk konten non-fiksi), dan cara menutup video.
- warna hex #RRGGBB, kontras teks minimal 4.5:1 terhadap bg dan card, cocok dengan suasana channel dan style ${layout}.
- bgmPreset yang paling cocok. imageStyle bahasa Inggris.
- characters 1-3 sesuai jawaban; voice dari daftar yang tersedia; lookPreset = wujud kartun terdekat dari: ${Object.entries(LOOK_PRESETS).map(([id, l]) => `${id} (${l.label})`).join("; ")}.
- alur: 1-3 id alur siap pakai yang paling cocok dari: ${TEMPLATE_LIBRARY.map((t) => `${t.id} (${t.name}: ${t.description})`).join("; ")}.
- outroTeaser satu kalimat menggoda episode berikutnya tanpa janji spesifik; outroFollow ajakan follow pendek.
Balas hanya JSON.`;
}

/** Brand kit cadangan tanpa AI, dari jawaban pertanyaan bawaan. */
export function demoKit(description: string, answers: Record<string, string>, name: string, layout: Layout) {
  const dark = layout === "horor" || layout === "motivasi";
  const casual = /lo\/gue/.test(answers.q2 || "");
  const alur = layout === "horor" ? ["horor-kartun"] : layout === "motivasi" ? ["motivasi-siluet"] : layout === "stickman" ? ["stickman-mitos"] : [TEMPLATE_LIBRARY[0].id];
  return {
    name: name || "Channel Baru",
    headerText: (name || "CHANNEL BARU").toUpperCase(),
    tagline: "",
    niche: description,
    audience: answers.q1 || "Umum",
    voiceRules: [
      casual ? "Bahasa gaul pakai lo/gue." : "Bahasa santai pakai aku/kamu.",
      "Hook di detik pertama, jangan dibuka dengan sapaan.",
      "Kalimat pendek, satu ide per kalimat.",
      `Tutup video dengan: ${(answers.q4 || "pertanyaan pancingan komentar").toLowerCase()}.`,
    ],
    outroTeaser: "Masih ada cerita lain, jangan sampai kelewatan",
    outroFollow: "Follow biar nggak ketinggalan!",
    hashtagNote: "Pakai 5 hashtag: #fyp #fypシ, 2 hashtag topik, #viral.",
    imageStyle: "flat 2D illustration",
    bgmPreset: layout === "horor" ? "horor" : layout === "motivasi" ? "motivasi" : "tech",
    colors: dark
      ? { bg: "#0B0B10", card: "#17171F", accent: "#E23B3B", accent2: "#FFD23F", text: "#F4F1EA", muted: "#9A97A8", outroBg: "#0B0B10", outroText: "#F4F1EA" }
      : { bg: "#0F1928", card: "#18243A", accent: "#A4FF19", accent2: "#FFD23F", text: "#F6F8FC", muted: "#9AA8BF", outroBg: "#F6F8FC", outroText: "#0F1928" },
    characters: [{ name: "Narator", role: "Pencerita utama channel.", style: "Jelas dan hidup", voice: "Charon", look: "", lookPreset: "pemuda" }],
    alur,
  };
}
