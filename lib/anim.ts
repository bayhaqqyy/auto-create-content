/**
 * Daftar arahan untuk tampilan animasi 2D (horor kartun, stickman ekspresif, motivasi siluet).
 * Dipakai di tiga tempat: prompt naskah (AI memilih dari daftar ini), sanitasi hasil AI, dan renderer Remotion.
 */
import type { AnimDirection, AnimLayout, Look2D } from "./types";

export const ANIM_LAYOUTS: AnimLayout[] = ["horor", "stickman", "motivasi"];
export const isAnimLayout = (l?: string): l is AnimLayout => !!l && (ANIM_LAYOUTS as string[]).includes(l);

type Opt = { id: string; desc: string };

export const ANIM_SETS: Record<AnimLayout, Opt[]> = {
  horor: [
    { id: "kamar", desc: "kamar kayu malam hari, jendela berdaun, dipan, pelita minyak" },
    { id: "posko", desc: "rumah panggung kayu di kampung saat senja, tangga, pintu menyala" },
    { id: "warung", desc: "warung kampung: rak toples, jajanan tergantung, meja kayu, lampu bohlam" },
    { id: "sungai", desc: "perahu klotok di sungai saat matahari terbenam, hutan di seberang" },
    { id: "jalan", desc: "jalan setapak kampung malam hari, tiang lampu redup, pohon gelap" },
    { id: "rumah-tua", desc: "rumah tua kosong di bawah bulan purnama, pagar rusak" },
    { id: "hutan", desc: "hutan lebat malam hari berkabut, akar besar" },
    { id: "kartu", desc: "layar hitam berisi teks keterangan waktu, mis. \"6 JAM SEBELUMNYA…\"" },
  ],
  stickman: [
    { id: "kamar", desc: "kamar kuning dengan jendela" },
    { id: "dapur", desc: "dapur biru dengan keramik" },
    { id: "kantor", desc: "kantor: meja, laptop, tanaman" },
    { id: "kelas", desc: "ruang kelas dengan papan tulis" },
    { id: "jalan", desc: "trotoar kota siang hari" },
    { id: "taman", desc: "taman hijau dengan pohon" },
    { id: "panggung", desc: "latar ungu dengan sinar berputar, untuk penutup atau momen menang" },
  ],
  motivasi: [
    { id: "hujan", desc: "senja mendung berhujan, tanah datar" },
    { id: "tangga", desc: "anak tangga besar menuju puncak" },
    { id: "puncak", desc: "puncak bukit dengan matahari terbit di belakang" },
    { id: "kota", desc: "siluet gedung kota" },
    { id: "jalan", desc: "jalan panjang menuju cakrawala" },
  ],
};

export const ANIM_POSES: Record<AnimLayout, Opt[]> = {
  horor: [
    { id: "berdiri", desc: "berdiri tangan di samping" },
    { id: "duduk", desc: "duduk" },
    { id: "hp", desc: "memegang HP dengan dua tangan" },
    { id: "ransel", desc: "memegang tali ransel" },
    { id: "angkat", desc: "mengangkat satu tangan (menyapa / protes)" },
    { id: "tunjuk", desc: "menunjuk ke samping" },
    { id: "minum", desc: "memegang gelas" },
    { id: "bisik", desc: "tangan di dekat mulut, berbisik" },
    { id: "peluk", desc: "memeluk badan sendiri, ketakutan" },
    { id: "dorong", desc: "dua tangan terangkat ke depan, menahan" },
    { id: "tidur", desc: "tidur di lantai dalam sarung" },
  ],
  stickman: [
    { id: "berdiri", desc: "berdiri santai" },
    { id: "jalan", desc: "berjalan" },
    { id: "lari", desc: "berlari panik" },
    { id: "hp", desc: "melihat HP" },
    { id: "kaget", desc: "dua tangan ke atas, kaget" },
    { id: "tersandung", desc: "tersandung ke depan" },
    { id: "mikir", desc: "tangan di dagu, berpikir" },
    { id: "tepok-jidat", desc: "menepuk jidat" },
    { id: "tunjuk", desc: "menunjuk ke depan" },
    { id: "pegang", desc: "memegang sesuatu di depan dada" },
    { id: "jempol", desc: "mengacungkan jempol" },
    { id: "sorak", desc: "dua tangan ke atas, senang" },
  ],
  motivasi: [
    { id: "berdiri", desc: "berdiri tegak" },
    { id: "jalan", desc: "berjalan pelan" },
    { id: "lari", desc: "berlari" },
    { id: "jatuh", desc: "terpeleset dan jatuh" },
    { id: "duduk", desc: "duduk menunduk" },
    { id: "bangkit", desc: "bangkit dari duduk" },
    { id: "kepal", desc: "berdiri sambil mengepalkan tangan ke atas" },
    { id: "naik", desc: "menaiki anak tangga satu per satu" },
    { id: "sorak", desc: "dua tangan ke atas di puncak" },
  ],
};

export const ANIM_MOODS: Record<AnimLayout, Opt[]> = {
  horor: [
    { id: "tenang", desc: "biasa" }, { id: "senang", desc: "senyum lebar" }, { id: "curiga", desc: "alis miring" },
    { id: "cemas", desc: "alis turun, keringat" }, { id: "kaget", desc: "mata melotot, mulut terbuka" },
    { id: "tegas", desc: "serius, memperingatkan" }, { id: "seram", desc: "senyum aneh menyeramkan" },
  ],
  stickman: [
    { id: "senang", desc: "senyum" }, { id: "bangga", desc: "nyengir, pipi merah" }, { id: "kaget", desc: "mata bulat, mulut O" },
    { id: "panik", desc: "mulut terbuka, keringat" }, { id: "bingung", desc: "mata sipit, mulut bergelombang" },
    { id: "sedih", desc: "cemberut" }, { id: "marah", desc: "alis marah" }, { id: "datar", desc: "tanpa ekspresi" }, { id: "pingsan", desc: "mata X" },
  ],
  motivasi: [{ id: "siluet", desc: "siluet tanpa wajah" }],
};

export const ANIM_EVENTS: Record<AnimLayout, Opt[]> = {
  horor: [
    { id: "tidak-ada", desc: "tanpa kejadian khusus" },
    { id: "ketukan", desc: "suara ketukan: tulisan TOK! besar dan kamera bergetar" },
    { id: "lampu-merah", desc: "cahaya merah melayang di kejauhan (di jendela atau di langit)" },
    { id: "mata-merah", desc: "sosok gelap bermata merah muncul (di jendela kalau set kamar)" },
    { id: "lampu-mati", desc: "lampu/pelita padam, ruangan gelap" },
    { id: "bayangan", desc: "bayangan hitam melintas cepat" },
  ],
  stickman: [
    { id: "tidak-ada", desc: "tanpa kejadian khusus" },
    { id: "kaget", desc: "guncangan + kilat putih" },
    { id: "ide", desc: "bohlam ide muncul di atas kepala" },
    { id: "salah", desc: "stempel merah SALAH/MITOS" },
    { id: "benar", desc: "centang hijau besar" },
    { id: "menang", desc: "sinar berputar dan konfeti" },
    { id: "keringat", desc: "tetesan keringat dan garis panik" },
  ],
  motivasi: [
    { id: "tidak-ada", desc: "tanpa kejadian khusus" },
    { id: "jatuh", desc: "guncangan saat jatuh" },
    { id: "hujan-reda", desc: "hujan berhenti" },
    { id: "matahari", desc: "matahari terbit dan cahaya memancar" },
    { id: "langkah", desc: "penghitung langkah naik (pakai screenText baris kedua sebagai label)" },
  ],
};

export const ANIM_CAMERA = ["diam", "dorong", "tarik", "guncang", "ikuti"] as const;

/** Tokoh siap pakai untuk horor kartun. Karakter channel bisa punya tampilan sendiri (Character.look2d). */
export const LOOK_PRESETS: Record<string, Look2D & { label: string }> = {
  "pemuda": { label: "Pemuda (jaket almamater)", skin: "#C98A5E", hair: "short", hairCol: "#1E1A1A", top: "#F4F1EA", jacket: "#2F6B57", sleeve: "long", bottom: "pants", bottomCol: "#3B4252", shoe: "#F1EFEA" },
  "pemuda-kaos": { label: "Pemuda kaos merah, rambut keriting", skin: "#A86F48", hair: "curly", hairCol: "#16120F", top: "#C8453B", sleeve: "short", bottom: "pants", bottomCol: "#2E3440", shoe: "#2B2B2B" },
  "pemudi-hijab": { label: "Pemudi berhijab, berkacamata", skin: "#D9A07A", hair: "hijab", hairCol: "#1E1A1A", hijabCol: "#B87BB0", top: "#F4F1EA", jacket: "#2F6B57", sleeve: "long", bottom: "skirt", bottomCol: "#4A5068", shoe: "#F1EFEA", glasses: true },
  "pemudi": { label: "Pemudi rambut sanggul", skin: "#D9A07A", hair: "bun", hairCol: "#1E1A1A", top: "#E7A33E", sleeve: "long", bottom: "pants", bottomCol: "#3B4252", shoe: "#F1EFEA" },
  "bapak-tua": { label: "Bapak tua berpeci, sarung", skin: "#B07A52", hair: "peci", hairCol: "#D9D4CC", top: "#8A5A2E", topPattern: "batik", sleeve: "long", bottom: "sarung", bottomCol: "#3D5A80", shoe: "#5A3A2A", mustache: "#E7E2DA", wrinkles: true, thin: true },
  "ibu-tua": { label: "Ibu tua, kain di leher", skin: "#C99070", hair: "bun", hairCol: "#1E1A1A", top: "#6B3F8C", sleeve: "long", bottom: "skirt", bottomCol: "#3B2A4F", shoe: "#5A3A2A", neckCloth: "#C2452D", wrinkles: true },
  "bapak": { label: "Bapak berkemeja", skin: "#B98058", hair: "short", hairCol: "#2A2522", top: "#4C7BB0", sleeve: "long", bottom: "pants", bottomCol: "#2E3440", shoe: "#2B2B2B", mustache: "#2A2522" },
};

/** Sanitasi arahan animasi dari AI supaya renderer selalu dapat nilai yang dikenal. */
export function cleanAnim(a: Partial<AnimDirection> | undefined, layout: AnimLayout, castIds: string[]): AnimDirection {
  const pick = (v: string | undefined, list: Opt[], def: string) => (list.some((o) => o.id === v) ? v! : def);
  const sets = ANIM_SETS[layout], poses = ANIM_POSES[layout], moods = ANIM_MOODS[layout], events = ANIM_EVENTS[layout];
  const cast = (a?.cast || []).slice(0, layout === "horor" ? 4 : 2).map((c) => ({
    who: castIds.includes(c?.who) ? c.who : castIds[0] || "pemuda",
    pose: pick(c?.pose, poses, poses[0].id),
    mood: pick(c?.mood, moods, moods[0].id),
    talk: !!c?.talk,
  }));
  return {
    set: pick(a?.set, sets, sets[0].id),
    cast: cast.length || a?.set === "kartu" ? cast : [{ who: castIds[0] || "pemuda", pose: poses[0].id, mood: moods[0].id, talk: false }],
    event: pick(a?.event, events, "tidak-ada"),
    camera: (ANIM_CAMERA as readonly string[]).includes(a?.camera || "") ? a!.camera : "dorong",
    stamp: typeof a?.stamp === "string" ? a.stamp.slice(0, 60) : undefined,
  };
}

/** Bagian prompt yang menjelaskan pilihan animasi ke penulis naskah. */
export function animPromptSection(layout: AnimLayout, castIds: { id: string; desc: string }[]) {
  const list = (o: Opt[]) => o.map((x) => `${x.id} (${x.desc})`).join("; ");
  const horor = layout === "horor";
  return `ARAHAN ANIMASI (field anim di tiap scene, WAJIB diisi dan harus cocok dengan kalimat scene itu):
- anim.set, pilih satu: ${list(ANIM_SETS[layout])}.
- anim.cast: ${horor ? "1-4" : "1-2"} tokoh yang tampil. who pilih dari: ${castIds.map((c) => `${c.id} (${c.desc})`).join("; ")}.
  pose pilih dari: ${list(ANIM_POSES[layout])}.
  ${layout === "motivasi" ? "mood selalu siluet." : `mood pilih dari: ${list(ANIM_MOODS[layout])}.`}
  talk=true untuk tokoh yang sedang berbicara di scene itu.
- anim.event, pilih satu: ${list(ANIM_EVENTS[layout])}.
- anim.camera: diam, dorong (pelan mendekat), tarik (menjauh), guncang (untuk kaget/ketukan), ikuti.
${horor ? "- anim.stamp: keterangan pojok kiri atas \"HARI | JAM | TEMPAT\", mis. \"SELASA | 20.47 | POSKO KKN\". Jam harus maju sesuai alur cerita.\n" : ""}- Tokoh, pakaian, dan tempat harus KONSISTEN antar scene. Jangan memunculkan tokoh baru tanpa diperkenalkan.`;
}
