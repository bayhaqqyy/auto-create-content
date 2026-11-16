import type { Channel, Character, Product, Project, Scene, Template, VisualKind } from "./types";
import { ICONS } from "./icons";

export type ScriptResult = {
  title: string;
  titleOptions: string[];
  scenes: Omit<Scene, "id" | "audio" | "durationSec">[];
  caption: string;
  hashtags: string[];
  coverText: string;
  coverKeyword: string;
};

const KINDS: VisualKind[] = ["question", "statement", "steps", "compare", "number", "chat", "notification", "call"];

export const SCRIPT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    titleOptions: { type: "array", items: { type: "string" } },
    scenes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          speaker: { type: "string" },
          tag: { type: "string" },
          text: { type: "string" },
          screenText: { type: "string" },
          keyword: { type: "string" },
          visual: {
            type: "object",
            properties: {
              kind: { type: "string", enum: KINDS },
              items: { type: "array", items: { type: "string" } },
              icon: { type: "string", enum: [...ICONS] },
            },
            required: ["kind", "items", "icon"],
          },
          prompt: { type: "string" },
        },
        required: ["speaker", "tag", "text", "screenText", "keyword", "visual", "prompt"],
      },
    },
    caption: { type: "string" },
    hashtags: { type: "array", items: { type: "string" } },
    coverText: { type: "string" },
    coverKeyword: { type: "string" },
  },
  required: ["title", "titleOptions", "scenes", "caption", "hashtags", "coverText", "coverKeyword"],
};

export function buildPrompt(p: Project, t: Template, chars: Character[], facts: string[], ch: Channel) {
  const cast = t.characters
    .map((id) => chars.find((c) => c.id === id))
    .filter(Boolean)
    .map((c) => `- ${c!.id} (${c!.name}): ${c!.role} Gaya bicara: ${c!.style}.`)
    .join("\n");
  const structure = t.scenes.map((s, i) => `${i + 1}. speaker=${s.speaker}, sekitar ${s.seconds} detik: ${s.purpose}`).join("\n");
  return `Kamu penulis naskah video pendek untuk channel "${ch.name}" (TikTok, Reels, Shorts).
Isi channel: ${ch.niche}
Penonton utama channel: ${ch.audience}
Tagline: "${ch.tagline}"

TOPIK: ${p.topic}
PLATFORM: ${p.platform}. DURASI TARGET: sekitar ${p.durationTarget} detik (template ${t.minSec}-${t.maxSec} detik). PENONTON: ${p.audience}.
Kecepatan bicara sekitar 2,6 kata per detik, jadi atur panjang tiap kalimat sesuai durasi scene.

TEMPLATE: ${t.name}. ${t.description}
KARAKTER (pakai id persis seperti ini di field speaker):
${cast}

STRUKTUR SCENE (ikuti urutan dan jumlahnya):
${structure}

ATURAN CHANNEL:
${ch.voiceRules.map((r) => "- " + r).join("\n")}
ATURAN TEMPLATE:
${t.rules.map((r) => "- " + r).join("\n")}

FAKTA HASIL RISET (hanya pakai fakta dari sini untuk angka dan klaim):
${facts.length ? facts.map((f) => "- " + f).join("\n") : "- (tidak ada)"}

ISI TIAP SCENE:
- text: kalimat yang diucapkan karakter (tanpa nama karakter di depan, tanpa emoji).
- tag: label bab 1-2 kata huruf kapital, mis. "MODUSNYA", "CARA KERJA", "FAKTA", "SOLUSI".
- screenText: judul bab 2-6 kata dalam DUA baris dipisah "|", baris kedua bagian paling penting (mis. "KURIR MINTA|KODE OTP?"). Scene pertama adalah hook: klaim besar, sebaiknya dengan angka dari riset.
- keyword: SATU kata dari text yang di-highlight di subtitle (harus muncul persis di text).
- visual.kind: pilih yang paling cocok dengan isi scene dan variasikan antar scene:
  question (pertanyaan), statement (pernyataan kunci), steps (2-4 langkah singkat di items),
  compare (tepat 2 item yang dibandingkan), number (items[0]=angka dari riset, items[1]=keterangan singkat),
  chat (2-4 item format "Pengirim: pesan", untuk percakapan WhatsApp/DM), notification (items=[aplikasi, judul, isi]),
  call (items=[nama penelepon, status mis. "memanggil…"]). Jangan pakai number kalau tidak ada angka di fakta riset. Isi chat/notifikasi boleh fiksi tapi tidak boleh berisi data pribadi asli, nomor asli, atau link.
- visual.icon: satu ikon yang paling mewakili isi scene.
- prompt: deskripsi adegan bahasa Inggris untuk gambar/klip 3D vertikal 9:16 yang nyambung dengan kalimat scene. Sebut nama karakter yang tampil (${t.characters.join(", ")}) dan apa yang mereka lakukan, ekspresi, latar, dan properti. Sisakan ruang kosong di sepertiga atas untuk teks. Tanpa teks, huruf, atau logo di gambar.

LAINNYA:
- title: judul video yang bikin penasaran, maksimal 6 kata. titleOptions: 3 variasi termasuk title.
- caption: 1-3 kalimat, ditutup pertanyaan pancingan komentar.
- hashtags: 4-6 hashtag. ${ch.hashtagNote}
- coverText: 2-5 kata untuk cover, coverKeyword: satu kata dari coverText yang di-highlight.
Balas hanya JSON sesuai skema.`;
}


/** Normalisasi hasil LLM supaya aman dipakai renderer. */
export function sanitizeScript(r: ScriptResult, t: Template, productIds: string[] = []): ScriptResult {
  const allowed = new Set(t.characters);
  const scenes = (r.scenes || []).slice(0, 12).map((s, i) => {
    const speaker = allowed.has(s.speaker) ? s.speaker : t.scenes[i]?.speaker || t.characters[0];
    let kind = KINDS.includes(s.visual?.kind as VisualKind) ? s.visual.kind : "statement";
    let items = (s.visual?.items || []).map(String).filter(Boolean).slice(0, 4);
    if (kind === "compare" && items.length !== 2) kind = "statement";
    if (kind === "steps" && items.length < 2) kind = "statement";
    if (kind === "number" && !/\d/.test(items[0] || "")) kind = "statement";
    if (kind === "chat" && items.length < 1) kind = "statement";
    if ((kind === "notification" || kind === "call") && items.length < 2) kind = "statement";
    const icon = (ICONS as readonly string[]).includes(s.visual?.icon || "") ? s.visual.icon : "question";
    const keyword = s.text.toLowerCase().includes((s.keyword || "").toLowerCase()) ? s.keyword : "";
    return { ...s, tag: (s.tag || "").toUpperCase().slice(0, 24), speaker, keyword, visual: { kind, items, icon } };
  });
  const hashtags = (r.hashtags || []).map((h) => (h.startsWith("#") ? h : "#" + h).replace(/\s+/g, ""));
  return { ...r, scenes, hashtags };
}

/** Naskah contoh untuk mode demo (tanpa API key). */
export function demoScript(channelId = "kodekepo"): ScriptResult {
  if (channelId === "petualangan-kepi") return demoKids();
  return {
    title: "OTP Itu Kunci Rumah Lo!",
    titleOptions: ["OTP Itu Kunci Rumah Lo!", "Kurir Minta OTP? Jangan Dikasih!", "6 Angka yang Bisa Bikin Akun Lo Pindah Tangan"],
    scenes: [
      { speaker: "kepo", tag: "MODUSNYA", text: "Ada kurir minta kode OTP, katanya buat konfirmasi paket. Kasih aja kan?", screenText: "KURIR MINTA|KODE OTP?", keyword: "OTP", visual: { kind: "chat", items: ["Kurir: Kak, paketnya udah di depan. Kodenya berapa ya?", "Kamu: Kode apa ya kak?", "Kurir: Yang barusan masuk SMS kak, buat konfirmasi"], icon: "package" }, prompt: "a courier at a front door holding a phone, the young woman inside looks confused at her own phone" },
      { speaker: "paham", tag: "FAKTANYA", text: "Jangan. OTP itu kunci sekali pakai buat masuk akun lo. Siapa yang pegang kodenya, dia yang dianggap lo.", screenText: "OTP ITU|KUNCI AKUN", keyword: "kunci", visual: { kind: "notification", items: ["SMS", "Kode verifikasi", "Kode OTP kamu 4•••••. JANGAN berikan kode ini ke siapa pun."], icon: "key" }, prompt: "glowing six-digit key floating above a smartphone, the young man explains calmly" },
      { speaker: "kepo", tag: "TERUS?", text: "Cuma enam angka doang, emang bisa ngapain?", screenText: "CUMA|6 ANGKA?", keyword: "enam", visual: { kind: "question", items: [], icon: "smartphone" }, prompt: "close-up of a phone lock screen with a notification of blurred digits" },
      { speaker: "paham", tag: "CARA KERJA", text: "Aplikasi ngirim OTP buat ngecek ini beneran lo. Begitu kodenya dikasih, sistem ngira orang lain itu lo, dan dia bisa ganti password akun lo.", screenText: "SISTEM NGIRA|DIA ITU LO", keyword: "sistem", visual: { kind: "compare", items: ["Lo yang asli", "Orang yang pegang OTP"], icon: "users" }, prompt: "split screen: the real user and a shadowy figure entering the same app" },
      { speaker: "kepo", tag: "WADUH", text: "Terus kalau udah terlanjur kekasih?", screenText: "UDAH|TERLANJUR?", keyword: "terlanjur", visual: { kind: "call", items: ["Nomor tidak dikenal", "memanggil…"], icon: "phone" }, prompt: "the young woman facepalming on a sofa" },
      { speaker: "paham", tag: "SOLUSI", text: "Langsung ganti password, keluarin semua perangkat yang login, terus hubungi bank lewat nomor resmi di aplikasinya. Bukan nomor yang dikirim lewat chat.", screenText: "AMANKAN AKUN|SEKARANG", keyword: "resmi", visual: { kind: "steps", items: ["Ganti password", "Logout semua perangkat", "Telepon nomor resmi"], icon: "shield" }, prompt: "three checklist cards sliding in one by one" },
      { speaker: "paham", tag: "KOMENTAR", text: "Lo pernah dimintain OTP juga? Cerita di komentar. Kepo dulu, paham kemudian.", screenText: "PERNAH DIMINTAIN|OTP JUGA?", keyword: "komentar", visual: { kind: "question", items: [], icon: "chat" }, prompt: "both characters waving at the camera" },
    ],
    caption: "Ada yang minta kode OTP lo, ngakunya kurir atau CS bank? Itu bukan konfirmasi, itu kunci akun lo. Pernah dimintain juga? Cerita di komentar.",
    hashtags: ["#fyp", "#otp", "#penipuanonline", "#keamanandigital", "#tipsaman"],
    coverText: "Jangan kasih OTP lo!",
    coverKeyword: "OTP",
  };
}

function demoKids(): ScriptResult {
  return {
    title: "Kenapa HP Bisa Ngecas?",
    titleOptions: ["Kenapa HP Bisa Ngecas?", "Listrik Masuk ke HP Lewat Mana?", "Kepi dan Baterai yang Lapar"],
    scenes: [
      { speaker: "bita", tag: "KOK BISA?", text: "Kepi, HP Ibu bunyi terus. Katanya baterainya lapar. Baterai bisa lapar?", screenText: "BATERAI|BISA LAPAR?", keyword: "lapar", visual: { kind: "question", items: [], icon: "smartphone" }, prompt: "Bita the envelope character pointing at a phone with a low battery icon glowing red, cozy living room, Kepi the robot looking curious" },
      { speaker: "kepi", tag: "OH GITU", text: "Hihi, bukan lapar beneran. Baterai itu seperti botol minum kecil yang isinya listrik.", screenText: "BATERAI ITU|BOTOL LISTRIK", keyword: "botol", visual: { kind: "statement", items: [], icon: "zap" }, prompt: "Kepi the robot showing a giant transparent water bottle filled with glowing yellow electricity, Bita the envelope amazed" },
      { speaker: "kepi", tag: "CARA KERJA", text: "Waktu dicolok, listrik dari rumah mengalir lewat kabel, lalu baterainya pelan-pelan terisi lagi.", screenText: "COLOK,|LALU TERISI", keyword: "terisi", visual: { kind: "steps", items: ["Colok ke charger", "Listrik lewat kabel", "Baterai terisi"], icon: "plug" }, prompt: "a charging cable with glowing light flowing from a wall socket into a phone, Kepi and Bita following the light" },
      { speaker: "bita", tag: "SERU!", text: "Oh, jadi kayak isi ulang botol minum ya!", screenText: "KAYAK|ISI ULANG!", keyword: "ulang", visual: { kind: "statement", items: [], icon: "star" }, prompt: "Bita the envelope laughing next to a water dispenser while a phone charges nearby" },
      { speaker: "kepi", tag: "INGAT YA", text: "Betul! Tapi ingat, minta tolong orang dewasa waktu mencolok charger, ya. Sampai jumpa di petualangan berikutnya!", screenText: "MINTA TOLONG|ORANG DEWASA", keyword: "dewasa", visual: { kind: "question", items: [], icon: "heart" }, prompt: "an adult's hand plugging in a charger safely while Kepi and Bita wave goodbye" },
    ],
    caption: "Kepi dan Bita cari tahu kenapa HP bisa ngecas. Adik-adik pernah lihat baterai HP habis?",
    hashtags: ["#belajarbersama", "#anak", "#edukasianak", "#shorts"],
    coverText: "Baterai bisa lapar?",
    coverKeyword: "lapar",
  };
}

