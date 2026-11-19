import type { Channel, Character, Layout, Template, TemplateScene } from "./types";

const COMMON_RULES = [
  "Cukup satu part. Jangan pernah menulis \"part 2\" atau \"bersambung\".",
  "Penutup: pertanyaan pancingan komentar atau penjelasan langsung, lalu tagline channel.",
  "Jangan mengarang angka, kutipan, atau kejadian. Semua fakta harus dari hasil riset.",
];

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "serial-dialog",
    channelId: "kodekepo",
    name: "Serial Dialog",
    description: "KEPO nanya, PAHAM jawab. Paling pas buat topik teknis.",
    minSec: 60,
    maxSec: 75,
    characters: ["kepo", "paham"],
    scenes: [
      { speaker: "kepo", purpose: "Hook: situasi atau pertanyaan yang relate", seconds: 4 },
      { speaker: "paham", purpose: "Jawaban inti, langsung tanpa basa-basi", seconds: 9 },
      { speaker: "kepo", purpose: "Pertanyaan lanjutan ala orang awam", seconds: 5 },
      { speaker: "paham", purpose: "Cara kerja teknologinya, pakai analogi", seconds: 14 },
      { speaker: "kepo", purpose: "\"Terus gimana?\"", seconds: 6 },
      { speaker: "paham", purpose: "Langkah praktis atau dampaknya", seconds: 18 },
      { speaker: "paham", purpose: "Penutup: pertanyaan pancingan komentar dan tagline", seconds: 10 },
    ],
    rules: [
      "Kalau sudah ada pertanyaan, langsung jawab. Jangan menghitung satu, dua, tiga.",
      "Suara KEPO dan PAHAM tidak boleh tertukar, termasuk di penutup.",
      ...COMMON_RULES,
    ],
  },
  {
    id: "explainer-data",
    channelId: "kodekepo",
    name: "Explainer Data",
    description: "Buka dengan fakta yang bikin kaget, lalu bedah cara kerjanya.",
    minSec: 60,
    maxSec: 75,
    characters: ["narator"],
    scenes: [
      { speaker: "narator", purpose: "Hook: fakta atau angka paling mengejutkan dari riset", seconds: 5 },
      { speaker: "narator", purpose: "Konteks: kenapa ini penting buat penonton", seconds: 9 },
      { speaker: "narator", purpose: "Cara kerjanya, pakai analogi", seconds: 14 },
      { speaker: "narator", purpose: "Data pendukung kedua", seconds: 9 },
      { speaker: "narator", purpose: "Apa yang bisa dilakukan penonton", seconds: 14 },
      { speaker: "narator", purpose: "Penutup dan tagline", seconds: 8 },
    ],
    rules: COMMON_RULES,
  },
  {
    id: "tips-kode",
    channelId: "kodekepo",
    name: "Tips & Kode Praktis",
    description: "Trik yang bisa langsung dicoba penonton di HP-nya.",
    minSec: 45,
    maxSec: 60,
    characters: ["narator"],
    scenes: [
      { speaker: "narator", purpose: "Hook: trik yang jarang orang tahu", seconds: 4 },
      { speaker: "narator", purpose: "Trik pertama dan cara kerjanya", seconds: 12 },
      { speaker: "narator", purpose: "Trik kedua dan cara kerjanya", seconds: 12 },
      { speaker: "narator", purpose: "Trik ketiga dan cara kerjanya", seconds: 12 },
      { speaker: "narator", purpose: "Batasan atau peringatan, lalu tagline", seconds: 8 },
    ],
    rules: [...COMMON_RULES, "Hanya trik resmi dan aman, sebut kalau tergantung merek HP atau operator."],
  },
  {
    id: "listicle",
    channelId: "kodekepo",
    name: "Listicle",
    description: "Ranking atau daftar. Satu item, satu scene.",
    minSec: 45,
    maxSec: 75,
    characters: ["narator"],
    scenes: [
      { speaker: "narator", purpose: "Hook: janji daftar", seconds: 4 },
      { speaker: "narator", purpose: "Item 5", seconds: 9 },
      { speaker: "narator", purpose: "Item 4", seconds: 9 },
      { speaker: "narator", purpose: "Item 3", seconds: 9 },
      { speaker: "narator", purpose: "Item 2", seconds: 9 },
      { speaker: "narator", purpose: "Item 1", seconds: 10 },
      { speaker: "narator", purpose: "Penutup dan tagline", seconds: 6 },
    ],
    rules: COMMON_RULES,
  },
  {
    id: "motion-graphic",
    channelId: "kodekepo",
    name: "Motion Graphic",
    description: "Kartu visual 2D dengan satu narator, gaya storyboard EP.001.",
    minSec: 60,
    maxSec: 75,
    characters: ["narator"],
    scenes: [
      { speaker: "narator", purpose: "Hook: anggapan umum yang ternyata keliru", seconds: 5 },
      { speaker: "narator", purpose: "Contoh sehari-hari", seconds: 10 },
      { speaker: "narator", purpose: "Definisi singkat", seconds: 9 },
      { speaker: "narator", purpose: "Cara kerja: input, proses, hasil", seconds: 12 },
      { speaker: "narator", purpose: "Kegunaan", seconds: 10 },
      { speaker: "narator", purpose: "Batasan atau risiko", seconds: 9 },
      { speaker: "narator", purpose: "Penutup dan tagline", seconds: 6 },
    ],
    rules: COMMON_RULES,
  },
  {
    id: "micro-drama",
    channelId: "kodekepo",
    name: "Micro Drama",
    description: "Cerita berepisode. Pesan keamanan digital ada di konfliknya.",
    minSec: 60,
    maxSec: 90,
    characters: ["pencerita"],
    visualMode: "3d",
    scenes: [
      { speaker: "pencerita", purpose: "Cold open: momen paling menegangkan, langsung tanpa pengantar", seconds: 8 },
      { speaker: "pencerita", purpose: "Situasi sehari-hari keluarga sebelum kejadian", seconds: 10 },
      { speaker: "pencerita", purpose: "Tanda bahaya pertama (chat, telepon, atau notifikasi)", seconds: 12 },
      { speaker: "pencerita", purpose: "Konflik memuncak", seconds: 14 },
      { speaker: "pencerita", purpose: "Fakta keamanan digital di balik kejadian", seconds: 12 },
      { speaker: "pencerita", purpose: "Cliffhanger: pertanyaan yang bikin penonton nunggu episode berikutnya", seconds: 8 },
    ],
    rules: [
      "Format serial berepisode, bukan part 2 dari video edukasi. Akhiri dengan cliffhanger yang sudah disiapkan di cerita.",
      "Jangan memunculkan tersangka atau jawaban tanpa petunjuk sebelumnya.",
      "Jangan mengarang angka, kutipan, atau kejadian nyata. Ceritanya fiksi, faktanya dari riset.",
    ],
  },
  {
    id: "anak-kepi",
    channelId: "petualangan-kepi",
    name: "Anak: Kepi",
    description: "Cerita ringan bareng Kepi dan Bita untuk penonton cilik.",
    minSec: 60,
    maxSec: 90,
    characters: ["kepi", "bita"],
    scenes: [
      { speaker: "kepi", purpose: "Aksi langsung: Kepi menemukan sesuatu yang bikin penasaran", seconds: 8 },
      { speaker: "bita", purpose: "Bita menjelaskan apa yang terjadi", seconds: 10 },
      { speaker: "kepi", purpose: "Kepi ikut menjelajah ke dalam teknologinya", seconds: 14 },
      { speaker: "bita", purpose: "Perumpamaan sederhana", seconds: 10 },
      { speaker: "kepi", purpose: "Pelajaran hari ini dan salam penutup", seconds: 10 },
    ],
    rules: [
      "Bahasa anak-anak yang sederhana dan hangat, kalimat pendek.",
      "Tanpa konten menakutkan, tanpa ajakan membeli, tanpa meminta data pribadi.",
      "Satu pelajaran saja per video.",
    ],
  },
];


export const DEFAULT_CHARACTERS: Character[] = [
  { id: "kepo", channelId: "kodekepo", name: "KEPO", role: "Yang nanya. Mewakili rasa penasaran penonton.", style: "Cewek muda, santai, spontan, penasaran", voice: "Leda",
    look: "curious young Indonesian woman in her early 20s, shoulder length black hair, oversized lime green hoodie, expressive wide eyes",
    color: "#A4FF19", textColor: "#0F1928", group: "duo" },
  { id: "paham", channelId: "kodekepo", name: "PAHAM", role: "Yang jawab. Jelasin cara kerja pakai bahasa awam.", style: "Cowok muda, tenang, jelas, tidak menggurui", voice: "Charon",
    look: "calm young Indonesian man in his mid 20s, neat short black hair, navy jacket over white t-shirt, friendly confident smile",
    color: "#F6F8FC", textColor: "#0F1928", group: "duo" },
  { id: "narator", channelId: "kodekepo", name: "Narator", role: "Satu suara untuk Explainer Data, Tips, Listicle, dan Motion Graphic.", style: "Antusias tapi jelas", voice: "Kore",
    look: "", color: "#20DFF4", textColor: "#0F1928", group: "lain" },
  { id: "pencerita", channelId: "kodekepo", name: "Pencerita", role: "Narator cerita Grup Keluarga.", style: "Hangat, sedikit misterius, seperti pendongeng", voice: "Sulafat",
    look: "", color: "#FEB759", textColor: "#0F1928", group: "lain" },
  { id: "kepi", channelId: "petualangan-kepi", name: "Kepi", role: "Robot kecil yang penasaran dan suka menjelajah.", style: "Ceria, energik", voice: "Leda",
    look: "small round friendly robot, glossy white body, lime green glowing eyes, tiny antenna",
    color: "#A4FF19", textColor: "#0F1928", group: "duo" },
  { id: "bita", channelId: "petualangan-kepi", name: "Bita", role: "Amplop pesan yang tenang dan suka menjelaskan.", style: "Tenang, lembut", voice: "Kore",
    look: "cute living envelope character with a friendly face, soft yellow paper, small arms",
    color: "#FFC93C", textColor: "#1B1A3A", group: "duo" },
];

export const DEFAULT_CHANNELS: Channel[] = [
  {
    id: "kodekepo",
    name: "KodeKepo!",
    headerText: "KODEKEPO!",
    tagline: "Kepo dulu, paham kemudian.",
    niche: "Tech edutainment berbahasa Indonesia: jelaskan apa yang terjadi, cara kerja, kegunaan, batasan, dan dampak teknologi (AI, siber, internet, algoritma). Internet culture meets technology education.",
    audience: "Gen Z Indonesia dan pemula teknologi; di Facebook banyak bapak-ibu.",
    voiceRules: [
      "Bahasa Indonesia santai ala Gen Z, slang secukupnya, tidak lebay dan tidak kekanak-kanakan.",
      "Mudah dipahami orang awam, tapi tetap bahas cara kerja teknologinya.",
      "Hook di detik pertama: klaim besar plus angka atau ancaman langsung ke penonton. Jangan dibuka dengan sapaan.",
      "Keamanan digital hanya edukasi pencegahan, tanpa langkah eksploitasi, tanpa promosi judi online.",
    ],
    outroTeaser: "Episode depan: kita kepoin teknologi lainnya",
    outroFollow: "Follow biar nggak ketinggalan!",
    hashtagNote: "Pakai 5 hashtag yang relevan dan umum (mis. #fyp). Jangan pakai #kodekepo.",
    imageStyle: "cinematic stylized 3D animated film still, soft volumetric light, deep navy blue color grade with lime green accent lights, clean composition, shallow depth of field",
    colors: { bg: "#0C1424", card: "#16233A", accent: "#A4FF19", accent2: "#FEB759", text: "#F6F8FC", muted: "#AEBBD0", outroBg: "#F6F8FC", outroText: "#0F1928" },
    font: "jakarta",
    visualMode: "cards",
    layout: "kartu",
    showHeader: false,
    grid: true,
    bgmPreset: "tech",
    bgmVolume: 0.1,
  },
  {
    id: "petualangan-kepi",
    name: "Petualangan Kepi",
    headerText: "PETUALANGAN KEPI",
    tagline: "Yuk, belajar sambil main!",
    niche: "Cerita pendek menghibur untuk anak-anak tentang cara kerja teknologi sehari-hari, dipandu robot kecil Kepi dan amplop pesan Bita.",
    audience: "Anak-anak SD dan orang tua yang menonton bersama.",
    voiceRules: [
      "Bahasa anak-anak yang sederhana dan hangat, kalimat pendek.",
      "Langsung masuk ke aksi di detik pertama, jangan dibuka dengan kartu judul.",
      "Tanpa konten menakutkan, tanpa ajakan membeli, tanpa meminta data pribadi.",
    ],
    outroTeaser: "Sampai jumpa di petualangan berikutnya!",
    outroFollow: "Subscribe bareng orang tua, ya!",
    hashtagNote: "Pakai hashtag ramah keluarga. Tandai video sebagai konten anak saat upload ke YouTube.",
    imageStyle: "bright colorful stylized 3D animated film still for kids, soft rounded shapes, warm sunny light, playful and friendly",
    colors: { bg: "#1B1A3A", card: "#2A2858", accent: "#FFC93C", accent2: "#7EE0FF", text: "#FFFFFF", muted: "#C9C6F0", outroBg: "#FFF6DE", outroText: "#1B1A3A" },
    font: "jakarta",
    visualMode: "3d",
    layout: "kartu",
    showHeader: false,
    grid: false,
    bgmPreset: "ceria",
    bgmVolume: 0.12,
  },
];

/** Nama voice prebuilt Gemini TTS (lihat ai.google.dev/gemini-api/docs/speech-generation). */
export const GEMINI_VOICES = [
  "Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Aoede", "Callirrhoe", "Autonoe",
  "Enceladus", "Iapetus", "Umbriel", "Algieba", "Despina", "Erinome", "Algenib", "Rasalgethi", "Laomedeia", "Achernar",
  "Alnilam", "Schedar", "Gacrux", "Pulcherrima", "Achird", "Zubenelgenubi", "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat",
];



/* ---------------- tampilan video ---------------- */

export const LAYOUTS: { id: Layout; name: string; desc: string }[] = [
  { id: "kartu", name: "Kartu gelap", desc: "Latar gelap brand, judul bab, kartu motion graphic. Cocok untuk explainer & berita." },
  { id: "layar", name: "Layar HP terang", desc: "Latar terang penuh dengan HP besar di tengah. Cocok untuk tips yang bisa langsung dicek penonton." },
  { id: "teks", name: "Teks besar", desc: "Kalimat besar di tengah layar, kata per kata. Cocok untuk daftar, fakta cepat, dan cerita POV." },
  { id: "horor", name: "Horor kartun", desc: "Kartun 2D bergaris tebal: tokoh berekspresi, set kampung malam hari, cap waktu, kotak voting di akhir. Untuk serial cerita seram." },
  { id: "stickman", name: "Stickman ekspresif", desc: "Stickman dengan ekspresi besar, properti, set berwarna, dan efek kaget. Cocok untuk mitos vs fakta dan tips lucu." },
  { id: "motivasi", name: "Motivasi siluet", desc: "Siluet sinematik dari hujan ke matahari terbit, tangga, dan puncak. Untuk konten motivasi singkat." },
];

/* ---------------- galeri template (bisa dipakai channel mana pun) ---------------- */

/** Peran di preset galeri. Saat disalin ke channel, peran dipetakan ke karakter channel itu. */
export type PresetRole = "utama" | "penanya" | "penjawab";
export type TemplatePreset = Omit<Template, "id" | "channelId" | "characters" | "scenes"> & {
  id: string;
  /** contoh topik, ditampilkan di galeri */
  example: string;
  scenes: (Omit<TemplateScene, "speaker"> & { speaker: PresetRole })[];
};

const HOOK_RULES = [
  "Detik 0-2: kerugian atau kejutan yang langsung kena ke penonton, plus visual yang sama. Jangan dibuka dengan sapaan atau perintah.",
  "Detik 2-5: janjikan satu hal yang baru dibuka di akhir supaya penonton bertahan.",
  "Detik 5: langsung masuk isi, tanpa pengantar.",
];

const STORY_RULES = [
  "Cerita fiksi utuh: tiap scene adalah akibat scene sebelumnya, tokoh dan tempat konsisten, petunjuk ditanam sebelum kejutan.",
  "Jangan menyebut kejadian, orang, atau desa nyata sebagai fakta. Legenda daerah diceritakan dengan hormat.",
];

export const TEMPLATE_LIBRARY: TemplatePreset[] = [
  {
    id: "horor-kartun",
    name: "Horor Kartun Serial",
    description: "Cerita seram satu pencerita bergaya kartun 2D: cold open, mundur waktu, larangan, teror, lalu voting penonton.",
    example: "KKN: jangan buka jendela kalau ada yang ngetuk",
    minSec: 50,
    maxSec: 75,
    layout: "horor",
    kind: "cerita",
    scenes: [
      { speaker: "utama", purpose: "Cold open: momen paling seram dari puncak cerita, sebut jam dan tempatnya", seconds: 6 },
      { speaker: "utama", purpose: "Mundur waktu (\"beberapa jam sebelumnya\"): kenalkan tokoh dan perjalanan ke lokasi", seconds: 8 },
      { speaker: "utama", purpose: "Warga lokal memberi satu larangan yang jelas", seconds: 9 },
      { speaker: "utama", purpose: "Petunjuk kedua: warga lain membisikkan alasan larangan itu", seconds: 9 },
      { speaker: "utama", purpose: "Tanda pertama muncul malam hari", seconds: 9 },
      { speaker: "utama", purpose: "Puncak: kejadian di cold open terulang lengkap dengan satu kejutan baru", seconds: 9 },
      { speaker: "utama", purpose: "Penutup: tanya penonton akan memilih apa (2-3 pilihan) dan minta jawab di komentar", seconds: 6 },
    ],
    rules: [
      "Pencerita orang pertama (\"aku\"). Tokoh lain disebut namanya dan tampil sebagai tokoh kartun.",
      "Cold open dan puncak adalah momen yang sama; jam di stamp harus cocok.",
      "Scene terakhir: visual.kind steps, items berisi 2-3 pilihan voting yang pendek.",
      ...STORY_RULES,
      ...COMMON_RULES.slice(0, 2),
    ],
  },
  {
    id: "stickman-mitos",
    name: "Stickman Mitos vs Fakta",
    description: "Stickman ekspresif memerankan kebiasaan yang salah, lalu stempel MITOS dan cara yang benar.",
    example: "HP basah dimasukin ke beras?",
    minSec: 35,
    maxSec: 55,
    layout: "stickman",
    scenes: [
      { speaker: "utama", purpose: "Hook: kejadian sehari-hari yang bikin panik, langsung di detik pertama", seconds: 4 },
      { speaker: "utama", purpose: "Kebiasaan atau anggapan yang umum dilakukan orang", seconds: 6 },
      { speaker: "utama", purpose: "Faktanya dari sumber resmi (event salah)", seconds: 8 },
      { speaker: "utama", purpose: "Cara yang benar, langkah pertama (event ide)", seconds: 8 },
      { speaker: "utama", purpose: "Langkah berikutnya dan yang harus dihindari (event benar)", seconds: 8 },
      { speaker: "utama", purpose: "Penutup: pertanyaan pancingan komentar (set panggung, event menang)", seconds: 5 },
    ],
    rules: [...HOOK_RULES, "Sebut sumber resmi faktanya di kalimat (mis. \"Apple sendiri bilang\").", ...COMMON_RULES],
  },
  {
    id: "motivasi-siluet",
    name: "Motivasi Siluet",
    description: "Pesan motivasi singkat: jatuh, istirahat, bangkit, satu langkah kecil, kalimat kunci, pertanyaan ke penonton.",
    example: "Gagal berkali-kali? Jatuh 7 kali, bangun 8 kali",
    minSec: 30,
    maxSec: 50,
    layout: "motivasi",
    kind: "cerita",
    scenes: [
      { speaker: "utama", purpose: "Hook: rasa gagal atau lelah yang relate (pose jatuh, set hujan)", seconds: 4 },
      { speaker: "utama", purpose: "Validasi: wajar capek, boleh istirahat (pose duduk)", seconds: 6 },
      { speaker: "utama", purpose: "Titik balik: alasan untuk bangkit (pose bangkit, event hujan-reda)", seconds: 7 },
      { speaker: "utama", purpose: "Satu langkah kecil yang konkret bisa dilakukan hari ini (set tangga, pose naik, event langkah)", seconds: 8 },
      { speaker: "utama", purpose: "Kalimat kunci yang layak di-screenshot (pose sorak, event matahari)", seconds: 6 },
      { speaker: "utama", purpose: "Penutup: pertanyaan ke penonton soal kondisinya sekarang", seconds: 5 },
    ],
    rules: [
      "Bicara ke \"kamu\" dengan hangat, kalimat pendek, tanpa menggurui dan tanpa klise berlebihan.",
      "Kalimat bijak ditulis sebagai kalimat sendiri atau \"pepatah\", jangan dikaitkan ke tokoh terkenal.",
      "Jangan menjanjikan kesuksesan, uang, atau hasil tertentu.",
      ...COMMON_RULES.slice(0, 2),
    ],
  },
  {
    id: "cek-sekarang",
    name: "Cek Sekarang",
    description: "Satu setting atau trik yang bisa langsung dicoba penonton di HP-nya. Format paling ramai di KodeKepo!",
    example: "Pesan WA yang dihapus masih bisa dibaca",
    minSec: 45,
    maxSec: 65,
    layout: "layar",
    scenes: [
      { speaker: "utama", purpose: "Hook: kerugian/kejutan + visual layar yang dibahas (0-2 detik)", seconds: 3 },
      { speaker: "utama", purpose: "Janji: satu hal penting yang dibuka di akhir", seconds: 3 },
      { speaker: "utama", purpose: "Langkah persis: nama menu satu per satu, plus jalur merek lain", seconds: 12 },
      { speaker: "utama", purpose: "Kenapa bisa: cara kerja teknologinya dengan bahasa awam", seconds: 10 },
      { speaker: "utama", purpose: "Payoff jujur: syarat, batasan, atau peringatan", seconds: 10 },
      { speaker: "utama", purpose: "Penutup: pertanyaan pancingan komentar", seconds: 5 },
    ],
    rules: [...HOOK_RULES, "Nama menu ditulis persis seperti di HP. Sebut kalau beda per merek atau versi.", ...COMMON_RULES],
  },
  {
    id: "arti-tanda",
    name: "Arti Tanda Misterius",
    description: "Lampu, ikon, atau kode kecil di perangkat sehari-hari dan artinya. Pola video meteran & lampu modem.",
    example: "Arti lampu di modem WiFi rumah",
    minSec: 50,
    maxSec: 70,
    layout: "layar",
    scenes: [
      { speaker: "utama", purpose: "Hook: tanda yang bikin panik + akibatnya kalau salah paham", seconds: 4 },
      { speaker: "utama", purpose: "Janji: satu cek yang sering menyelesaikan masalah", seconds: 3 },
      { speaker: "utama", purpose: "Tanda pertama: normalnya bagaimana, kalau beda artinya apa", seconds: 11 },
      { speaker: "utama", purpose: "Tanda kedua", seconds: 11 },
      { speaker: "utama", purpose: "Tanda ketiga", seconds: 11 },
      { speaker: "utama", purpose: "Payoff: kapan cukup dicoba sendiri, kapan harus lapor", seconds: 10 },
      { speaker: "utama", purpose: "Penutup: tanya kondisi perangkat penonton sekarang", seconds: 4 },
    ],
    rules: [...HOOK_RULES, "Bedakan jelas: kapan cukup restart/coba sendiri, kapan harus hubungi resmi.", ...COMMON_RULES],
  },
  {
    id: "berita-cepat",
    name: "Berita Cepat",
    description: "Kejadian yang lagi ramai, dijelaskan cara kerjanya dan dampaknya ke penonton.",
    example: "Layanan Microsoft tumbang global",
    minSec: 50,
    maxSec: 70,
    layout: "kartu",
    scenes: [
      { speaker: "utama", purpose: "Hook: angka atau kejadian paling besar dari berita", seconds: 4 },
      { speaker: "utama", purpose: "Apa yang terjadi, kapan, siapa yang kena", seconds: 10 },
      { speaker: "utama", purpose: "Kenapa bisa: cara kerja teknologinya", seconds: 13 },
      { speaker: "utama", purpose: "Dampaknya ke penonton", seconds: 10 },
      { speaker: "utama", purpose: "Yang bisa dilakukan sekarang", seconds: 10 },
      { speaker: "utama", purpose: "Penutup: pertanyaan pancingan komentar", seconds: 5 },
    ],
    rules: [...HOOK_RULES, "Sebut tanggal dan sumber berita. Bedakan fakta resmi dan dugaan.", ...COMMON_RULES],
  },
  {
    id: "mitos-fakta",
    name: "Mitos vs Fakta",
    description: "Patahkan anggapan umum yang salah dengan bukti dan cara kerjanya.",
    example: "Ngecas HP semalaman bikin baterai rusak?",
    minSec: 45,
    maxSec: 65,
    layout: "kartu",
    scenes: [
      { speaker: "utama", purpose: "Hook: mitos yang dipercaya banyak orang", seconds: 4 },
      { speaker: "utama", purpose: "Kenapa orang percaya", seconds: 8 },
      { speaker: "utama", purpose: "Faktanya, dengan bukti dari riset", seconds: 12 },
      { speaker: "utama", purpose: "Cara kerja teknologinya", seconds: 12 },
      { speaker: "utama", purpose: "Yang sebaiknya dilakukan", seconds: 9 },
      { speaker: "utama", purpose: "Penutup: tanya mitos lain yang penonton dengar", seconds: 5 },
    ],
    rules: [...HOOK_RULES, ...COMMON_RULES],
  },
  {
    id: "top-3",
    name: "Top 3 Hitung Mundur",
    description: "Tiga item, dari yang paling biasa ke yang paling mengejutkan.",
    example: "3 fitur tersembunyi di WhatsApp",
    minSec: 40,
    maxSec: 60,
    layout: "teks",
    scenes: [
      { speaker: "utama", purpose: "Hook: janji item nomor 1 paling mengejutkan", seconds: 4 },
      { speaker: "utama", purpose: "Nomor 3", seconds: 11 },
      { speaker: "utama", purpose: "Nomor 2", seconds: 11 },
      { speaker: "utama", purpose: "Nomor 1, yang paling mengejutkan", seconds: 13 },
      { speaker: "utama", purpose: "Penutup: tanya nomor berapa yang penonton belum tahu", seconds: 5 },
    ],
    rules: [...HOOK_RULES, "Satu item, satu scene. Jangan menghitung tanpa isi.", ...COMMON_RULES],
  },
  {
    id: "pov-cerita",
    name: "POV Cerita Singkat",
    description: "Cerita orang pertama yang relate, pelajaran teknologinya di akhir.",
    example: "POV: lo dapet chat dari nomor mirip bank",
    minSec: 45,
    maxSec: 70,
    layout: "teks",
    scenes: [
      { speaker: "utama", purpose: "Hook: \"POV: ...\" momen paling menegangkan", seconds: 5 },
      { speaker: "utama", purpose: "Kejadian berkembang", seconds: 12 },
      { speaker: "utama", purpose: "Titik balik: tanda yang hampir terlewat", seconds: 12 },
      { speaker: "utama", purpose: "Pelajaran teknologinya, cara kerja di baliknya", seconds: 12 },
      { speaker: "utama", purpose: "Penutup: tanya pengalaman penonton", seconds: 5 },
    ],
    rules: [...HOOK_RULES, "Ceritanya fiksi, faktanya dari riset. Jangan menyebut orang atau merek nyata sebagai pelaku.", ...COMMON_RULES],
  },
  {
    id: "tanya-jawab",
    name: "Tanya Jawab Duo",
    description: "Satu tokoh nanya, satu tokoh jawab. Butuh dua karakter di channel.",
    example: "Kenapa OTP nggak boleh dikasih ke siapa pun",
    minSec: 55,
    maxSec: 75,
    layout: "kartu",
    scenes: [
      { speaker: "penanya", purpose: "Hook: situasi atau pertanyaan yang relate", seconds: 4 },
      { speaker: "penjawab", purpose: "Jawaban inti, langsung tanpa basa-basi", seconds: 9 },
      { speaker: "penanya", purpose: "Pertanyaan lanjutan ala orang awam", seconds: 5 },
      { speaker: "penjawab", purpose: "Cara kerja teknologinya, pakai analogi", seconds: 14 },
      { speaker: "penanya", purpose: "\"Terus gimana?\"", seconds: 5 },
      { speaker: "penjawab", purpose: "Langkah praktis atau dampaknya", seconds: 16 },
      { speaker: "penjawab", purpose: "Penutup: pertanyaan pancingan komentar", seconds: 6 },
    ],
    rules: ["Suara tiap tokoh tidak boleh tertukar, termasuk di penutup.", ...HOOK_RULES, ...COMMON_RULES],
  },
];

/** Salin preset galeri ke channel: peran dipetakan ke karakter channel itu. */
export function presetToTemplate(preset: TemplatePreset, channelId: string, chars: Character[], id: string): Template {
  const duo = chars.filter((c) => c.group === "duo");
  const storyteller = preset.kind === "cerita" ? chars.find((c) => /cerita/i.test(c.id + " " + c.name)) : undefined;
  const solo = storyteller || chars.find((c) => c.group === "lain") || chars[0];
  const map: Record<PresetRole, string> = {
    utama: (solo || chars[0]).id,
    penanya: (duo[0] || chars[0]).id,
    penjawab: (duo[1] || chars[1] || chars[0]).id,
  };
  const scenes = preset.scenes.map((s) => ({ ...s, speaker: map[s.speaker] }));
  const { example: _e, id: presetId, ...rest } = preset;
  return { ...rest, id, channelId, preset: presetId, characters: [...new Set(scenes.map((s) => s.speaker))], scenes };
}
