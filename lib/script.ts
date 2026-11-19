import type { AnimLayout, Channel, Character, Layout, Product, Project, Scene, Template, VisualKind } from "./types";
import { ICONS } from "./icons";
import { animPromptSection, cleanAnim, isAnimLayout, LOOK_PRESETS } from "./anim";

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
          anim: {
            type: "object",
            properties: {
              set: { type: "string" },
              cast: {
                type: "array",
                items: {
                  type: "object",
                  properties: { who: { type: "string" }, pose: { type: "string" }, mood: { type: "string" }, talk: { type: "boolean" } },
                  required: ["who", "pose", "mood", "talk"],
                },
              },
              event: { type: "string" },
              camera: { type: "string" },
              stamp: { type: "string" },
            },
            required: ["set", "cast", "event", "camera"],
          },
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

/** Skema naskah; tampilan animasi mewajibkan field anim di tiap scene. */
export function scriptSchema(layout: Layout) {
  const base = JSON.parse(JSON.stringify(SCRIPT_SCHEMA));
  if (isAnimLayout(layout)) base.properties.scenes.items.required.push("anim");
  else delete base.properties.scenes.items.properties.anim;
  return base;
}

/** Tokoh yang boleh dipilih AI untuk animasi: karakter channel + preset tokoh kartun. */
export function animCast(chars: Character[]) {
  return [
    ...chars.map((c) => ({ id: c.id, desc: `${c.name}, ${c.role}` })),
    ...Object.entries(LOOK_PRESETS).map(([id, l]) => ({ id, desc: l.label })),
  ];
}

export function buildPrompt(p: Project, t: Template, chars: Character[], facts: string[], ch: Channel, layout: Layout = "kartu") {
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

${t.kind === "cerita" ? CERITA_RULES : `FAKTA HASIL RISET (hanya pakai fakta dari sini untuk angka dan klaim):
${facts.length ? facts.map((f) => "- " + f).join("\n") : "- (tidak ada)"}`}
${isAnimLayout(layout) ? "\n" + animPromptSection(layout as AnimLayout, animCast(chars)) + "\n" : ""}

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
- prompt: ${isAnimLayout(layout) ? "cukup satu kalimat bahasa Inggris yang meringkas adegan (video ini digambar sebagai animasi 2D, bukan gambar AI)." : "deskripsi adegan bahasa Inggris"} untuk gambar/klip 3D vertikal 9:16 yang nyambung dengan kalimat scene. Sebut nama karakter yang tampil (${t.characters.join(", ")}) dan apa yang mereka lakukan, ekspresi, latar, dan properti. Sisakan ruang kosong di sepertiga atas untuk teks. Tanpa teks, huruf, atau logo di gambar.

LAINNYA:
- title: judul video yang bikin penasaran, maksimal 6 kata. titleOptions: 3 variasi termasuk title.
- caption: 1-3 kalimat, ditutup pertanyaan pancingan komentar.
- hashtags: 4-6 hashtag. ${ch.hashtagNote}
- coverText: 2-5 kata untuk cover, coverKeyword: satu kata dari coverText yang di-highlight.
Balas hanya JSON sesuai skema.`;
}


const CERITA_RULES = `JENIS KONTEN: CERITA FIKSI / MOTIVASI, TANPA RISET.
- Jangan menyebut angka, statistik, nama orang nyata, merek, atau kejadian nyata sebagai fakta.
- Jangan menaruh kutipan di mulut tokoh terkenal. Kalimat bijak ditulis sebagai kalimat sendiri atau "pepatah".
- Cerita harus utuh dan nyambung: tiap scene adalah akibat dari scene sebelumnya, tokoh dan tempat konsisten,
  setiap kejutan sudah diberi petunjuk sebelumnya, dan penutup menjawab atau menajamkan pertanyaan di awal.
- Legenda atau budaya daerah ditampilkan dengan hormat, bukan bahan ejekan.`;

/** Prompt pemeriksa naskah cerita: cek alur, konsistensi, dan kecocokan arahan animasi, lalu perbaiki. */
export function reviewPrompt(base: string, draft: ScriptResult) {
  return `${base}

DRAF NASKAH (JSON):
${JSON.stringify({ ...draft, titleOptions: undefined }, null, 1)}

TUGAS: periksa draf di atas seperti editor naskah, lalu kirim versi yang sudah diperbaiki dengan skema yang sama.
Cek satu per satu dan perbaiki kalau gagal:
1. Hook detik pertama langsung menegangkan/mengejutkan, tanpa sapaan.
2. Alur sebab-akibat: tiap scene nyambung dengan scene sebelumnya, tidak ada lompatan yang membingungkan.
3. Tokoh, pakaian, tempat, dan jam (stamp) konsisten dan maju dengan masuk akal.
4. Arahan animasi cocok dengan kalimat scene (yang bicara talk=true, ekspresi sesuai emosi, set sesuai tempat).
5. Panjang kalimat sesuai durasi scene, bahasa natural seperti orang bercerita.
6. Penutup tuntas atau berupa pertanyaan pancingan komentar yang jelas; tidak menjanjikan "part 2".
Balas hanya JSON.`;
}

/** Normalisasi hasil LLM supaya aman dipakai renderer. */
export function sanitizeScript(r: ScriptResult, t: Template, productIds: string[] = [], layout: Layout = "kartu", castIds: string[] = []): ScriptResult {
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
    const anim = isAnimLayout(layout) ? cleanAnim(s.anim, layout, castIds) : undefined;
    return { ...s, tag: (s.tag || "").toUpperCase().slice(0, 24), speaker, keyword, visual: { kind, items, icon }, anim };
  });
  const hashtags = (r.hashtags || []).map((h) => (h.startsWith("#") ? h : "#" + h).replace(/\s+/g, ""));
  return { ...r, scenes, hashtags };
}

/** Naskah contoh untuk mode demo (tanpa API key). */
export function demoScript(channelId = "kodekepo", layout: Layout = "kartu"): ScriptResult {
  if (layout === "horor") return demoHoror();
  if (layout === "stickman") return demoStick();
  if (layout === "motivasi") return demoMotivasi();
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


type DemoScene = ScriptResult["scenes"][number];
const sc = (speaker: string, tag: string, text: string, screenText: string, keyword: string, anim: DemoScene["anim"], items: string[] = []): DemoScene => ({
  speaker, tag, text, screenText, keyword, anim, prompt: "", visual: { kind: items.length ? "steps" : "statement", items, icon: "question" },
});

/** Contoh horor kartun: serial KKN, satu pencerita orang pertama. */
function demoHoror(): ScriptResult {
  const P = "pencerita";
  return {
    title: "KKN: Jangan Buka Jendela",
    titleOptions: ["KKN: Jangan Buka Jendela", "Yang Ngetuk Jendela Posko", "Satu Larangan di Desa KKN"],
    scenes: [
      sc(P, "MALAM ITU", "Jam dua belas malam, ada yang ngetuk jendela kamar posko. Padahal kamar kami di atas rumah panggung.", "JANGAN BUKA|JENDELANYA", "jendela",
        { set: "kamar", cast: [{ who: "pemuda", pose: "peluk", mood: "kaget", talk: false }], event: "mata-merah", camera: "dorong", stamp: "SELASA | 00.12 | KAMAR POSKO" }),
      sc(P, "SEBELUMNYA", "Enam jam sebelumnya, kami bertiga baru sampai. Naik klotok nyusurin sungai, Bagas sibuk nyari sinyal.", "6 JAM|SEBELUMNYA", "sinyal",
        { set: "sungai", cast: [{ who: "pemuda-kaos", pose: "hp", mood: "tenang", talk: false }, { who: "pemuda", pose: "duduk", mood: "tenang", talk: false }, { who: "pemudi-hijab", pose: "duduk", mood: "cemas", talk: false }], event: "tidak-ada", camera: "dorong", stamp: "SENIN | 17.40 | SUNGAI" }),
      sc(P, "LARANGAN", "Pak Amang, kepala desa, nyambut kami di posko. Pesannya cuma satu: kalau malam ada yang ngetuk jendela, jangan dibuka.", "SATU|LARANGAN", "jangan",
        { set: "posko", cast: [{ who: "bapak-tua", pose: "tunjuk", mood: "tegas", talk: true }, { who: "pemudi-hijab", pose: "ransel", mood: "cemas", talk: false }, { who: "pemuda", pose: "ransel", mood: "tenang", talk: false }, { who: "pemuda-kaos", pose: "ransel", mood: "curiga", talk: false }], event: "tidak-ada", camera: "dorong", stamp: "SENIN | 18.30 | POSKO KKN" }),
      sc(P, "BISIKAN", "Di warung, Acil Ijah bisik ke Nadia. Katanya yang ngetuk itu bukan orang. Dia cuma bisa masuk kalau dibukain.", "YANG NGETUK|BUKAN ORANG", "dibukain",
        { set: "warung", cast: [{ who: "ibu-tua", pose: "bisik", mood: "seram", talk: true }, { who: "pemudi-hijab", pose: "minum", mood: "kaget", talk: false }], event: "tidak-ada", camera: "ikuti", stamp: "SENIN | 19.15 | WARUNG ACIL" }),
      sc(P, "CAHAYA", "Malam berikutnya, dari celah jendela, aku lihat cahaya merah melayang di atas pohon. Pelan-pelan, makin dekat.", "CAHAYA|MERAH", "merah",
        { set: "kamar", cast: [{ who: "pemuda", pose: "hp", mood: "cemas", talk: false }], event: "lampu-merah", camera: "dorong", stamp: "SELASA | 23.58 | KAMAR POSKO" }),
      sc(P, "TOK TOK", "Tok. Tok. Terus ada suara Bagas dari luar: buka, ini aku. Padahal Bagas lagi tidur di sebelahku.", "TOK! TOK!|SUARA BAGAS?", "tidur",
        { set: "kamar", cast: [{ who: "pemuda", pose: "peluk", mood: "kaget", talk: false }, { who: "pemuda-kaos", pose: "tidur", mood: "tenang", talk: false }], event: "ketukan", camera: "guncang", stamp: "SELASA | 00.12 | KAMAR POSKO" }),
      sc(P, "PILIH", "Kalau kamu di posisiku, kamu buka jendelanya atau nggak? Tulis pilihanmu di komentar.", "KAMU|PILIH MANA?", "komentar",
        { set: "kamar", cast: [{ who: "pemuda", pose: "dorong", mood: "kaget", talk: false }], event: "lampu-mati", camera: "diam", stamp: "SELASA | 00.13 | KAMAR POSKO" },
        ["Buka jendelanya", "Bangunin Bagas", "Pura-pura tidur"]),
    ],
    caption: "Satu larangan di desa KKN: kalau ada yang ngetuk jendela malam-malam, jangan dibuka. Kamu pilih yang mana? Cerita ini fiksi.",
    hashtags: ["#fyp", "#ceritahoror", "#kkn", "#horor", "#viral"],
    coverText: "Jangan buka jendelanya",
    coverKeyword: "jendelanya",
  };
}

/** Contoh stickman ekspresif: mitos HP basah dimasukkan ke beras. Fakta dari halaman dukungan Apple "If you see a liquid-detection alert on your iPhone". */
function demoStick(): ScriptResult {
  const N = "narator";
  return {
    title: "HP Basah Masukin Beras?",
    titleOptions: ["HP Basah Masukin Beras?", "Mitos Beras Buat HP Basah", "Jangan Rendam HP di Beras"],
    scenes: [
      sc(N, "WADUH", "HP lo nyemplung ke ember. Refleks pertama orang Indonesia: cari beras.", "HP NYEMPLUNG|KE AIR!", "beras",
        { set: "kamar", cast: [{ who: "pemuda", pose: "kaget", mood: "panik", talk: false }], event: "kaget", camera: "guncang" }),
      sc(N, "KATANYA", "Katanya beras bisa nyedot airnya. Rendam semalam, besok beres.", "MASUKIN|KE BERAS?", "semalam",
        { set: "dapur", cast: [{ who: "pemuda", pose: "jempol", mood: "bangga", talk: false }], event: "tidak-ada", camera: "dorong" }),
      sc(N, "FAKTANYA", "Apple sendiri bilang jangan. Butiran kecil beras malah bisa masuk ke lubang charger dan bikin rusak.", "INI|MITOS", "jangan",
        { set: "dapur", cast: [{ who: "pemuda", pose: "tepok-jidat", mood: "bingung", talk: false }], event: "salah", camera: "diam" }),
      sc(N, "YANG BENER", "Yang bener: ketuk pelan HP ke telapak tangan, lubang charger menghadap ke bawah, biar airnya keluar.", "YANG BENER|GIMANA?", "ketuk",
        { set: "kelas", cast: [{ who: "pemuda", pose: "mikir", mood: "senang", talk: false }], event: "ide", camera: "dorong" }),
      sc(N, "TERUS", "Terus taruh di tempat kering yang ada aliran udaranya. Jangan pakai hair dryer, dan jangan dicas dulu selama masih basah.", "TARUH DI|TEMPAT KERING", "kering",
        { set: "taman", cast: [{ who: "pemuda", pose: "jempol", mood: "senang", talk: false }], event: "benar", camera: "dorong" }),
      sc(N, "KOMEN", "Ngaku deh, lo pernah rendam HP di beras? Jujur di komentar.", "PERNAH RENDAM|HP DI BERAS?", "komentar",
        { set: "panggung", cast: [{ who: "pemuda", pose: "sorak", mood: "bangga", talk: false }], event: "menang", camera: "tarik" }),
    ],
    caption: "HP basah jangan dimasukin beras, Apple sendiri yang bilang. Lo pernah? Jujur di komentar.",
    hashtags: ["#fyp", "#tipshp", "#hpbasah", "#mitosvsfakta", "#viral"],
    coverText: "HP basah masukin beras?",
    coverKeyword: "beras",
  };
}

/** Contoh motivasi siluet: jatuh, istirahat, bangkit, naik selangkah demi selangkah. */
function demoMotivasi(): ScriptResult {
  const P = "pencerita";
  return {
    title: "Jatuh 7 Kali, Bangun 8 Kali",
    titleOptions: ["Jatuh 7 Kali, Bangun 8 Kali", "Gagal Lagi? Baca Ini", "Satu Langkah Lagi"],
    scenes: [
      sc(P, "GAGAL", "Gagal lagi? Rasanya kayak jatuh di tempat yang sama, berkali-kali.", "GAGAL|LAGI?", "jatuh",
        { set: "hujan", cast: [{ who: "pemuda", pose: "jatuh", mood: "siluet", talk: false }], event: "jatuh", camera: "dorong" }),
      sc(P, "ISTIRAHAT", "Nggak apa-apa. Capek itu wajar. Duduk dulu, tarik napas.", "NGGAK APA-APA.|ISTIRAHAT DULU", "wajar",
        { set: "hujan", cast: [{ who: "pemuda", pose: "duduk", mood: "siluet", talk: false }], event: "tidak-ada", camera: "dorong" }),
      sc(P, "BANGKIT", "Tapi jangan kelamaan. Yang bikin beda bukan seberapa sering kamu jatuh, tapi mau bangun lagi atau nggak.", "TAPI JANGAN|BERHENTI", "bangun",
        { set: "hujan", cast: [{ who: "pemuda", pose: "bangkit", mood: "siluet", talk: false }], event: "hujan-reda", camera: "diam" }),
      sc(P, "LANGKAH", "Mulai dari satu langkah kecil. Hari ini satu, besok satu lagi. Pelan nggak apa-apa, asal nggak berhenti.", "SATU|LANGKAH", "langkah",
        { set: "tangga", cast: [{ who: "pemuda", pose: "naik", mood: "siluet", talk: false }], event: "langkah", camera: "ikuti" }),
      sc(P, "PUNCAK", "Kata pepatah Jepang: jatuh tujuh kali, bangun delapan kali.", "JATUH 7 KALI,|BANGUN 8 KALI", "delapan",
        { set: "tangga", cast: [{ who: "pemuda", pose: "sorak", mood: "siluet", talk: false }], event: "matahari", camera: "tarik" }),
      sc(P, "KAMU", "Kamu lagi di anak tangga ke berapa sekarang? Tulis di komentar, biar kita saling semangatin.", "ANAK TANGGA|KE BERAPA?", "komentar",
        { set: "puncak", cast: [{ who: "pemuda", pose: "berdiri", mood: "siluet", talk: false }], event: "matahari", camera: "tarik" }),
    ],
    caption: "Jatuh itu wajar, yang penting bangun lagi. Kamu lagi di anak tangga ke berapa?",
    hashtags: ["#fyp", "#motivasi", "#semangat", "#quotes", "#viral"],
    coverText: "Jatuh 7 kali, bangun 8 kali",
    coverKeyword: "bangun",
  };
}
