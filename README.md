# Studio konten (KodeKepo! dan channel lain)

Webapp untuk mengubah satu topik jadi video pendek 9:16 secara otomatis:
**riset → naskah → suara per karakter → (gambar 3D) → subtitle → render MP4**, plus caption, judul, dan prompt klip 3D.
Satu aplikasi untuk banyak channel: tiap channel punya brand kit, karakter, dan template sendiri.

Terinspirasi alur [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo), tapi dibuat ulang untuk kebutuhan KodeKepo!:

| | MoneyPrinterTurbo | KodeKepo Studio |
|---|---|---|
| Suara | 1 narator | Dialog KEPO × PAHAM, voice dikunci per karakter |
| Visual | Stock footage (Pexels/Pixabay) | Motion graphic brand yang dirender khusus tiap video, plus klip Flow milikmu sendiri |
| Fakta | Langsung ditulis LLM | Riset dengan Google Search dulu; kalau tidak ada sumber, naskah tidak ditulis |
| Sebelum tayang | Tidak ada | Panel "Siap tayang?": durasi, konsistensi suara, satu part, kata rawan TikTok, sumber |

## Channel dan brand kit

Pilih channel aktif di menu kiri. Semua halaman (buat konten, proyek, template, karakter) mengikuti channel itu.

- **Brand kit**: warna, font, teks header, tagline, teaser dan ajakan follow di outro, logo, musik latar, aturan bahasa, aturan hashtag, dan gaya visual bawaan.
- **Buat channel baru**: tulis channel-nya tentang apa, lalu (dengan API key) AI mengusulkan nama, warna, tagline, dan karakter awal. Channel baru langsung dapat satu template dan karakter.
- Bawaan ada dua channel: **KodeKepo!** (format kartu seperti EP.009 dst.) dan **Petualangan Kepi** (gambar 3D, robot Kepi dan amplop Bita).

### Format video KodeKepo!

Disamakan dengan episode yang sudah tayang: latar navy dengan grid 60px dan lingkaran dekoratif, font Plus Jakarta Sans, header "KODEKEPO!" dengan penghitung episode dan garis progres, tiap bab berupa pill tag dan judul dua baris (baris kedua warna aksen), kartu info (chat WhatsApp, notifikasi, panggilan masuk dengan waveform, langkah, perbandingan, angka), subtitle dalam kotak dengan label KEPO/PAHAM dan kata yang belum diucapkan redup, outro terang dengan logo, "Episode depan: kita kepoin teknologi lainnya", ajakan follow, dan kotak lime tagline. Frame pertama berupa judul besar seperti cover, karena di EP.021 hook di detik pertama terbukti berpengaruh. Musik latar dan SFX dibuat khusus (bukan stock) dan mengecil saat dialog.

### Gaya visual

- **Kartu motion graphic**: semuanya dirender dari kode sesuai isi scene.
- **Gambar 3D AI**: tiap scene dibuatkan gambar 3D dengan Gemini (model `gemini-nano-banana-2.1`, bisa diganti lewat `GEMINI_IMAGE_MODEL`), memakai gambar referensi karakter supaya wujudnya konsisten, lalu kartu dan subtitle ditaruh di atasnya dengan gerak kamera pelan.
- Klip Google Flow buatanmu bisa diupload ke scene mana pun di editor.

Gaya bawaan diatur di brand kit, bisa dipaksa per template, dan bisa dipilih lagi saat membuat konten.

## Video affiliate

Menu **Video affiliate** membuat video jualan, bukan format episode:

1. Upload 1–3 foto produk (atau tempel link toko; foto, nama, dan harga diambil dari halaman kalau tokonya mengizinkan).
2. Gemini melihat fotonya lalu menulis 3–5 adegan pemakaian sehari-hari (masalah → produk dipakai → hasil → "cek keranjang kuning").
3. Tiap adegan dibuat jadi klip video vertikal dengan **Gemini Omni Flash** (`gemini-omni-1.1-flash`). Foto produk dikirim sebagai referensi supaya bentuknya sama.
4. Voice over satu narator (Gemini TTS), caption kata per kata, hook besar di detik pertama, dan kartu penutup dengan foto asli + harga.

Di editor tiap adegan bisa diubah teks, prompt klipnya, dibuat ulang klipnya, atau diganti klip rekaman sendiri.
Klip AI butuh sekitar 1–3 menit per adegan dan memakai kuota berbayar Gemini API. Tanpa `GEMINI_API_KEY`, adegan memakai foto produk yang bergerak (mode demo).

Ada dua gaya: **Review hands-on** (POV tangan: unboxing, demo fitur satu per satu, ajakan beli) dan **Dipakai sehari-hari** (masalah, solusi, hasil).
Hook selalu tampil sejak frame pertama dan bertahan sepanjang adegan pertama. Penutupnya tombol "Cek keranjang kuning" tanpa harga.

**Mode satu take:** isi `adClip` di proyek dengan satu klip panjang (mis. hasil Google Flow 20–30 detik yang disambung dengan extend).
Klip itu jadi latar seluruh video, sedangkan tiap adegan hanya mengatur voice over, teks, dan caption. Cara ini menjaga produk dan latar tetap konsisten.

**Tanpa akses video API:** Gemini Omni di Free Tier dibatasi 0 permintaan. Buat klipnya di Google Flow (web), download, lalu pasang lewat tombol "Pakai klip sendiri" di editor.
Voice over (TTS) tetap jalan di Free Tier. Kalau model TTS utama penuh, app otomatis pindah ke model lite (tanpa arahan gaya suara).

Sebelum tayang: tonton tiap klip untuk memastikan produknya sama dengan aslinya dan tidak ada logo/watermark yang ikut tergambar AI, nyalakan **Disclose commercial content** dan label **AI-generated** di TikTok.
Model video bisa diganti lewat `GEMINI_VIDEO_MODEL`.

## Menjalankan

Butuh Node.js 20+.

```bash
npm install
cp .env.example .env.local     # isi GEMINI_API_KEY dari https://aistudio.google.com/apikey
npm run build && npm start     # buka http://localhost:3000
```

Tanpa `GEMINI_API_KEY` aplikasi jalan dalam **mode demo**: naskah memakai contoh topik OTP dan suaranya hening, supaya alur dan render bisa dicoba tanpa biaya.

Render pertama kali akan mengunduh Chrome Headless Shell otomatis (lewat Remotion). Kalau sudah punya Chrome, isi `REMOTION_BROWSER` dengan path-nya.

## Cara kerja

1. **Buat konten**: tulis topik, pilih template dan opsi.
2. Pipeline jalan di proses terpisah (`scripts/run-pipeline.ts`), progresnya tampil di halaman proyek:
   - **Riset** dengan model teks Gemini + `google_search`. Sumber disimpan dan perlu kamu centang "Sudah saya cek".
   - **Naskah** dalam JSON terstruktur sesuai struktur scene dan aturan template.
   - **Suara** per scene dengan Gemini TTS, memakai voice dan gaya bicara karakter.
   - **Subtitle** maksimal 2 baris, kata kunci di-highlight lime, juga diekspor ke `.srt`.
   - **Render** dengan [Remotion](https://www.remotion.dev): 1080×1920, 30 fps, H.264 + AAC.
3. **Editor**: ubah dialog, teks layar, kata highlight, jenis visual, atau upload klip Google Flow per scene, lalu **Render ulang**. Scene yang dialognya berubah otomatis dibuatkan suara baru.
4. Unduh video, caption, `.srt`, dan semua prompt klip.

Model bisa diganti lewat `GEMINI_TEXT_MODEL` dan `GEMINI_TTS_MODEL` di `.env.local` kalau Google merilis versi baru.

## Visual yang orisinal

Setiap scene dirender dari kode sesuai isinya: **pertanyaan**, **pernyataan**, **langkah**, **perbandingan**, atau **angka** (angka hanya dari hasil riset). Tidak ada stock footage. Untuk scene penting, buat klip 3D di Google Flow dengan prompt yang sudah disiapkan, lalu upload ke scene itu. Tata letak menjaga zona aman TikTok/Reels (bawah dan kanan bebas dari teks penting).

Logo tidak digambar ulang. Taruh file logo resmi di `data/brand/logo.png` supaya muncul di penutup video.

## Struktur

```
app/                 halaman + API (Next.js App Router)
components/          navigasi, mini strip ritme scene
lib/                 tipe, data default (template, karakter), Gemini, subtitle, cek kebijakan, penyimpanan
remotion/            komposisi video
scripts/             pipeline produksi
data/                templates.json, characters.json, projects/<id>/ (dibuat otomatis)
```

Data disimpan sebagai file JSON di folder `data/` (`channels.json`, `templates.json`, `characters.json`, `channels/<id>/` untuk logo, musik, dan gambar karakter), cocok untuk dipakai sendiri di laptop. Kalau nanti dipakai tim atau dipasang di server, ganti `lib/store.ts` dengan database dan tambahkan login.

## Catatan

- **Lisensi Remotion**: gratis untuk perorangan dan perusahaan sampai 3 karyawan. Di atas itu perlu company license (lihat remotion.dev/license).
- **Waktu render**: di workspace uji (2 vCPU), video demo 41 detik selesai dari topik sampai MP4 dalam sekitar 1,5 menit. Di laptop bisa berbeda; atur `RENDER_CONCURRENCY` kalau laptop terasa berat.
- **Durasi**: dihitung dari audio asli. Di mode demo durasinya hanya perkiraan, jadi pengecekan durasi bisa menandai "di luar target".
- **Pengecekan kebijakan** hanya bantu menandai kata rawan. Keputusan akhir tetap di tanganmu sebelum tayang.
- **Voice "Zali"** untuk narator Grup Keluarga diambil dari produksi sebelumnya di AI Studio. Kalau API menolak nama itu, pilih voice lain di halaman Karakter.
- **Gambar 3D** belum bisa saya uji dengan API sungguhan (tidak ada key di lingkungan uji). Rasio 9:16 dikirim ke API; kalau ditolak, aplikasi meminta tanpa rasio lalu memotongnya saat render.
- Proyek ini memakai TypeScript 6 karena Next.js 15 belum mendukung TypeScript 7.
