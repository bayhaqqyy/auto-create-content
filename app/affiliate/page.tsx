"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../components/api";
import { useChannel } from "../../components/channel";
import type { Project } from "../../lib/types";

const VOICES = [
  { v: "Leda", l: "Leda, perempuan muda" },
  { v: "Aoede", l: "Aoede, perempuan santai" },
  { v: "Kore", l: "Kore, perempuan tegas" },
  { v: "Puck", l: "Puck, laki-laki ceria" },
  { v: "Charon", l: "Charon, laki-laki tenang" },
  { v: "Fenrir", l: "Fenrir, laki-laki semangat" },
];
const VIBES = [
  { v: "santai", l: "Santai", d: "Seperti cerita ke teman" },
  { v: "ceria", l: "Ceria", d: "Cepat dan semangat" },
  { v: "elegan", l: "Elegan", d: "Tenang, kesan premium" },
];
const STATUS: Record<string, string> = { ready: "Siap", draft: "Perlu render ulang", failed: "Gagal" };

export default function Affiliate() {
  const { current } = useChannel();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [link, setLink] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [tried, setTried] = useState(false);
  const [duration, setDuration] = useState(25);
  const [vibe, setVibe] = useState("santai");
  const [style, setStyle] = useState<"review" | "harian">("review");
  const [voice, setVoice] = useState("Leda");
  const [ambient, setAmbient] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [list, setList] = useState<Project[] | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!current) return;
    api(`/api/affiliate?channel=${current.id}`).then((d) => setList(d.projects)).catch(() => setList([]));
  }, [current?.id]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function addFiles(fl: FileList | null) {
    if (!fl) return;
    const next = [...files, ...Array.from(fl).filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type))].slice(0, 3);
    setFiles(next);
  }

  const ready = files.length > 0 || /^https:\/\/\S+/.test(link);

  async function submit() {
    if (!current) return;
    setBusy(true);
    setErr("");
    const fd = new FormData();
    fd.append("channelId", current.id);
    files.forEach((f) => fd.append("photos", f));
    fd.append("link", link.trim());
    fd.append("name", name);
    fd.append("price", price);
    fd.append("notes", notes);
    fd.append("tried", tried ? "1" : "0");
    fd.append("duration", String(duration));
    fd.append("vibe", vibe);
    fd.append("style", style);
    fd.append("voice", voice);
    fd.append("ambient", ambient ? "1" : "0");
    try {
      const p = await api<Project>("/api/affiliate", { method: "POST", body: fd });
      router.push(`/proyek/${p.id}`);
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <div className="stack" style={{ gap: 10 }}>
        <h1 className="h1">Video affiliate</h1>
        <p className="lead" style={{ maxWidth: "62ch" }}>
          Kasih foto atau link produknya. AI membuat video produk itu dipakai sehari-hari, lengkap dengan voice over dan ajakan cek keranjang kuning.
        </p>
      </div>

      <section className="card stack" style={{ gap: 22 }} aria-labelledby="h-prod">
        <h2 className="h2" id="h-prod">Produknya</h2>
        <div
          className="drop"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
        >
          {previews.length ? (
            <div className="row" style={{ gap: 14 }}>
              {previews.map((u, i) => (
                <div key={u} className="stack" style={{ gap: 6, alignItems: "flex-start" }}>
                  <img className="ref" src={u} alt={`Foto produk ${i + 1}`} />
                  <button className="btn quiet sm" onClick={() => setFiles(files.filter((_, j) => j !== i))}>Hapus</button>
                </div>
              ))}
              {files.length < 3 ? <button className="btn quiet" onClick={() => input.current?.click()}>Tambah foto</button> : null}
            </div>
          ) : (
            <div className="stack" style={{ gap: 8, alignItems: "center", textAlign: "center" }}>
              <button className="btn" onClick={() => input.current?.click()}>Pilih foto produk</button>
              <span className="muted small">Atau tarik foto ke sini. 1–3 foto, makin jelas bentuk produknya makin mirip videonya.</span>
            </div>
          )}
          <input ref={input} type="file" multiple accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => addFiles(e.target.files)} />
        </div>
        <div className="field">
          <label htmlFor="link">Link produk (keranjang / affiliate)</label>
          <input id="link" className="input" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} />
          <span className="muted small">Kalau tidak upload foto, foto dan nama diambil dari link. Beberapa toko menolak dibaca; kalau begitu, upload fotonya.</span>
        </div>
        <div className="grid2">
          <div className="field"><label htmlFor="nm">Nama produk (opsional)</label><input id="nm" className="input" placeholder="Dikenali AI dari foto kalau kosong" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="field"><label htmlFor="pr">Harga (opsional)</label><input id="pr" className="input" placeholder="Kosongkan kalau tidak mau disebut" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
        </div>
        <div className="field">
          <label htmlFor="nt">Fitur yang mau ditunjukkan (salin dari halaman toko)</label>
          <textarea id="nt" className="textarea" rows={3} placeholder="Mis. case magnetik, keyboard bisa dilepas, bluetooth, ada trackpad" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <label className="row" style={{ gap: 8 }}>
          <input type="checkbox" checked={tried} onChange={(e) => setTried(e.target.checked)} /> Produk ini sudah saya coba sendiri
        </label>
      </section>

      <section className="stack" style={{ gap: 18 }} aria-labelledby="h-atur">
        <h2 className="h2" id="h-atur">Gaya videonya</h2>
        <div className="row" style={{ alignItems: "stretch" }}>
          {[
            { v: "review" as const, l: "Review hands-on", d: "POV tangan di meja: unboxing, tunjukkan detail, coba fitur satu per satu, lalu ajak cek keranjang." },
            { v: "harian" as const, l: "Dipakai sehari-hari", d: "Produk dipakai di rumah, kos, atau kantor: masalah, solusi, hasil akhirnya." },
          ].map((x) => (
            <button key={x.v} type="button" className="tpl" aria-pressed={style === x.v} onClick={() => setStyle(x.v)} style={{ minHeight: 0, flex: "1 1 280px", flexDirection: "column", gap: 6 }}>
              <span className="tpl-name">{x.l}</span>
              <span className="muted" style={{ fontSize: 14 }}>{x.d}</span>
            </button>
          ))}
        </div>
        <div className="row" style={{ gap: "24px 32px", alignItems: "flex-start" }}>
          <div className="field">
            <span className="label">Durasi</span>
            <div className="seg" role="group" aria-label="Durasi">
              {[15, 25, 35].map((d) => (
                <button key={d} type="button" aria-pressed={duration === d} onClick={() => setDuration(d)}>{d} detik</button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="label">Nuansa</span>
            <div className="seg" role="group" aria-label="Nuansa">
              {VIBES.map((x) => (
                <button key={x.v} type="button" aria-pressed={vibe === x.v} title={x.d} onClick={() => setVibe(x.v)}>{x.l}</button>
              ))}
            </div>
          </div>
          <div className="field" style={{ minWidth: 240 }}>
            <label htmlFor="vc">Suara narator</label>
            <select id="vc" className="select" value={voice} onChange={(e) => setVoice(e.target.value)}>
              {VOICES.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}
            </select>
          </div>
        </div>
        <label className="row" style={{ gap: 8 }}>
          <input type="checkbox" checked={ambient} onChange={(e) => setAmbient(e.target.checked)} /> Pertahankan suara suasana dari klip (pelan, di bawah voice over)
        </label>
      </section>

      {err ? <p className="banner" role="alert">{err}</p> : null}

      <div className="actionbar">
        <p>{style === "review" ? "Review hands-on" : "Dipakai sehari-hari"}, {duration} detik, nuansa {VIBES.find((x) => x.v === vibe)?.l.toLowerCase()}, suara {voice}. Klip AI butuh 1–3 menit per adegan.</p>
        <div className="row">
          {!ready ? <span className="small" style={{ color: "#C9D2E0" }}>Aktif setelah ada foto atau link.</span> : null}
          <button className="btn accent" disabled={!ready || busy || !current} onClick={submit}>{busy ? "Mengirim…" : "Buat video"}</button>
        </div>
      </div>

      <section className="stack" style={{ gap: 14 }} aria-labelledby="h-list">
        <h2 className="h2" id="h-list">Video affiliate sebelumnya</h2>
        {list === null ? <p className="muted">Memuat…</p> : null}
        {list && !list.length ? <p className="muted">Belum ada. Video pertamamu akan muncul di sini.</p> : null}
        {list && list.length ? (
          <div className="card flush list">
            {list.map((p) => (
              <a key={p.id} href={`/proyek/${p.id}`} className="row between" style={{ padding: "16px 22px", textDecoration: "none", color: "inherit" }}>
                <span className="stack" style={{ gap: 2 }}>
                  <span style={{ fontWeight: 700 }}>{p.title || p.topic}</span>
                  <span className="muted small">{new Date(p.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}, {p.durationTarget} detik</span>
                </span>
                <span className="small">{STATUS[p.status] || p.stage || "Diproses"}</span>
              </a>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
