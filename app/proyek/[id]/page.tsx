"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../components/api";
import type { Character, Product, Project, Scene, Template, VisualKind } from "../../../lib/types";
import { AFFILIATE_UPLOAD } from "../../../lib/policy";
import { ANIM_CAMERA, ANIM_EVENTS, ANIM_MOODS, ANIM_POSES, ANIM_SETS, isAnimLayout, LOOK_PRESETS } from "../../../lib/anim";
import type { AnimDirection, AnimLayout } from "../../../lib/types";
import { Questions } from "../../../components/Questions";

/** Arahan adegan animasi: set, kejadian, kamera, dan tokoh yang tampil. */
function AnimEditor({ s, layout, chars, onChange }: { s: Scene; layout: AnimLayout; chars: Character[]; onChange: (a: AnimDirection) => void }) {
  const a = s.anim!;
  const who = [...chars.map((c) => ({ id: c.id, name: c.name })), ...Object.entries(LOOK_PRESETS).map(([id, l]) => ({ id, name: l.label }))];
  const sel = (id: string, label: string, value: string, opts: { id: string; desc?: string }[], on: (v: string) => void) => (
    <div className="field">
      <label htmlFor={id} className="small">{label}</label>
      <select id={id} className="select" value={value} onChange={(e) => on(e.target.value)}>
        {opts.map((o) => <option key={o.id} value={o.id} title={o.desc}>{o.id}</option>)}
      </select>
    </div>
  );
  const setCast = (i: number, patch: Partial<AnimDirection["cast"][number]>) => onChange({ ...a, cast: a.cast.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const max = layout === "horor" ? 4 : layout === "stickman" ? 2 : 1;
  return (
    <div className="stack" style={{ gap: 10, padding: 14, borderRadius: 14, background: "var(--panel, rgba(0,0,0,0.04))" }}>
      <span className="small" style={{ fontWeight: 700 }}>Arahan animasi</span>
      <div className="grid2">
        {sel(`as-${s.id}`, "Tempat", a.set, ANIM_SETS[layout], (v) => onChange({ ...a, set: v }))}
        {sel(`ae-${s.id}`, "Kejadian", a.event || "tidak-ada", ANIM_EVENTS[layout], (v) => onChange({ ...a, event: v }))}
        {sel(`ac-${s.id}`, "Kamera", a.camera || "dorong", ANIM_CAMERA.map((id) => ({ id })), (v) => onChange({ ...a, camera: v }))}
        {layout === "horor" ? (
          <div className="field">
            <label htmlFor={`st-${s.id}`} className="small">Cap waktu (HARI | JAM | TEMPAT)</label>
            <input id={`st-${s.id}`} className="input" value={a.stamp || ""} onChange={(e) => onChange({ ...a, stamp: e.target.value })} />
          </div>
        ) : null}
      </div>
      {a.cast.map((c, i) => (
        <div key={i} className="row" style={{ gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          {layout === "horor" ? sel(`aw-${s.id}-${i}`, `Tokoh ${i + 1}`, c.who, who.map((w) => ({ id: w.id, desc: w.name })), (v) => setCast(i, { who: v })) : null}
          {sel(`ap-${s.id}-${i}`, "Pose", c.pose, ANIM_POSES[layout], (v) => setCast(i, { pose: v }))}
          {layout !== "motivasi" ? sel(`am-${s.id}-${i}`, "Ekspresi", c.mood, ANIM_MOODS[layout], (v) => setCast(i, { mood: v })) : null}
          {layout !== "motivasi" ? (
            <label className="small" style={{ display: "flex", gap: 6, alignItems: "center", paddingBottom: 12 }}>
              <input type="checkbox" checked={!!c.talk} onChange={(e) => setCast(i, { talk: e.target.checked })} /> bicara
            </label>
          ) : null}
          {a.cast.length > 1 ? <button className="btn quiet sm" style={{ marginBottom: 6 }} onClick={() => onChange({ ...a, cast: a.cast.filter((_, j) => j !== i) })}>Hapus</button> : null}
        </div>
      ))}
      {a.cast.length < max ? (
        <button className="btn quiet sm" style={{ alignSelf: "flex-start" }} onClick={() => onChange({ ...a, cast: [...a.cast, { ...a.cast[a.cast.length - 1] }] })}>Tambah tokoh</button>
      ) : null}
    </div>
  );
}

const BUSY = ["queued", "asking", "researching", "writing", "voicing", "imaging", "rendering"];
const BASE_STAGES: { key: string; label: string }[] = [
  { key: "asking", label: "Menyiapkan pertanyaan" },
  { key: "researching", label: "Riset sumber" },
  { key: "writing", label: "Menulis naskah" },
  { key: "voicing", label: "Membuat suara" },
  { key: "imaging", label: "Gambar 3D (kalau dipakai)" },
  { key: "rendering", label: "Render video" },
];
const KINDS: { v: VisualKind; l: string }[] = [
  { v: "question", l: "Pertanyaan" },
  { v: "statement", l: "Pernyataan" },
  { v: "steps", l: "Langkah" },
  { v: "compare", l: "Perbandingan" },
  { v: "number", l: "Angka" },
  { v: "chat", l: "Chat WhatsApp" },
  { v: "notification", l: "Notifikasi" },
  { v: "call", l: "Panggilan masuk" },
  { v: "clip", l: "Klip sendiri" },
];
const AD_STAGES: { key: string; label: string }[] = [
  { key: "writing", label: "Menulis adegan" },
  { key: "voicing", label: "Membuat suara" },
  { key: "imaging", label: "Membuat klip AI" },
  { key: "rendering", label: "Render video" },
];
const VOICES = ["Leda", "Aoede", "Kore", "Puck", "Charon", "Fenrir"];
const TABS = ["Video", "Naskah & storyboard", "Suara & subtitle", "Caption & cover"] as const;

const file = (id: string, name: string, dl = false) => `/api/projects/${id}/file/${encodeURIComponent(name)}${dl ? "?download" : ""}`;

function Highlight({ text, word }: { text: string; word?: string }) {
  if (!word) return <>{text}</>;
  const i = text.toLowerCase().indexOf(word.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="hl">{text.slice(i, i + word.length)}</span>
      {text.slice(i + word.length)}
    </>
  );
}

function Progress({ p }: { p: Project }) {
  const STAGES = p.templateId === "product-ad" ? AD_STAGES : BASE_STAGES;
  const idx = Math.max(0, STAGES.findIndex((s) => s.key === p.status));
  return (
    <div className="stack" style={{ gap: 24, maxWidth: 760 }}>
      <p className="muted small" style={{ margin: 0 }}>Kamu boleh tinggalin halaman ini. Hasilnya tersimpan di Proyek begitu selesai.</p>
      <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((p.progress || 0) * 100)} aria-label="Progres">
        <i style={{ width: `${Math.round((p.progress || 0) * 100)}%` }} />
      </div>
      <div className="card flush list stages" aria-live="polite">
        {STAGES.map((s, i) => {
          const state = p.status === "queued" ? "wait" : i < idx ? "done" : i === idx ? "now" : "wait";
          return (
            <div key={s.key}>
              <span className={"stage-mark " + state} aria-hidden="true">{state === "done" ? "✓" : i + 1}</span>
              <div>
                <div style={{ fontWeight: state === "now" ? 700 : 600, color: state === "wait" ? "var(--muted)" : undefined }}>{s.label}</div>
                <div className="muted small">{state === "done" ? "Selesai" : state === "now" ? p.stage : "Menunggu"}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SceneRow({
  s,
  i,
  p,
  chars,
  allowed,
  onChange,
  onRun,
  onUpload,
}: {
  s: Scene;
  i: number;
  p: Project;
  chars: Character[];
  allowed: string[];
  onChange: (s: Scene) => void;
  onRun: (step: "rewrite" | "voice" | "image", id: string) => void;
  onUpload: (id: string, f: File) => void;
}) {
  const c = chars.find((x) => x.id === s.speaker);
  const [copied, setCopied] = useState(false);
  const upRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Scene>) => onChange({ ...s, ...patch });
  return (
    <div className="scene">
      <div className="stack" style={{ gap: 8 }}>
        <span className="muted small" style={{ fontVariantNumeric: "tabular-nums" }}>
          {s.durationSec ? `${s.durationSec.toFixed(1)} dtk` : "belum ada suara"}
        </span>
        <span className="tag" style={{ background: c?.id === "paham" ? "var(--navy)" : c?.color, color: c?.id === "paham" ? "var(--light)" : c?.textColor }}>
          {c?.name || s.speaker}
        </span>
        {s.image ? <img className="thumb" src={file(p.id, s.image)} alt={`Gambar scene ${i + 1}`} /> : null}
      </div>
      <div className="stack" style={{ gap: 12 }}>
        <label className="sr-only" htmlFor={`t-${s.id}`} style={{ position: "absolute", left: -9999 }}>Dialog scene {i + 1}</label>
        <textarea id={`t-${s.id}`} className="line" rows={2} value={s.text} onChange={(e) => set({ text: e.target.value })} />
        <div className="grid2">
          <div className="field">
            <label htmlFor={`tg-${s.id}`} className="small">Label bab</label>
            <input id={`tg-${s.id}`} className="input" value={s.tag || ""} onChange={(e) => set({ tag: e.target.value.toUpperCase() })} />
          </div>
          <div className="field">
            <label htmlFor={`sc-${s.id}`} className="small">Judul bab (pisahkan baris dengan |)</label>
            <input id={`sc-${s.id}`} className="input" value={s.screenText} onChange={(e) => set({ screenText: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor={`kw-${s.id}`} className="small">Kata yang di-highlight</label>
            <input id={`kw-${s.id}`} className="input" value={s.keyword} onChange={(e) => set({ keyword: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor={`sp-${s.id}`} className="small">Karakter</label>
            <select id={`sp-${s.id}`} className="select" value={s.speaker} onChange={(e) => set({ speaker: e.target.value })}>
              {allowed.map((a) => (
                <option key={a} value={a}>{chars.find((x) => x.id === a)?.name || a}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`vk-${s.id}`} className="small">Visual</label>
            <select id={`vk-${s.id}`} className="select" value={s.visual.kind} onChange={(e) => set({ visual: { ...s.visual, kind: e.target.value as VisualKind } })}>
              {KINDS.filter((k) => k.v !== "clip" || s.visual.clip).map((k) => (
                <option key={k.v} value={k.v}>{k.l}</option>
              ))}
            </select>
          </div>
        </div>
        {["steps", "compare", "number", "chat", "notification", "call"].includes(s.visual.kind) ? (
          <div className="field">
            <label htmlFor={`it-${s.id}`} className="small">
              {
                {
                  steps: "Langkah (satu per baris, 2–4)",
                  compare: "Dua hal yang dibandingkan (satu per baris)",
                  number: "Angka dari sumber, lalu keterangannya (satu per baris)",
                  chat: "Pesan, satu per baris, format \"Pengirim: isi pesan\". Pakai \"Kamu:\" untuk bubble kanan",
                  notification: "Tiga baris: nama aplikasi, judul, isi notifikasi",
                  call: "Dua baris: nama penelepon, status (mis. memanggil…)",
                }[s.visual.kind as "steps"]
              }
            </label>
            <textarea id={`it-${s.id}`} className="textarea" rows={3} value={s.visual.items.join("\n")} onChange={(e) => set({ visual: { ...s.visual, items: e.target.value.split("\n") } })} />
          </div>
        ) : null}
        {s.anim && isAnimLayout(p.layout) ? <AnimEditor s={s} layout={p.layout} chars={chars} onChange={(anim) => set({ anim })} /> : (
        <p className="prompt" style={{ margin: 0 }}>Prompt gambar/klip 3D: {s.prompt}</p>)}
        {s.visual.clip ? <p className="small muted" style={{ margin: 0 }}>Klip terpasang: {s.visual.clip}</p> : null}
        <div className="row">
          <button className="btn quiet sm" onClick={() => onRun("rewrite", s.id)} disabled={!!p.demo} title={p.demo ? "Butuh Claude CLI" : undefined}>
            Tulis ulang scene
          </button>
          <button
            className="btn quiet sm"
            onClick={() => {
              navigator.clipboard.writeText(s.prompt).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              });
            }}
          >
            {copied ? "Prompt disalin" : "Salin prompt"}
          </button>
          <button className="btn quiet sm" onClick={() => onRun("image", s.id)} disabled={!!p.demo} title={p.demo ? "Butuh GEMINI_API_KEY" : undefined}>
            {s.image ? "Buat ulang gambar 3D" : "Buat gambar 3D"}
          </button>
          <button className="btn quiet sm" onClick={() => upRef.current?.click()}>Upload gambar/klip</button>
          {s.image ? <button className="btn quiet sm" onClick={() => set({ image: "" })}>Hapus gambar</button> : null}
          <input ref={upRef} type="file" accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm" hidden onChange={(e) => e.target.files?.[0] && onUpload(s.id, e.target.files[0])} />
          {s.audio ? <audio controls preload="none" src={file(p.id, s.audio)} style={{ height: 36 }} aria-label={`Suara scene ${i + 1}`} /> : (
            <button className="btn quiet sm" onClick={() => onRun("voice", s.id)}>Buat suara</button>
          )}
        </div>
      </div>
    </div>
  );
}

function AdSceneRow({ s, i, p, onChange, onRun, onUpload }: {
  s: Scene;
  i: number;
  p: Project;
  onChange: (s: Scene) => void;
  onRun: (step: "voice" | "clip", id: string) => void;
  onUpload: (id: string, f: File) => void;
}) {
  const upRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Scene>) => onChange({ ...s, ...patch });
  return (
    <div className="scene">
      <div className="stack" style={{ gap: 8 }}>
        <span className="muted small" style={{ fontVariantNumeric: "tabular-nums" }}>Adegan {i + 1}{s.durationSec ? `, ${s.durationSec.toFixed(1)} dtk` : ""}</span>
        {s.visual.clip ? (
          <video className="thumb" src={file(p.id, s.visual.clip)} muted loop playsInline preload="metadata" onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => e.currentTarget.pause()} aria-label={`Klip adegan ${i + 1}`} />
        ) : (
          <span className="small muted" style={{ maxWidth: 120 }}>Belum ada klip, memakai foto produk.</span>
        )}
      </div>
      <div className="stack" style={{ gap: 12 }}>
        <div className="field">
          <label htmlFor={`t-${s.id}`} className="small">Voice over</label>
          <textarea id={`t-${s.id}`} className="line" rows={2} value={s.text} onChange={(e) => set({ text: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor={`sc-${s.id}`} className="small">{i === 0 ? "Teks layar setelah hook" : "Teks di layar"}</label>
          <input id={`sc-${s.id}`} className="input" value={s.screenText} onChange={(e) => set({ screenText: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor={`pr-${s.id}`} className="small">Adegan untuk klip AI (bahasa Inggris)</label>
          <textarea id={`pr-${s.id}`} className="textarea" rows={3} value={s.prompt} onChange={(e) => set({ prompt: e.target.value })} />
        </div>
        <div className="row">
          <button className="btn quiet sm" onClick={() => onRun("clip", s.id)} disabled={!!p.demo} title={p.demo ? "Butuh GEMINI_API_KEY" : undefined}>
            {s.visual.clip ? "Buat ulang klip" : "Buat klip AI"}
          </button>
          <button className="btn quiet sm" onClick={() => upRef.current?.click()}>Pakai klip sendiri</button>
          <input ref={upRef} type="file" accept="video/mp4,video/quicktime,video/webm" hidden onChange={(e) => e.target.files?.[0] && onUpload(s.id, e.target.files[0])} />
          {s.audio ? <audio controls preload="none" src={file(p.id, s.audio)} style={{ height: 36 }} aria-label={`Voice over adegan ${i + 1}`} /> : null}
          <button className="btn quiet sm" onClick={() => onRun("voice", s.id)}>{s.audio ? "Buat ulang suara" : "Buat suara"}</button>
        </div>
      </div>
    </div>
  );
}

function ProductPanel({ x, onSaved, onCopy }: { x: Product; onSaved: (p: Product) => void; onCopy: () => void }) {
  const [d, setD] = useState(x);
  const [err, setErr] = useState("");
  const dirty = d.link !== x.link || d.price !== x.price || d.name !== x.name;
  async function save() {
    setErr("");
    try {
      onSaved(await api<Product>(`/api/products/${x.id}`, { method: "PUT", json: d }));
    } catch (e: any) {
      setErr(e.message);
    }
  }
  return (
    <div className="card stack">
      <h2 className="h3">Produk</h2>
      {x.photos[0] ? <img className="ref" src={`/api/channels/${x.channelId}/file/${x.photos[0].replace("products/", "products~")}`} alt={`Foto ${x.name}`} /> : null}
      <div className="field"><label htmlFor="pp-name">Nama di kartu penutup</label><input id="pp-name" className="input" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></div>
      <div className="field"><label htmlFor="pp-price">Harga</label><input id="pp-price" className="input" placeholder="Kosongkan kalau tidak mau disebut" value={d.price} onChange={(e) => setD({ ...d, price: e.target.value })} /></div>
      <div className="field"><label htmlFor="pp-link">Link affiliate</label><input id="pp-link" className="input" placeholder="https://" value={d.link} onChange={(e) => setD({ ...d, link: e.target.value })} /></div>
      {err ? <p className="small" role="alert" style={{ color: "#B23A22", margin: 0 }}>{err}</p> : null}
      <div className="row">
        <button className="btn primary sm" disabled={!dirty} onClick={save}>Simpan produk</button>
        {x.link ? <button className="btn quiet sm" onClick={() => navigator.clipboard.writeText(x.link).then(onCopy)}>Salin link</button> : null}
      </div>
    </div>
  );
}

/** Tahap perancangan: jawab pertanyaan AI sebelum naskah ditulis. */
function BriefForm({ p, onDone, onError }: { p: Project; onDone: (p: Project) => void; onError: (m: string) => void }) {
  const [sending, setSending] = useState(false);
  async function send(answers: Record<string, string>, note: string, skip: boolean) {
    setSending(true);
    try {
      onDone(await api<Project>(`/api/projects/${p.id}/brief`, { method: "POST", json: { skip, note, answers } }));
    } catch (e: any) {
      onError(e.message);
      setSending(false);
    }
  }
  return (
    <div className="stack" style={{ maxWidth: 760, gap: 20 }}>
      <div className="stack" style={{ gap: 6 }}>
        <h2 className="h2">Sebelum nulis naskah, jawab ini dulu</h2>
        <p className="muted" style={{ margin: 0 }}>Jawabanmu dipakai untuk merancang naskah. Pilihan pertama adalah rekomendasi AI.</p>
      </div>
      <Questions questions={p.brief?.questions || []} busy={sending} submitLabel={sending ? "Mengirim…" : "Tulis naskah"} skipLabel="Lewati, langsung tulis"
        notePlaceholder="Mis. sebut merek HP Samsung, jangan terlalu seram untuk anak, pakai nama tokoh Raka…" onSubmit={send} />
    </div>
  );
}

/** Kotak persetujuan: naskah (sebelum video dibuat) atau video (sebelum diunggah). */
function ApprovalCard({ p, target, beforeSend, onDone, onError, alur, onAlur }: { p: Project; target: "script" | "video"; beforeSend: () => Promise<boolean>; onDone: (p: Project) => void; onError: (m: string) => void; alur?: Template[]; onAlur?: (id: string) => void }) {
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const history = (p.revisions || []).filter((r) => r.target === target || target === "script");
  async function go(kind: "approve" | "revise") {
    if (!(await beforeSend())) return;
    setSending(true);
    try {
      onDone(await api<Project>(`/api/projects/${p.id}/${kind}`, { method: "POST", json: { target, note } }));
      setNote("");
    } catch (e: any) {
      onError(e.message);
    }
    setSending(false);
  }
  const script = target === "script";
  return (
    <div className="card stack" style={{ border: "2px solid var(--navy)", gap: 14 }}>
      <div className="row between" style={{ alignItems: "flex-start" }}>
        <div className="stack" style={{ gap: 4 }}>
          <span className="tag warn" style={{ alignSelf: "flex-start" }}>{script ? "Menunggu persetujuan naskah" : "Menunggu persetujuan video"}</span>
          <p style={{ margin: 0 }}>
            {script
              ? "Baca naskahnya di tab Naskah & storyboard. Edit langsung kalau perlu, atau tulis catatan revisi untuk AI. Suara dan video baru dibuat setelah kamu setujui."
              : "Tonton videonya. Kalau sudah pas, setujui supaya siap diunggah. Kalau belum, tulis apa yang perlu diubah; naskahnya direvisi dulu dan kamu setujui lagi sebelum dirender ulang."}
          </p>
        </div>
      </div>
      {script && alur && alur.length > 1 ? (
        <div className="row" style={{ gap: 10, alignItems: "center" }}>
          <label htmlFor="alur" className="small" style={{ fontWeight: 700 }}>Alur</label>
          <select id="alur" className="select" style={{ maxWidth: 280 }} value={p.templateId} onChange={(e) => onAlur?.(e.target.value)}>
            {alur.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {p.templateReason ? <span className="muted small" style={{ flex: "1 1 240px" }}>{p.templateReason}</span> : null}
        </div>
      ) : null}
      {history.length ? (
        <details>
          <summary className="small muted" style={{ cursor: "pointer" }}>{history.length} revisi sebelumnya</summary>
          <ol className="small" style={{ margin: "8px 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
            {history.map((r) => <li key={r.at}>{r.target === "video" ? "Video: " : ""}{r.note}</li>)}
          </ol>
        </details>
      ) : null}
      <div className="field">
        <label htmlFor={`rev-${target}`}>Catatan revisi</label>
        <textarea id={`rev-${target}`} className="textarea" rows={3} placeholder={script ? "Mis. hook-nya kurang nendang, scene 3 terlalu panjang, ganti nama tokoh jadi Raka…" : "Mis. ekspresi di scene 2 kurang takut, penutupnya kepanjangan…"} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="row">
        <button className="btn primary" disabled={sending} onClick={() => go("approve")}>{script ? "Setujui naskah & buat video" : "Setujui video"}</button>
        <button className="btn" disabled={sending || note.trim().length < 3 || !!p.demo} title={p.demo ? "Revisi otomatis butuh AI teks" : undefined} onClick={() => go("revise")}>Revisi dengan AI</button>
      </div>
    </div>
  );
}

function ApprovedCard({ p }: { p: Project }) {
  return (
    <div className="card stack" style={{ border: "2px solid #2FB36B", gap: 8 }}>
      <span className="tag" style={{ alignSelf: "flex-start", background: "#2FB36B", color: "#fff" }}>Disetujui, siap diunggah</span>
      <p style={{ margin: 0 }}>Video ini sudah kamu setujui{p.approvedVideoAt ? ` pada ${new Date(p.approvedVideoAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}` : ""}. Unduh videonya dan caption untuk diunggah.</p>
      <p className="muted small" style={{ margin: 0 }}>Upload otomatis ke TikTok, Instagram, Facebook, dan YouTube menyusul. Video berstatus disetujui akan jadi antrean upload otomatis.</p>
    </div>
  );
}

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [p, setP] = useState<Project | null>(null);
  const [draft, setDraft] = useState<Project | null>(null);
  const [dirty, setDirty] = useState(false);
  const [chars, setChars] = useState<Character[]>([]);
  const [tpl, setTpl] = useState<Template | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Video");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [alur, setAlur] = useState<Template[]>([]);

  const load = useCallback(async () => {
    try {
      const d = await api<Project>(`/api/projects/${id}`);
      setP(d);
      setDraft((cur) => (dirty && cur ? cur : d));
    } catch (e: any) {
      if (String(e.message).includes("tidak ditemukan")) setNotFound(true);
      else setErr(e.message);
    }
  }, [id, dirty]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (p?.channelId) api(`/api/templates?channel=${p.channelId}`).then((d) => { setChars(d.characters); setAlur(d.templates.filter((t: Template) => t.id !== "product-ad")); }).catch(() => {});
    if (p?.channelId && p.kind === "affiliate")
      api(`/api/products?channel=${p.channelId}`).then((d) => setProducts(d.products.filter((x: Product) => p.productIds?.includes(x.id)))).catch(() => {});
  }, [p?.channelId]);
  useEffect(() => {
    if (p) api<Template>(`/api/templates/${p.templateId}`).then(setTpl).catch(() => {});
  }, [p?.templateId]);
  useEffect(() => {
    if (!p || !BUSY.includes(p.status)) return;
    const t = setInterval(load, 1500);
    return () => clearInterval(t);
  }, [p?.status, load]);

  useEffect(() => {
    if (p?.status === "script_review") setTab("Naskah & storyboard");
    if (p?.status === "ready") setTab("Video");
  }, [p?.status]);

  const edit = (patch: Partial<Project>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    setDirty(true);
  };

  async function save(): Promise<Project | null> {
    if (!draft) return null;
    setErr("");
    try {
      const d = await api<Project>(`/api/projects/${id}`, { method: "PATCH", json: draft });
      setP(d);
      setDraft(d);
      setDirty(false);
      setMsg("Perubahan disimpan.");
      setTimeout(() => setMsg(""), 2500);
      return d;
    } catch (e: any) {
      setErr(e.message);
      return null;
    }
  }

  async function run(step: string, sceneId?: string) {
    if (dirty && !(await save())) return;
    setErr("");
    try {
      const d = await api<Project>(`/api/projects/${id}/run`, { method: "POST", json: { step, sceneId } });
      setP(d);
      setDraft(d);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function upload(sceneId: string, f: File) {
    if (dirty && !(await save())) return;
    const fd = new FormData();
    fd.append("sceneId", sceneId);
    fd.append("file", f);
    setMsg("Mengunggah…");
    try {
      const d = await api<Project>(`/api/projects/${id}/upload`, { method: "POST", body: fd });
      setP(d);
      setDraft(d);
      setMsg("File terpasang. Render ulang untuk melihat hasilnya.");
    } catch (e: any) {
      setMsg("");
      setErr(e.message);
    }
  }

  async function remove() {
    if (!confirm("Hapus proyek ini beserta video dan suaranya?")) return;
    await api(`/api/projects/${id}`, { method: "DELETE" }).catch((e) => setErr(e.message));
    router.push("/proyek");
  }

  if (notFound)
    return (
      <div className="wrap">
        <h1 className="h1">Proyek tidak ditemukan</h1>
        <p className="lead">Mungkin sudah dihapus. Buka daftar proyek untuk memilih yang lain.</p>
        <div><Link className="btn primary" href="/proyek">Lihat proyek</Link></div>
      </div>
    );
  if (!p || !draft) return <p className="muted">{err ? `Proyek gagal dimuat: ${err}` : "Memuat proyek…"}</p>;

  const busy = BUSY.includes(p.status);
  const total = draft.scenes.reduce((n, s) => n + (s.durationSec || 0), 0);
  const isAd = p.templateId === "product-ad";
  const allowed = tpl?.characters || [...new Set(draft.scenes.map((s) => s.speaker))];

  return (
    <div className="wrap" style={{ maxWidth: 1360 }}>
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="stack" style={{ gap: 6, minWidth: 0 }}>
          <p className="muted small" style={{ margin: 0 }}>
            {p.templateId === "product-ad" ? "Video affiliate" : tpl?.name || p.templateId}, {p.platform} {p.durationTarget} detik{p.demo ? ", mode demo" : ""}
          </p>
          <h1 className="h1" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>{p.title || p.topic}</h1>
        </div>
        {!busy && p.status !== "failed" && p.status !== "brief" ? (
          <div className="row">
            {dirty ? <button className="btn primary" onClick={save}>Simpan perubahan</button> : null}
            {p.status !== "script_review" ? <button className="btn" onClick={() => run("render")}>{p.video ? "Render ulang" : "Render video"}</button> : null}
            {p.video ? <a className="btn accent" href={file(p.id, p.video, true)}>Unduh video</a> : null}
          </div>
        ) : null}
      </div>

      {msg ? <p className="small" role="status" style={{ margin: 0 }}>{msg}</p> : null}
      {err ? <p className="banner" role="alert">{err}</p> : null}

      {busy ? <Progress p={p} /> : null}

      {p.status === "brief" ? <BriefForm p={p} onDone={(d) => { setP(d); setDraft(d); }} onError={setErr} /> : null}
      {p.status === "script_review" ? (
        <ApprovalCard p={p} target="script" beforeSend={async () => !dirty || !!(await save())} onDone={(d) => { setP(d); setDraft(d); }} onError={setErr}
          alur={alur} onAlur={async (tid) => {
            if (!confirm("Ganti alur? Naskah akan ditulis ulang dengan alur ini.")) return;
            try {
              await api<Project>(`/api/projects/${id}`, { method: "PATCH", json: { ...(draft || {}), templateId: tid } });
              await run("script");
            } catch (e: any) { setErr(e.message); }
          }} />
      ) : null}
      {p.status === "ready" && p.video && p.kind !== "affiliate" && p.review !== "approved" && p.review !== "tayang" ? (
        <ApprovalCard p={p} target="video" beforeSend={async () => !dirty || !!(await save())} onDone={(d) => { setP(d); setDraft(d); }} onError={setErr} />
      ) : null}
      {p.review === "approved" && !busy ? <ApprovedCard p={p} /> : null}

      {p.status === "failed" ? (
        <div className="stack" style={{ maxWidth: 760, gap: 20 }}>
          <div className="card stack" style={{ border: "2px solid var(--salmon)" }}>
            <span className="tag warn" style={{ alignSelf: "flex-start" }}>{p.scenes.length ? "Proses berhenti" : "Naskah belum dibuat"}</span>
            <p style={{ margin: 0, fontSize: 17 }}>{p.error}</p>
          </div>
          <div className="row">
            <Link className="btn primary" href={`/?topik=${encodeURIComponent(p.topic)}&template=${p.templateId}`}>Ubah topik</Link>
            <button className="btn" onClick={() => run(p.scenes.length ? "render" : "all")}>Coba lagi</button>
          </div>
        </div>
      ) : null}

      {!busy && p.status !== "failed" && p.status !== "brief" ? (
        <div className="editor">
          <div className="col">
            <div className="seg" role="tablist" aria-label="Bagian konten" style={{ alignSelf: "flex-start" }}>
              {TABS.map((t) => (
                <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>

            {tab === "Video" ? (
              <div className="card stack" role="tabpanel">
                {p.video ? (
                  <>
                    <div className="phone"><video controls src={file(p.id, p.video)} width={280} height={498} /></div>
                    {p.status === "draft" ? <p className="small muted" style={{ margin: 0 }}>{p.stage}</p> : null}
                  </>
                ) : (
                  <div className="stack">
                    <h2 className="h3">Video belum dirender</h2>
                    <p className="muted" style={{ margin: 0 }}>Naskah sudah siap. Render untuk membuat suara yang belum ada dan menggabungkan semuanya jadi MP4.</p>
                    <div><button className="btn primary" onClick={() => run("render")}>Render video</button></div>
                  </div>
                )}
                <div className="row">
                  <a className="btn quiet sm" href={file(p.id, "caption.txt")}>Unduh caption</a>
                  <a className="btn quiet sm" href={file(p.id, "prompts.txt")}>Unduh prompt klip</a>
                  {p.srt ? <a className="btn quiet sm" href={file(p.id, "subtitle.srt", true)}>Unduh subtitle .srt</a> : null}
                </div>
              </div>
            ) : null}

            {tab === "Naskah & storyboard" ? (
              <div className="card flush" role="tabpanel">
                <div className="card-head">
                  <span className="muted">{draft.scenes.length} {isAd ? "adegan" : "scene"}{total ? `, total ${Math.round(total)} detik` : ""}. Klik teks untuk mengedit langsung.</span>
                  <button className="btn quiet sm" onClick={() => (!isAd || confirm("Tulis ulang semua adegan? Klip dan suara yang ada akan dihapus.")) && run("script")} disabled={!isAd && !!p.demo} title={!isAd && p.demo ? "Butuh Claude CLI" : undefined}>Tulis ulang semua</button>
                </div>
                <div className="list">
                  {draft.scenes.map((s, i) => isAd ? (
                    <AdSceneRow
                      key={s.id}
                      s={s}
                      i={i}
                      p={p}
                      onChange={(ns) => edit({ scenes: draft.scenes.map((x) => (x.id === ns.id ? ns : x)) })}
                      onRun={(step, sid) => run(step, sid)}
                      onUpload={upload}
                    />
                  ) : (
                    <SceneRow
                      key={s.id}
                      s={s}
                      i={i}
                      p={p}
                      chars={chars}
                      allowed={allowed}
                      onChange={(ns) => edit({ scenes: draft.scenes.map((x) => (x.id === ns.id ? ns : x)) })}
                      onRun={(step, sid) => run(step, sid)}
                      onUpload={upload}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {tab === "Suara & subtitle" ? (
              <div className="card stack" role="tabpanel">
                <div className="row between">
                  <h2 className="h3">Suara per karakter</h2>
                  <button className="btn primary sm" onClick={() => run("voice")}>Buat ulang semua suara</button>
                </div>
                {isAd ? (
                  <div className="field" style={{ maxWidth: 320 }}>
                    <label htmlFor="ad-voice">Suara narator</label>
                    <select id="ad-voice" className="select" value={draft.voice || "Leda"} onChange={(e) => edit({ voice: e.target.value })}>
                      {VOICES.map((v) => <option key={v}>{v}</option>)}
                    </select>
                    <span className="muted small">Setelah ganti suara, simpan lalu klik Buat ulang semua suara.</span>
                  </div>
                ) : (
                <p className="muted" style={{ margin: 0 }}>Voice dikunci di halaman <Link href="/karakter">Karakter &amp; suara</Link>, jadi tiap karakter terdengar sama sampai penutup.</p>
                )}
                {!isAd && allowed.map((cid) => {
                  const c = chars.find((x) => x.id === cid);
                  const sc = draft.scenes.filter((s) => s.speaker === cid);
                  const sec = sc.reduce((n, s) => n + (s.durationSec || 0), 0);
                  const missing = sc.filter((s) => !s.audio).length;
                  return (
                    <div key={cid} className="row" style={{ padding: 16, background: "var(--soft)", borderRadius: 12 }}>
                      <span className="tag" style={{ background: cid === "paham" ? "var(--navy)" : c?.color, color: cid === "paham" ? "var(--light)" : c?.textColor, minWidth: 70, textAlign: "center" }}>{c?.name || cid}</span>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontWeight: 600 }}>Gemini TTS, voice {c?.voice}</div>
                        <div className="muted small">{sc.length} baris, {Math.round(sec)} detik{missing ? `, ${missing} belum dibuat` : ""}.{p.demo ? " Mode demo: suara hening." : ""}</div>
                      </div>
                    </div>
                  );
                })}
                <h2 className="h3" style={{ marginTop: 10 }}>Subtitle</h2>
                <p className="muted" style={{ margin: 0 }}>Maksimal 2 baris per tampilan. Kata yang di-highlight diambil dari kolom &quot;Kata yang di-highlight&quot; tiap scene.</p>
                {p.srt ? <div><a className="btn" href={file(p.id, "subtitle.srt", true)}>Unduh subtitle .srt</a></div> : <p className="small muted" style={{ margin: 0 }}>Subtitle dibuat setelah suara selesai.</p>}
              </div>
            ) : null}

            {tab === "Caption & cover" ? (
              <div className="row" style={{ alignItems: "flex-start", gap: 20 }} role="tabpanel">
                <div className="stack" style={{ flex: "2 1 360px", gap: 20 }}>
                  <div className="card stack">
                    <div className="field">
                      <label htmlFor="cap">Caption</label>
                      <textarea id="cap" className="textarea" rows={4} value={draft.caption || ""} onChange={(e) => edit({ caption: e.target.value })} />
                    </div>
                    <div className="field">
                      <label htmlFor="tags">Hashtag</label>
                      <input id="tags" className="input" value={(draft.hashtags || []).join(" ")} onChange={(e) => edit({ hashtags: e.target.value.split(/\s+/).filter(Boolean) })} />
                      <span className="muted small">{(draft.caption || "").length} karakter. Pakai hashtag umum, tanpa #kodekepo.</span>
                    </div>
                    <div>
                      <button className="btn quiet sm" onClick={() => navigator.clipboard.writeText(`${draft.caption}\n\n${(draft.hashtags || []).join(" ")}`).then(() => setMsg("Caption disalin."))}>Salin caption</button>
                    </div>
                  </div>
                  <fieldset className="card stack" style={{ margin: 0 }}>
                    <legend className="h3" style={{ padding: 0, marginBottom: 6 }}>Pilih judul</legend>
                    {(draft.titleOptions || []).map((t) => (
                      <label key={t} className="row" style={{ padding: 14, borderRadius: 12, border: draft.title === t ? "2px solid var(--navy)" : "1px solid var(--line2)", cursor: "pointer" }}>
                        <input type="radio" name="judul" checked={draft.title === t} onChange={() => edit({ title: t })} />
                        <span style={{ fontWeight: draft.title === t ? 650 : 500 }}>{t}</span>
                      </label>
                    ))}
                  </fieldset>
                </div>
                <div className="card stack" style={{ flex: "1 1 260px" }}>
                  <h2 className="h3">Cover</h2>
                  <div className="phone cover" style={{ maxWidth: 240 }}>
                    <span><Highlight text={draft.coverText || ""} word={draft.coverKeyword} /></span>
                  </div>
                  <div className="field">
                    <label htmlFor="cv">Teks cover</label>
                    <input id="cv" className="input" value={draft.coverText || ""} onChange={(e) => edit({ coverText: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="cvk">Kata yang di-highlight</label>
                    <input id="cvk" className="input" value={draft.coverKeyword || ""} onChange={(e) => edit({ coverKeyword: e.target.value })} />
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <aside aria-label="Pemeriksaan dan publikasi">
            <div className="checks">
              <h2 className="h2" style={{ color: "var(--light)" }}>Siap tayang?</h2>
              <ul>
                {(p.checks || []).map((c, i) => (
                  <li key={i}>
                    <span className={"tag " + (c.ok ? "" : "warn")}>{c.ok ? "Aman" : "Cek dulu"}</span>
                    <span>{c.text}</span>
                  </li>
                ))}
                {!p.checks?.length ? <li><span className="tag">Info</span><span>Pemeriksaan muncul setelah naskah dibuat.</span></li> : null}
              </ul>
            </div>
            {p.kind === "affiliate" ? (
              <div className="card stack">
                <h2 className="h3">Saat upload</h2>
                <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {AFFILIATE_UPLOAD.map((t) => <li key={t}>{t}</li>)}
                </ol>
              </div>
            ) : null}
            {isAd && products[0] ? <ProductPanel x={products[0]} onSaved={(np) => { setProducts([np]); setMsg("Produk disimpan. Render ulang supaya kartu penutup ikut berubah."); }} onCopy={() => setMsg("Link disalin.")} /> : null}
            {!isAd ? (
            <div className="card stack">
              <h2 className="h3">Sumber</h2>
              {draft.sources.length ? (
                draft.sources.map((s, i) => (
                  <div key={s.url} className="stack" style={{ gap: 4 }}>
                    <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
                    <label className="row small muted" style={{ gap: 8 }}>
                      <input type="checkbox" checked={s.verified} onChange={(e) => edit({ sources: draft.sources.map((x, j) => (j === i ? { ...x, verified: e.target.checked } : x)) })} />
                      Sudah saya cek
                    </label>
                  </div>
                ))
              ) : (
                <p className="muted small" style={{ margin: 0 }}>{p.demo ? "Mode demo tidak melakukan riset, jadi belum ada sumber." : "Belum ada sumber."}</p>
              )}
            </div>
            ) : null}
            <div className="card stack">
              <h2 className="h3">Publikasi</h2>
              <div className="seg" role="group" aria-label="Status publikasi">
                {(["draft", "review", "approved", "tayang"] as const).map((r) => (
                  <button key={r} aria-pressed={(draft.review || "draft") === r} onClick={() => edit({ review: r })}>
                    {r === "draft" ? "Draft" : r === "review" ? "Review" : r === "approved" ? "Disetujui" : "Tayang"}
                  </button>
                ))}
              </div>
              <div className="grid2">
                {!isAd ? (
                <div className="field">
                  <label htmlFor="ep">Episode</label>
                  <input id="ep" className="input" placeholder="EP.026" value={draft.episode || ""} onChange={(e) => edit({ episode: e.target.value })} />
                </div>
                ) : null}
                <div className="field">
                  <label htmlFor="vw">Views TikTok</label>
                  <input id="vw" className="input" placeholder="Isi setelah tayang" value={draft.views || ""} onChange={(e) => edit({ views: e.target.value })} />
                </div>
              </div>
              {dirty ? <button className="btn primary" onClick={save}>Simpan perubahan</button> : null}
              <button className="btn quiet sm" style={{ alignSelf: "flex-start" }} onClick={remove}>Hapus proyek</button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
