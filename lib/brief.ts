/**
 * Tahap perancangan: sebelum naskah ditulis, AI menanyakan 3-5 hal ke pembuat konten
 * supaya arah video jelas. Jawabannya ikut ke prompt naskah.
 */
import type { Brief, BriefQuestion, Channel, Layout, Project, Template } from "./types";

export const BRIEF_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          why: { type: "string" },
          options: { type: "array", items: { type: "string" } },
        },
        required: ["question", "why", "options"],
      },
    },
  },
  required: ["questions"],
};

export function questionsPrompt(p: Project, t: Template, ch: Channel, layout: Layout) {
  const story = t.kind === "cerita";
  return `Kamu produser konten video pendek untuk channel "${ch.name}" (${ch.tagline || ""}). Sebelum menulis naskah, kamu perlu bertanya dulu ke pembuat konten supaya arahnya jelas.

TOPIK: ${p.topic}
TEMPLATE: ${t.name} — ${t.description}
ALUR TEMPLATE: ${t.scenes.map((s, i) => `${i + 1}. ${s.purpose}`).join(" | ")}
TAMPILAN: ${layout}. PLATFORM: ${p.platform}, ${p.durationTarget} detik. PENONTON: ${p.audience}.

Buat 3 sampai 5 pertanyaan dalam bahasa Indonesia santai. Aturan:
- Tiap pertanyaan memutuskan sesuatu yang benar-benar mengubah naskah. Jangan tanya durasi, platform, atau hal yang sudah jelas dari topik.
- Tiap pertanyaan punya 3-4 pilihan jawaban yang konkret dan spesifik untuk topik ini (bukan "lainnya"; kolom isian bebas sudah disediakan aplikasi). Pilihan pertama adalah rekomendasimu.
- why: satu kalimat pendek kenapa ini perlu ditanya.
${story
    ? `- Ini cerita fiksi. Tanyakan hal seperti: latar tempat dan suasana, siapa tokoh utama dan pendampingnya, makhluk/teror atau konflik intinya, dan cara cerita berakhir (pilihan penonton, twist, atau penutup tuntas).`
    : `- Tanyakan hal seperti: sudut pandang atau hook yang paling menarik, contoh kasus spesifik (merek HP, aplikasi, situasi) yang mau ditampilkan, poin utama yang harus dibawa pulang penonton, dan pertanyaan komentar di akhir.`}
Balas hanya JSON.`;
}

/** Pertanyaan bawaan saat tidak ada AI teks (mode demo). */
export function demoQuestions(t: Template, layout: Layout): BriefQuestion[] {
  const q = (question: string, options: string[], why: string): BriefQuestion => ({ id: "", question, options, why });
  let list: BriefQuestion[];
  if (layout === "horor")
    list = [
      q("Ceritanya terjadi di mana?", ["Posko KKN di desa terpencil", "Rumah nenek di kampung", "Kos-kosan lama di kota", "Sekolah malam hari"], "Menentukan set dan suasana tiap scene."),
      q("Siapa tokoh utamanya?", ["Mahasiswa KKN bertiga", "Anak kos sendirian", "Kakak-adik yang mudik", "Satpam jaga malam"], "Supaya tokohnya konsisten dari awal sampai akhir."),
      q("Terornya seperti apa?", ["Ketukan dan suara orang yang dikenal", "Cahaya merah melayang", "Sosok di jendela", "Barang pindah sendiri"], "Ini yang jadi puncak cerita."),
      q("Akhirnya mau bagaimana?", ["Penonton memilih lewat komentar", "Twist mengejutkan", "Selesai tuntas, tokoh selamat"], "Penutup menentukan pancingan komentar."),
    ];
  else if (layout === "motivasi" || t.kind === "cerita")
    list = [
      q("Penontonnya sedang mengalami apa?", ["Gagal ujian atau seleksi", "Capek kerja, merasa jalan di tempat", "Usaha belum laku", "Baru putus atau kehilangan"], "Supaya kalimat pembukanya terasa kena."),
      q("Nadanya mau seperti apa?", ["Hangat dan menenangkan", "Tegas dan membakar semangat", "Tenang dan reflektif"], "Mengatur pilihan kata dan musik."),
      q("Langkah kecil apa yang mau disarankan?", ["Kerjakan satu hal kecil hari ini", "Istirahat dulu lalu mulai lagi besok", "Cerita ke satu orang yang dipercaya"], "Isi bagian 'satu langkah kecil'."),
    ];
  else
    list = [
      q("Hook pembukanya mau yang mana?", ["Kejadian panik sehari-hari", "Pertanyaan 'kamu pernah…?'", "Fakta yang bikin kaget"], "Tiga detik pertama menentukan orang lanjut nonton."),
      q("Contoh kasusnya pakai apa?", ["HP Android umum", "iPhone", "Keduanya"], "Biar langkahnya spesifik dan bisa dicek."),
      q("Pertanyaan komentar di akhir?", ["Kamu pernah ngalamin?", "Kamu tim yang mana?", "Tips lain apa yang kamu tahu?"], "Pancingan komentar untuk algoritma."),
    ];
  return list.map((x, i) => ({ ...x, id: `q${i + 1}` }));
}

export function cleanQuestions(raw: { question?: string; why?: string; options?: string[] }[]): BriefQuestion[] {
  return (raw || [])
    .filter((q) => q && typeof q.question === "string" && q.question.trim())
    .slice(0, 5)
    .map((q, i) => ({
      id: `q${i + 1}`,
      question: q.question!.trim().slice(0, 200),
      why: (q.why || "").trim().slice(0, 200) || undefined,
      options: (q.options || []).map((o) => String(o).trim()).filter(Boolean).slice(0, 4),
    }));
}

/** Bagian prompt naskah berisi jawaban perancangan. */
export function briefSection(b?: Brief) {
  if (!b || b.skipped || !b.answers) return "";
  const lines = b.questions.map((q) => (b.answers![q.id] ? `- ${q.question} → ${b.answers![q.id]}` : "")).filter(Boolean);
  if (b.note) lines.push(`- Catatan tambahan: ${b.note}`);
  return lines.length ? `KEPUTUSAN DARI PEMBUAT KONTEN (wajib diikuti):\n${lines.join("\n")}\n` : "";
}
