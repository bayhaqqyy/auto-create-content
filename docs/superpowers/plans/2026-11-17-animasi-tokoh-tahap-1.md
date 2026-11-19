# Animasi Tokoh — Tahap 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gaya visual "Animasi" (5 tampilan, tokoh stickman/kartun yang berakting per scene) plus template Fun Fact dan Storytelling satu tokoh, di app studio yang sudah ada.

**Architecture:** Engine gambar animation-studio (`util.js`, `gfx.js`, `chars.js`, fungsi canvas murni berbasis waktu) disalin ke `remotion/anim/engine/` dan dimuat sebagai global. Komponen `AnimLayer` menggambar latar + tokoh ke satu `<canvas>` per frame di bawah lapisan scene Remotion yang sudah ada (judul bab, papan angka, subtitle, header, outro tetap DOM). Claude menulis `scene.act` (pose/prop/face/setting) lewat JSON schema. Template generik (`channelId: "*"`) memakai tokoh pilihan proyek (`project.cast`).

**Tech Stack:** Next.js 15, React 19, Remotion 4, TypeScript 6, tsx (`node:test`), Docker.

**Spec:** `docs/superpowers/specs/2026-11-17-animasi-tokoh-design.md` (bagian "Urutan pembangunan" no. 1). Contoh referensi visual dan kode tata letak yang sudah dirapikan: `~/style-samples/_shared/film.js`.

## Global Constraints

- Render 1080×1920, 30 fps. Lantai tokoh di y≈1450. Teks/papan di atas kepala (y < 700). Bawah 22% (y > 1498) dan kanan 140 px bebas teks penting.
- Engine animation-studio MIT (Afaq Rashid): salin `LICENSE` ke `remotion/anim/engine/LICENSE`, header atribusi di file pembungkus.
- Semua render (still dan video) dijalankan di container Docker app, bukan di host (Chrome host macet).
- Tidak ada video asli memakai Claude/Gemini. Tes memakai mode demo (`CLAUDE_DISABLED=1`, tanpa `GEMINI_API_KEY`).
- Fun Fact tetap wajib riset+sumber. `kind: "story"` melewati riset dan prompt-nya melarang klaim fakta/angka.
- Gaya Kartu dan 3D tidak boleh berubah perilakunya.
- Commit lokal di branch `feat/animasi-tokoh`. Tidak push.

## Review Focus

1. **Proyek lama tanpa `act`/`cast`/`anim`** (data di `data/projects`, karakter tanpa `anim`): harus tetap terbuka, dirender, dan diedit; default `stand`/`neutral`/`blank`, rupa default stickman warna `Character.color`. → test di Task 1 dan Task 3.
2. **Claude membalas enum di luar daftar atau pose sama berturut-turut**: disanitasi, tidak crash render. → test di Task 3.
3. **Template generik tanpa tokoh terpilih** (channel tanpa karakter, atau `cast` kosong): proyek ditolak dengan pesan jelas, bukan crash. → test di Task 2.
4. **Teks panjang di papan atau judul bab** (fakta 3 baris): tidak menabrak kepala tokoh. → dicek di lembar kontak Task 6 dengan teks 3 baris.
5. **Scene sangat pendek (< 1 dtk) atau sangat panjang (> 15 dtk)**: transisi pose dan crossfade latar tidak loncat/tidak beku. → still di Task 6 pada t = awal+0.1 dan pertengahan scene panjang.

## File Structure

| File | Tanggung jawab |
|---|---|
| `lib/anim.ts` (baru) | Enum & tipe animasi, `sanitizeAct`, `animOf(character)` default rupa |
| `lib/templates.ts` (baru) | Template generik, `resolveTemplate`, `needsResearch` |
| `lib/types.ts` | Tambah field `Scene.act`, `Character.anim`, `Project.cast/animLook`, perluas `visualStyle`, `Template.kind`, `Template.visualMode` |
| `lib/defaults.ts` | Template generik `fun-fact`, `storytelling` |
| `lib/store.ts` | `getTemplates` ikut `channelId: "*"` |
| `lib/script.ts` | `scriptSchema(anim)`, prompt act + aturan story, sanitasi act, demo Fun Fact/Story |
| `scripts/run-pipeline.ts` | Lewati riset untuk story, mode anim, kirim props anim ke Remotion |
| `remotion/anim/engine/*` (baru) | Salinan engine + LICENSE |
| `remotion/anim/load.ts` (baru) | Muat engine ke global, sekali |
| `remotion/anim/actor.ts` (baru) | Gambar stickman, kartun, prop, wajah per `act` |
| `remotion/anim/setting.ts` (baru) | Gambar latar per `setting` × tampilan |
| `remotion/anim/AnimLayer.tsx` (baru) | Komponen canvas per frame, transisi pose, mulut dari cue |
| `remotion/KodeKepoVideo.tsx` | Mode anim: SceneView tanpa Backdrop/Hero, papan di zona atas, AnimLayer di bawah |
| `remotion/Root.tsx` | Komposisi `AnimSheet` untuk lembar kontak |
| `app/page.tsx`, `app/api/projects/route.ts` | Visual "Animasi", pilihan tampilan & tokoh |
| `app/proyek/[id]/page.tsx` | Dropdown act per scene |
| `app/karakter/page.tsx`, `components/AnimPreview.tsx` (baru) | Editor rupa + pratinjau canvas |
| `tests/*.test.ts` (baru) | `node:test` via tsx |

---

### Task 0: Branch, simpan pekerjaan sebelumnya, test harness

**Files:** Modify `package.json` (script `test`), Create `tests/smoke.test.ts`

- [ ] **Step 1:** `git switch -c feat/animasi-tokoh`. Commit pekerjaan yang sudah ada tapi belum di-commit (Docker, basic auth, `lib/claude.ts`, spec) sebagai satu commit `chore: deploy docker, basic auth, naskah via Claude CLI`. Pastikan `.env` tidak ikut (`git status` tidak menampilkannya).
- [ ] **Step 2:** Tambah `"test": "tsx --test tests/*.test.ts"` di `package.json`. Tulis `tests/smoke.test.ts` berisi satu test yang mengimpor `lib/script.ts` dan memastikan `demoScript().scenes.length > 0`.
- [ ] **Step 3:** Run `npm test` → PASS 1 test.
- [ ] **Step 4:** Commit `test: tambah test runner node:test`.

### Task 1: Tipe & enum animasi

**Files:** Create `lib/anim.ts`, `tests/anim.test.ts`; Modify `lib/types.ts`

**Interfaces — Produces:**
```ts
export const LOOKS = ["kertas", "kapur", "gelap", "neon", "catair"] as const; export type AnimLook = typeof LOOKS[number];
export const POSES = ["stand","walk","point","pointUp","think","shrug","facepalm","cheer","shock","phone","typing","thumbsUp","wave","sad","still"] as const;
export const PROPS = ["none","phone","laptop","lock","key","money","bulb","chip","wifi","warning","book","clock","lamp","door"] as const;
export const FACES = ["neutral","happy","shocked","confused","worried","sad","blank"] as const;
export const SETTINGS = ["blank","desk","street","room","darkRoom","stairs","hills","cafe","bigScreen"] as const;
export const TRAITS = ["none","kuncir","kacamata","topi","pita","rambutBerdiri"] as const;
export type Act = { pose: Pose; prop?: Prop; face: Face; setting?: Setting; listener?: string; listenerFace?: Face };
export type AnimRupa = { kind: "stick" | "kartun"; stick?: { color?: string; trait: Trait }; kartun?: Record<string, string> };
export function sanitizeAct(a: unknown, prevPose?: Pose): Act;
export function animOf(c: Pick<Character, "color" | "anim">): AnimRupa;
```
Di `lib/types.ts`: `Scene.act?: Act`; `Character.anim?: AnimRupa`; `Project.cast?: string[]`; `Project.animLook?: AnimLook`; `Project.visualStyle` boleh `"anim"`; `Template.visualMode?: "cards" | "3d" | "anim"`; `Template.kind?: "edu" | "affiliate" | "story" | "serial"`; `Channel.visualMode` tetap.

- [ ] **Step 1: Tests** di `tests/anim.test.ts`:
  - `sanitizeAct({pose:"dance", face:"lol", setting:"moon"})` → `{pose:"stand", face:"neutral", setting:"blank", prop:"none"}`
  - `sanitizeAct({pose:"point", face:"happy"}, "point").pose !== "point"` (pose berturut-turut diganti, pakai urutan cadangan `["think","pointUp","shrug","stand"]`, ambil yang pertama ≠ prevPose)
  - `sanitizeAct(undefined)` → default lengkap
  - `animOf({color:"#A4FF19"})` → `{kind:"stick", stick:{color:"#A4FF19", trait:"none"}}`; `animOf({color:"#fff", anim:{kind:"kartun", kartun:{hairStyle:"bun"}}})` dikembalikan apa adanya
- [ ] **Step 2:** `npm test` → FAIL (modul belum ada).
- [ ] **Step 3:** Implement `lib/anim.ts` dan field tipe.
- [ ] **Step 4:** `npm test` dan `npx tsc --noEmit` → PASS.
- [ ] **Step 5:** Commit `feat(anim): tipe dan sanitasi act`.

### Task 2: Template generik dan tokoh proyek

**Files:** Create `lib/templates.ts`, `tests/templates.test.ts`; Modify `lib/defaults.ts`, `lib/store.ts` (`getTemplates`), `app/api/projects/route.ts`

**Interfaces — Produces:**
```ts
export const NARRATOR = "narator"; // placeholder speaker di template generik
export function resolveTemplate(t: Template, cast: string[]): Template; // t.channelId==="*" → characters=cast, speaker "narator" → cast[0]; template biasa dikembalikan apa adanya
export function needsResearch(t: Template): boolean; // false untuk kind "story" | "serial"
```
Template generik di `DEFAULT_TEMPLATES` dengan `channelId: "*"`, `visualMode: "anim"`, `characters: ["narator"]`:
- `fun-fact` (kind `edu`, 45–60 dtk): Hook 4 · Fakta 1 8 · Fakta 2 8 · Fakta 3 8 · Fakta paling mengejutkan 10 · Penutup+ajakan follow 6. Rules: COMMON_RULES + "Satu fakta per scene, setiap fakta harus dari hasil riset."
- `storytelling` (kind `story`, 30–60 dtk): Hook 4 · Konflik 10 · Titik balik 10 · Pesan 8 · Penutup 5. Rules: "Cerita fiksi atau reflektif. Jangan menulis klaim fakta, statistik, atau angka nyata." + "Tokoh utama memperagakan cerita; tulis dari sudut pandang narator."

`getTemplates(channelId)` mengembalikan template channel itu **plus** `channelId === "*"`. POST `/api/projects`: terima `cast: string[]` dan `animLook`; untuk template generik wajib `cast[0]` ada dan merupakan karakter channel aktif, kalau tidak 400 "Pilih tokoh dulu. Buat karakter di menu Karakter kalau belum ada."; `channelId` proyek = channel aktif (body `channelId`), bukan `"*"`.

- [ ] **Step 1: Tests:** `resolveTemplate(funFact, ["kepo"])` → `characters` = `["kepo"]` dan semua `scenes[].speaker === "kepo"`; template KodeKepo `serial-dialog` tidak berubah; `needsResearch` true untuk `edu`/undefined, false untuk `story`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** `npm test` + `tsc` → PASS.
- [ ] **Step 5:** Test manual API dengan curl ke container nanti dicakup Task 9; di sini cukup unit test. Commit `feat: template generik fun fact & storytelling`.

### Task 3: Naskah — schema, prompt, sanitasi, demo

**Files:** Modify `lib/script.ts`; Test `tests/script.test.ts`

**Interfaces — Consumes:** `sanitizeAct`, `POSES…SETTINGS` (Task 1), `resolveTemplate` (Task 2). **Produces:**
```ts
export function scriptSchema(anim: boolean): object;          // anim → tiap scene punya act {pose, prop, face, setting} required, enum dari lib/anim
export function buildPrompt(p, t, chars, facts, ch): string;  // + blok "AKTING TOKOH" saat p.visualStyle==="anim"; + blok STORY saat t.kind==="story"
export function sanitizeScript(r, t, productIds?): ScriptResult; // + act disanitasi berurutan (prevPose = act scene sebelumnya)
export function demoScript(channelId?: string, templateId?: string): ScriptResult; // "fun-fact" & "storytelling" → demo dengan act
```
Blok prompt AKTING: daftar enum, "pilih pose yang memperagakan kalimat scene; jangan pakai pose yang sama dua scene berturut-turut; setting `bigScreen` untuk scene berisi angka".
Blok STORY: "Ini cerita, bukan berita: jangan menulis fakta, statistik, nama merek, atau angka nyata. visual.kind hanya question atau statement."
Demo Fun Fact: topik kedipan mata, angka "15.000" di scene fakta paling mengejutkan (`visual.kind:"number"`, setting `bigScreen`). Demo Storytelling: motivasi "pelan bukan berarti berhenti", setting `hills` di penutup.

- [ ] **Step 1: Tests:** `scriptSchema(true).properties.scenes.items.required` memuat `"act"`, `scriptSchema(false)` tidak; `sanitizeScript` dengan 3 scene pose `point` berturut-turut → tidak ada dua pose sama berdekatan; scene tanpa `act` di template non-anim tetap tanpa `act`; `demoScript("x","fun-fact").scenes.every(s => s.act)`; `buildPrompt` untuk template story memuat "jangan menulis fakta".
- [ ] **Step 2:** FAIL. **Step 3:** Implement. **Step 4:** PASS + `tsc`.
- [ ] **Step 5:** Commit `feat(script): act per scene dan template story`.

### Task 4: Pipeline

**Files:** Modify `scripts/run-pipeline.ts`

**Interfaces — Consumes:** Task 1–3. **Produces:** inputProps KodeKepoVideo bertambah
```ts
anim?: { look: AnimLook; cast: { id: string; name: string; rupa: AnimRupa }[] }
```
- `visualModeOf(p)` mengembalikan `"anim"` bila `p.visualStyle==="anim"` atau template `visualMode==="anim"`.
- `doScript`: `t = resolveTemplate(getTemplate(p.templateId), p.cast || [])`; riset hanya bila `needsResearch(t)`; panggil `generateJson(prompt, scriptSchema(mode==="anim"))`; mode demo memakai `demoScript(ch.id, t.id)`.
- `doImages` dilewati untuk anim (sama seperti cards). `doRewrite` memakai schema item yang sama.
- Render: isi `anim` dari `p.animLook || "kertas"` dan karakter `p.cast` dengan `animOf(c)`.
- [ ] **Step 1:** `npx tsc --noEmit` → PASS. (Perilaku end-to-end diuji di Task 9.)
- [ ] **Step 2:** Commit `feat(pipeline): mode animasi dan story tanpa riset`.

### Task 5: Engine di Remotion

**Files:** Create `remotion/anim/engine/{util.js,gfx.js,chars.js,LICENSE}`, `remotion/anim/load.ts`, `remotion/public/fonts/{Caveat-Bold.ttf,Bungee-Regular.ttf,PermanentMarker-Regular.ttf,PatrickHand-Regular.ttf}`; Modify `remotion/Root.tsx`

**Interfaces — Produces:**
```ts
export function engine(): { U: any; G: any; Ch: any };     // muat sekali: globalThis.SCORE={FORMAT:"9:16"}; globalThis.U=require util; require gfx, chars
export function useAnimEngine(): boolean;                   // delayRender sampai 4 font FontFace (staticFile) termuat + G.initTextures(); true saat siap
export const LOOK_STYLE: Record<AnimLook, { style: string; post: { paper: number; vignette: number; grain: number } }>; // gelap → paper + {0,0.75,0.12}; kertas → {0.5,0.3,0.05}; lainnya {0.3,0.3,0.05}
```
Sumber engine: `~/.claude/plugins/synced/.../skills/animation-studio/engine/` (sama dengan `~/style-samples/stickman-kertas/engine/`). Jangan ubah isinya selain menambah header atribusi bila perlu.
- [ ] **Step 1:** Tambah komposisi `AnimSheet` (1080×1920, 1 frame) di `Root.tsx` yang memakai `useAnimEngine` lalu menggambar 5 kotak tampilan berlabel (`G.setStyle`, `G.bg`, satu `G.ellipse` + `G.text` "kertas" dst.).
- [ ] **Step 2:** Render di container: `docker compose exec web npx remotion still remotion/index.ts AnimSheet /tmp/sheet.png` lalu salin keluar dan **lihat**. Expected: 5 kotak dengan garis bergetar dan font Caveat/Bungee terpakai (bukan fallback serif).
- [ ] **Step 3:** Commit `feat(anim): engine animation-studio di Remotion`.

### Task 6: Tokoh, prop, latar

**Files:** Create `remotion/anim/actor.ts`, `remotion/anim/setting.ts`; Modify `remotion/Root.tsx` (`AnimSheet` jadi lembar kontak)

**Interfaces — Produces:**
```ts
export function drawActor(ctx: CanvasRenderingContext2D, o: { rupa: AnimRupa; act: Act; prevAct?: Act; tIn: number; t: number; x: number; y: number; s: number; talking: number; ink: string; accent: string; facing?: 1 | -1 }): void;
//  tIn = detik sejak scene mulai (transisi pose 0.25 dtk dengan easeOutBack dari prevAct.pose); talking 0..1 membuka mulut
export function drawSetting(ctx, o: { setting: Setting; look: AnimLook; t: number; theme: { bg: string; accent: string } }): void;
export function drawProp(ctx, prop: Prop, x: number, y: number, s: number, ink: string, accent: string): void;
```
- Stickman: sudut sendi seperti `POSES` di `~/style-samples/_shared/film.js` (tambah `think, shrug, facepalm, phone, thumbsUp, wave, sad` dengan pola yang sama), napas `sin(t*3.1)*3`, `walk` = siklus kaki. Ciri `trait` digambar di kepala.
- Kartun: `Ch.person({pose:"stand", style: rupa.kartun, gesture})`; pemetaan pose→gesture: point→point, pointUp→pointUp, think→think, shrug→shrug, facepalm→facepalm, cheer→cheer, phone→phone, typing→typing, thumbsUp→thumbsUp, wave→wave; shock→`eyes:"wide", mouth:"o"`+tangan ke kepala; sad→`brows:"worried", mouth:"wavy"`; mulut `{open: talking, wide:0.4, talking: talking>0}`.
- Latar `darkRoom`, `stairs`, `hills` mengikuti contoh horror, neon, cat air. `bigScreen` = bingkai layar di zona y 430–700 (papan DOM tampil di atasnya).
- [ ] **Step 1:** `AnimSheet` menggambar grid: 5 tampilan × {stick, kartun} × 3 pose (stand, shock, point) dengan teks contoh 3 baris di zona atas. Render di container, **lihat**: tidak ada siku tertekuk ke dalam, kepala tidak tertutup teks, tiap tampilan terbaca.
- [ ] **Step 2:** Render still t = 0.1 dtk dan t = 0.3 dtk setelah ganti pose → transisi terlihat (Review Focus 5).
- [ ] **Step 3:** Perbaiki yang terlihat salah, render ulang sekali. Commit `feat(anim): tokoh, prop, latar`.

### Task 7: AnimLayer di video

**Files:** Create `remotion/anim/AnimLayer.tsx`; Modify `remotion/KodeKepoVideo.tsx`

**Interfaces — Consumes:** `VideoProps.anim` (Task 4), `drawActor/drawSetting` (Task 6). **Produces:** `<AnimLayer scenes cues anim theme />`.
- Saat `anim` ada: `AnimLayer` dirender sebelum `TransitionSeries` (paling bawah). `SceneView` tidak menggambar `Backdrop`/`Hero`; area `Visual` dipindah ke `top: 430, height: 270` dan hanya menampilkan `number`/`compare` (skala 0.7); kind lain tidak ditampilkan. Background `AbsoluteFill` transparan.
- Scene aktif dihitung dari frame (sama dengan cara `Subtitles`). Latar crossfade selama `TRANSITION` frame di batas scene. Tokoh utama `anim.cast[0]` di x = 360, y = 1450, s = 1.45 (stick) / 1.25 (kartun).
- Judul bab (`Chapter`) dan hook memakai huruf sesuai tampilan: `gelap` → Permanent Marker warna `#E02424`; `kapur`/`kertas` → Caveat untuk tag; lainnya tetap font channel.
- `talking` = 1 saat ada cue aktif di frame itu (dari `cues`), bergetar `abs(sin(t*14))`.
- [ ] **Step 1:** Tambah `defaultProps` contoh anim ke komposisi baru `KodeKepoVideoAnim` di Root (pakai `demoScript("x","fun-fact")` dengan `durationSec` 3 per scene). Render still di 3 waktu di container dan **lihat**.
- [ ] **Step 2:** `tsc` PASS. Commit `feat(anim): AnimLayer di komposisi video`.

### Task 8: UI — buat konten, editor, karakter

**Files:** Modify `app/page.tsx`, `app/proyek/[id]/page.tsx`, `app/karakter/page.tsx`, `app/api/characters/route.ts` (validasi `anim`); Create `components/AnimPreview.tsx`

- Buat konten: opsi Visual ketiga **"Animasi"**; bila dipilih tampil pilihan **Tampilan** (Kertas, Kapur, Gelap, Neon, Cat air) dan **Tokoh** (select karakter channel). Template generik terlihat di semua channel. Kirim `visualStyle:"anim"`, `animLook`, `cast:[id]`, `channelId`.
- Editor proyek: untuk proyek anim, per scene 4 `<select>` (Pose, Properti, Ekspresi, Latar) dengan id `act-pose-${s.id}` dst., label Indonesia (Berdiri, Jalan, Menunjuk, …). Mengubah → simpan `scene.act`, tombol Render ulang seperti biasa (tanpa suara baru).
- Karakter: blok "Rupa animasi": radio Stickman/Kartun; stickman: warna + ciri; kartun: rambut (gaya, warna), kulit, baju (jenis, warna), bawahan, kacamata. `AnimPreview` = client component yang `import("../remotion/anim/load")` lalu menggambar 4 ekspresi (neutral, happy, shocked, worried) di canvas 480×270 pada tampilan `kertas`.
- Saran AI channel baru (`app/api/channels/suggest/route.ts`): schema karakter ditambah `anim` (kind + trait/kartun) supaya karakter awal langsung punya rupa.
- [ ] **Step 1:** `npm run build` PASS.
- [ ] **Step 2:** Rebuild container, buka halaman Buat konten, Karakter, dan satu proyek anim lewat Playwright (webkit) atau curl HTML; screenshot Karakter dengan pratinjau dan **lihat**.
- [ ] **Step 3:** Commit `feat(ui): pilihan animasi, editor act, rupa karakter`.

### Task 9: Verifikasi end-to-end (mode demo, di container)

- [ ] **Step 1:** `docker compose up -d --build` dengan `.env` sementara `CLAUDE_DISABLED=1` dan tanpa `GEMINI_API_KEY` (kembalikan setelah selesai).
- [ ] **Step 2:** Lewat API buat 3 proyek: Fun Fact + kertas + stickman; Storytelling + gelap + kartun; Fun Fact + neon. Tunggu `ready`. Catat waktu render.
- [ ] **Step 3:** Ekstrak 8 frame per video (`ffmpeg -vf fps=1`), **lihat**: zona aman, teks tidak menabrak tokoh, pose berganti tiap scene, latar crossfade.
- [ ] **Step 4:** Render ulang satu proyek Kartu lama (`/api/projects/<id>/run` step `render`) → `ready`, frame terlihat sama gayanya.
- [ ] **Step 5:** Kembalikan `.env`, `docker compose up -d`. Commit `test: verifikasi demo animasi` (catatan hasil di `docs/superpowers/plans/…` bagian bawah).
