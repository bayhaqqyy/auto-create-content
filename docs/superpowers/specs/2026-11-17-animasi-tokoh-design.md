# Video animasi tokoh: Fun Fact, Storytelling, dan Serial

Tanggal: 2026-11-17 (revisi 2) · Status: draft, menunggu persetujuan

## Kenapa

Pemilik studio akan membuat tiga channel baru (selain KodeKepo! dan Petualangan Kepi):
**fun fact**, **serial drama horror**, dan **motivasi**.
Sekarang app hanya bisa membuat video dengan dua gaya visual, yaitu kartu motion graphic dan gambar 3D AI (berbayar). Dua-duanya tidak cocok untuk channel bercerita dengan tokoh.

Pemilik ingin video **bertokoh animasi** dengan beberapa pilihan gaya. Enam contoh 10 detik sudah dibuat dan dilihat:
https://claude.ai/artifact/WfXjVyJheH5LV3wKPKT8dM. Gayanya stickman kertas, stickman kapur, horror siluet, neon, kartun 2D, dan cat air.
Semua contoh memakai engine skill animation-studio (MIT, Afaq Rashid). Kodenya ada di `~/style-samples`.

Hasil riset (2026-11-16/17):
- Channel stickman menang di hook, tempo, dan cliffhanger, bukan di kualitas gambar.
- Untuk horror, tokoh polos tanpa wajah di ruangan gelap menambah rasa takut.
- Motivasi paling sering ramai sebagai satu kutipan atau cerita singkat 15–30 detik.
- Micro-drama serial (puluhan episode) sedang naik.

## Keputusan pemilik

- **Gaya tokoh bebas**: setiap channel atau video boleh memakai gaya mana saja. Gaya tidak dikunci per channel.
- **Jumlah tokoh mengikuti jenis video:**
  - **Fun fact** dan **storytelling**: **satu tokoh** sebagai aktor yang memperagakan narasi.
  - **Motivasi = storytelling**: satu tokoh.
  - **Serial**: memakai **tokoh tetap milik serial itu**, dan tokohnya harus sama dari episode ke episode. Kalau adegannya dialog, tokoh-tokoh itu berdialog (dua tokoh di layar).
- Pendekatan teknis **A**: menggambar di dalam Remotion yang sudah dipakai app, memakai alat gambar animation-studio. Bukan engine kedua (B), dan bukan gambar AI (C).

## Tujuan

1. **Gaya visual baru "Animasi"** di menu Visual (di samping Kartu dan 3D AI). Ada lima **tampilan**:
   `kertas` (pensil di kertas), `kapur` (papan tulis), `gelap` (horror: gelap, lampu, vignette berat), `neon`, `cat air`.
2. **Rupa tokoh per karakter**: setiap karakter channel punya rupa animasi, yaitu **stickman** (warna dan satu ciri: kuncir, kacamata, topi, pita, rambut berdiri) atau **kartun 2D** (rambut, warna kulit, baju, kacamata, dan seterusnya, dari `Ch.person`). Halaman Karakter menampilkan pratinjau rupa secara langsung.
3. **Tiga template baru** yang bisa ditambahkan ke channel mana pun:
   - **Fun Fact**: hook → 3 fakta → fakta paling mengejutkan → penutup. Wajib riset dan sumber (aturan yang sudah ada).
   - **Storytelling**: satu narator, satu tokoh. Hook → konflik → titik balik → pesan/penutup. Dipakai untuk motivasi dan cerita pendek. Tanpa riset web; isinya fiksi atau reflektif dan tidak boleh berisi klaim fakta atau angka.
   - **Serial (episode)**: tokoh tetap dari serial. Narator dan/atau dialog antar-tokoh. Diakhiri cliffhanger. Tanpa riset web.
4. **Serial berkelanjutan**: app menyimpan *serial* (judul, premis, daftar tokoh, ringkasan tiap episode). Saat membuat episode baru, Claude menerima premis, tokoh, dan ringkasan episode sebelumnya, lalu menulis episode lanjutan. Ringkasan episode baru disimpan otomatis setelah naskah jadi.
5. **Akting per scene**: Claude memilih untuk tiap scene pose/gestur, properti, ekspresi, dan latar dari daftar tetap. Tokoh bernapas, mulutnya bergerak mengikuti subtitle, dan pose berpindah dengan halus.
6. Tetap memakai suara Gemini TTS, subtitle, header, outro, dan BGM channel yang sudah ada. Tanpa biaya AI gambar.

## Bukan tujuan (tahap ini)

- Lebih dari dua tokoh di layar dalam satu scene.
- Tokoh yang saling bersentuhan (berpelukan, berkelahi), adegan aksi kompleks, dan jalan lintas latar.
- Musik sintetis animation-studio. BGM channel tetap dipakai.
- Posting ke media sosial.
- Mengubah gaya Kartu dan 3D yang sudah ada.

## Anti-tujuan (gagal walaupun "jalan")

- Tokoh berubah rupa antar-episode dalam satu serial.
- Tokoh diam atau kaku seperti clip-art. Setiap scene harus ada gerak dan akting yang berbeda.
- Fun Fact mengarang fakta. Storytelling atau serial menyelipkan klaim fakta atau angka yang tidak diriset.
- Teks menabrak kepala tokoh, atau teks penting jatuh di zona yang tertutup UI TikTok (bawah 22%, kanan 140 px). Ini bug yang terlihat di contoh pertama dan sudah diperbaiki di contoh.

## Batasan

- Render Remotion yang sudah ada, 1080×1920, 30 fps, di Docker (Chrome headless milik Remotion). Chrome di host macet, jadi semua render dan tes di container.
- Naskah ditulis Claude (`lib/claude.ts`), suara memakai Gemini TTS.
- Kode animation-studio yang dipakai wajib menyertakan lisensi MIT dan atribusi.
- Waktu render target kurang dari atau sama dengan 2× gaya Kartu.

## Pendekatan

| | Pendekatan | Untung | Rugi |
|---|---|---|---|
| **A (dipilih)** | Engine gambar animation-studio (`util.js`, `gfx.js`, `chars.js`: fungsi canvas murni berbasis waktu) dipakai di Remotion. Satu komponen `<canvas>` memanggil fungsi gambar per frame. | Satu alur: TTS, subtitle, brand kit, editor, dan BGM tetap. Semua tampilan dan rupa dari contoh tersedia. | Engine berbentuk skrip global (IIFE). Perlu dibungkus agar bisa di-import di bundel Remotion. |
| B | Engine animation-studio sebagai renderer kedua | Tidak perlu membungkus engine | Suara, subtitle, brand kit, dan editor harus dibuat ulang. Dua mesin render. |
| C | Gambar AI per scene | Variasi bebas | Berbayar, rupa tidak konsisten (fatal untuk serial), gambar diam |

## Desain

### 1. Engine di Remotion (`remotion/anim/`)
- Salin `engine/util.js`, `engine/video/gfx.js`, dan `engine/video/chars.js` dari animation-studio ke `remotion/anim/engine/`, dengan file `LICENSE` MIT. Font yang dipakai (Caveat, Bungee, Permanent Marker, Patrick Hand) disalin ke `remotion/public/fonts/`.
- Bungkus agar dimuat sekali di bundel Remotion. Engine menulis ke `globalThis` (`U`, `G`, `Ch`). `G.W`/`G.H` diset 1080×1920, dan `G.setStyle(look)` dipanggil per render.
- Komponen `AnimLayer` menggambar ke `<canvas>` 1080×1920 setiap `useCurrentFrame()`, sebagai fungsi murni dari waktu. Remotion merender paralel, jadi tidak boleh ada state antar-frame.
- Tekstur `G.post` (kertas, grain, vignette) diterapkan per tampilan.

### 2. Tampilan (`animLook`)
`kertas` → style `paper`; `kapur` → `chalk`; `neon` → `neon`; `catair` → `watercolor`; `gelap` → `paper` dengan palet gelap, cahaya lampu, vignette 0.75, dan grain 0.12 (seperti contoh horror).
Warna latar dan aksen mengikuti brand kit channel kalau cocok dengan tampilannya (kertas/cat air memakai warna terang channel, kapur/gelap/neon memakai papan atau malamnya sendiri dengan aksen channel).

### 3. Rupa karakter (`Character.anim`)
```ts
anim?: {
  kind: "stick" | "kartun";
  stick?: { color?: string; trait: "none" | "kuncir" | "kacamata" | "topi" | "pita" | "rambutBerdiri" };
  kartun?: Partial<PersonStyle>; // subset field Ch.person: hairStyle, hair, skin, outfit, shirt, bottoms, shorts, glasses, headwear, build
}
```
- Default untuk karakter lama: `stick` dengan warna `Character.color`.
- Halaman Karakter: pilihan rupa, isian ciri, dan **pratinjau canvas langsung di browser**. Engine yang sama dimuat di halaman, menampilkan 4 ekspresi (netral, senang, kaget, khawatir).
- Saran AI channel baru (`channels/suggest`) ikut mengusulkan `anim` untuk karakter awal.

### 4. Template baru (`lib/defaults.ts`, bisa ditambah ke channel mana pun)
- `Template.kind` diperluas: `"edu" | "affiliate" | "story" | "serial"`. `story` dan `serial` **melewati riset web**. Prompt melarang klaim fakta atau angka, dan cek kebijakan yang ada tetap jalan.
- **Fun Fact** (`kind: edu`, 1 narator, 45–60 dtk).
- **Storytelling** (`kind: story`, 1 narator, 30–60 dtk): hook → konflik → titik balik → pesan.
- **Serial** (`kind: serial`, 45–75 dtk): scene berisi narator atau tokoh serial. Scene terakhir berupa cliffhanger plus "bersambung".
- Halaman "Buat konten" bisa menyalin template ini ke channel aktif. Channel baru (fun fact, horror, motivasi) dibuat pemilik lewat menu Channel yang sudah ada.

### 5. Serial (`lib/store.ts`, halaman baru "Serial")
```ts
Series = { id, channelId, title, premise, castIds: string[], animLook, episodes: { projectId, number, title, summary }[] }
```
- Halaman Serial: buat serial (judul, premis, pilih 1–4 tokoh dari karakter channel, tampilan), lalu tombol **"Buat episode berikutnya"**. Tombol ini membuat proyek dengan template Serial dan nomor episode otomatis.
- Prompt Claude untuk episode: premis, tokoh (nama, sifat, rupa), dan ringkasan semua episode sebelumnya (maks. 20 terakhir). Episode harus menyambung dan diakhiri cliffhanger.
- Naskah serial juga mengembalikan `summary` (2–3 kalimat), yang disimpan ke `Series.episodes`.
- **Tokoh di layar**: scene narator menampilkan tokoh utama (cast pertama) yang berakting. Scene dialog menampilkan pembicara dan lawan bicaranya (kiri/kanan sesuai urutan cast). Yang bicara mulutnya bergerak, lawan bicara memakai pose dengar dan ekspresi `listenerFace`.

### 6. Data per scene (`Scene.act`)
```ts
act?: { pose: Pose; prop?: Prop; face: Face; setting?: Setting; listener?: string /* id tokoh lawan bicara */; listenerFace?: Face }
```
- **pose**: `stand, walk, point, pointUp, think, shrug, facepalm, cheer, shock, phone, typing, thumbsUp, wave, sad, still`. Untuk kartun dipetakan ke `gesture` `Ch.person`. Untuk stickman dipetakan ke sudut sendi (seperti di contoh).
- **prop**: `none, phone, laptop, lock, key, money, bulb, chip, wifi, warning, book, clock, lamp, door`
- **face**: `neutral, happy, shocked, confused, worried, sad, blank`
- **setting**: `blank, desk, street, room, darkRoom (lampu + pintu), stairs, hills (matahari), cafe, bigScreen`
- Claude memilih dari enum ini lewat JSON schema. Pose tidak boleh sama di dua scene berturut-turut. `sanitizeScript` mengganti nilai di luar daftar dengan `stand`/`neutral`/`blank`.
- Kartu `number`/`compare` (Fun Fact) tampil di `bigScreen` atau sebagai papan kecil di sebelah tokoh. Scene tanpa kartu angka dengan `bigScreen` menampilkan `visual.icon`.

### 7. Komposisi video
- Tokoh berada di satu lapisan di atas `TransitionSeries`. Tokoh tidak ikut bergeser saat pindah scene dan pindah pose dengan halus (±0.25 dtk). Latar, properti, dan papan berganti mengikuti transisi scene.
- Tata letak mengikuti contoh yang sudah dirapikan: lantai di y≈1450, tokoh di tengah-kiri, teks atau papan di atas kepala (y < 700), zona bawah 22% bersih dari teks.
- Header, judul bab, subtitle, hook cover, dan outro memakai komponen yang ada. Gaya hurufnya mengikuti tampilan (mis. Permanent Marker merah untuk `gelap`).

### 8. Editor proyek
Proyek bergaya Animasi menampilkan dropdown per scene: pose, properti, ekspresi, latar (dan lawan bicara untuk serial). Mengubahnya cukup dengan Render ulang, tanpa membuat suara baru.

### 9. Mode demo
Contoh naskah demo untuk Fun Fact, Storytelling, dan Serial (dengan `act`), supaya bisa dicoba tanpa Claude atau Gemini.

## Urutan pembangunan

1. Engine di Remotion + tampilan + rupa stickman/kartun + `act` + template **Fun Fact** dan **Storytelling** (satu tokoh) + editor + pratinjau karakter.
2. **Serial**: data serial, halaman Serial, memori episode, dua tokoh berdialog, cliffhanger.

Tiap tahap selesai dengan verifikasi di bawah sebelum lanjut.

## Verifikasi

- `npx tsc --noEmit` dan `npm run build` bersih.
- Lembar kontak still per tampilan × rupa × pose (render di container), **dilihat** dan diperbaiki sebelum lanjut.
- Satu video demo penuh per template (Fun Fact, Storytelling, Serial 2 episode) di container. Cek sinkron suara (diam di demo), zona aman, tidak ada teks menabrak tokoh, dan waktu render dicatat.
- Satu video Kartu lama dirender ulang (tidak ada regresi).
- **Tidak ada video asli memakai Claude atau Gemini sampai pemilik meminta.** Semua tes memakai mode demo.

## Diserahkan ke pembuat

- Detail gambar tiap properti dan latar, serta proporsi stickman.
- Cara membungkus engine IIFE untuk bundel Remotion.
- Tata letak papan angka.
- Bentuk persis ciri stickman (kuncir, kacamata, dan seterusnya).
