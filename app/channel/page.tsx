"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "../../components/api";
import { useChannel } from "../../components/channel";
import { BrandPreview } from "../../components/BrandPreview";
import type { Channel } from "../../lib/types";
import { LAYOUTS } from "../../lib/defaults";

const COLOR_LABELS: [keyof Channel["colors"], string][] = [
  ["bg", "Latar"],
  ["card", "Kartu"],
  ["accent", "Aksen utama"],
  ["accent2", "Aksen kedua"],
  ["text", "Teks"],
  ["muted", "Teks redup"],
  ["outroBg", "Latar outro"],
  ["outroText", "Teks outro"],
];

export default function BrandKit() {
  const { current, reload, channels, setCurrent } = useChannel();
  const [ch, setCh] = useState<Channel | null>(null);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [rule, setRule] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);
  const bgmRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (current && (!ch || ch.id !== current.id || !dirty)) {
      setCh(current);
      setDirty(false);
    }
  }, [current]);

  if (!ch) return <p className="muted">Memuat brand kit…</p>;
  const set = (patch: Partial<Channel>) => {
    setCh({ ...ch, ...patch });
    setDirty(true);
  };
  const fileUrl = (name?: string) => (name ? `/api/channels/${ch.id}/file/${name}?v=${name}` : undefined);

  async function save() {
    setErr("");
    try {
      await api(`/api/channels/${ch!.id}`, { method: "PUT", json: ch });
      await reload();
      setDirty(false);
      setMsg("Brand kit disimpan. Video berikutnya di channel ini memakai pengaturan ini.");
    } catch (e: any) {
      setErr(e.message);
    }
  }
  async function upload(kind: "logo" | "bgm", f: File) {
    setErr("");
    const fd = new FormData();
    fd.append("kind", kind);
    fd.append("file", f);
    try {
      const d = await api<Channel>(`/api/channels/${ch!.id}/asset`, { method: "POST", body: fd });
      setCh({ ...ch!, logo: d.logo, bgm: d.bgm });
      await reload();
      setMsg(kind === "logo" ? "Logo terpasang." : "Musik latar terpasang.");
    } catch (e: any) {
      setErr(e.message);
    }
  }
  async function removeAsset(kind: "logo" | "bgm") {
    const d = await api<Channel>(`/api/channels/${ch!.id}/asset?kind=${kind}`, { method: "DELETE" }).catch((e) => (setErr(e.message), null));
    if (d) {
      setCh({ ...ch!, logo: d.logo, bgm: d.bgm });
      await reload();
    }
  }
  async function removeChannel() {
    if (!confirm(`Hapus channel ${ch!.name} beserta template dan karakternya?`)) return;
    try {
      await api(`/api/channels/${ch!.id}`, { method: "DELETE" });
      const next = channels?.find((c) => c.id !== ch!.id);
      if (next) setCurrent(next.id);
      await reload();
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div className="wrap" style={{ maxWidth: 1240 }}>
      <div className="row between" style={{ alignItems: "flex-end", gap: 24 }}>
        <div className="stack" style={{ gap: 10, flex: "1 1 420px" }}>
          <h1 className="h1">Brand kit</h1>
          <p className="lead">Warna, teks, outro, dan gaya visual yang dipakai semua video di channel <b>{ch.name}</b>.</p>
        </div>
        <Link href="/channel/baru" className="btn">Buat channel baru</Link>
      </div>
      {err ? <p className="banner" role="alert">{err}</p> : null}
      <div className="editor">
        <div className="col">
          <section className="card stack" style={{ gap: 16 }}>
            <h2 className="h3">Identitas</h2>
            <div className="grid2">
              <div className="field"><label htmlFor="nm">Nama channel</label><input id="nm" className="input" value={ch.name} onChange={(e) => set({ name: e.target.value })} /></div>
              <div className="field"><label htmlFor="hd">Teks header di video</label><input id="hd" className="input" value={ch.headerText} onChange={(e) => set({ headerText: e.target.value })} /></div>
              <div className="field"><label htmlFor="tg">Tagline</label><input id="tg" className="input" value={ch.tagline} onChange={(e) => set({ tagline: e.target.value })} /><span className="muted small">Pakai koma untuk memecah jadi dua baris di outro.</span></div>
              <div className="field"><label htmlFor="au">Penonton</label><input id="au" className="input" value={ch.audience} onChange={(e) => set({ audience: e.target.value })} /></div>
            </div>
            <div className="field"><label htmlFor="ni">Isi channel</label><textarea id="ni" className="textarea" rows={3} value={ch.niche} onChange={(e) => set({ niche: e.target.value })} /><span className="muted small">Dipakai AI sebagai konteks setiap menulis naskah.</span></div>
          </section>

          <section className="card stack" style={{ gap: 12 }}>
            <h2 className="h3">Aturan bahasa</h2>
            <p className="muted small" style={{ margin: 0 }}>Berlaku untuk semua template di channel ini.</p>
            {ch.voiceRules.map((r, i) => (
              <div key={i} className="row" style={{ padding: "12px 14px", background: "var(--soft)", borderRadius: 10 }}>
                <span style={{ flex: 1, minWidth: 200 }}>{r}</span>
                <button className="btn quiet sm" onClick={() => set({ voiceRules: ch.voiceRules.filter((_, j) => j !== i) })} aria-label={`Hapus aturan: ${r}`}>Hapus</button>
              </div>
            ))}
            <form className="row" onSubmit={(e) => { e.preventDefault(); if (rule.trim()) { set({ voiceRules: [...ch.voiceRules, rule.trim()] }); setRule(""); } }}>
              <label htmlFor="nr" style={{ position: "absolute", left: -9999 }}>Aturan baru</label>
              <input id="nr" className="input" style={{ flex: 1, minWidth: 220 }} placeholder="Tulis aturan baru" value={rule} onChange={(e) => setRule(e.target.value)} />
              <button className="btn quiet" type="submit">Tambah aturan</button>
            </form>
            <div className="field"><label htmlFor="hn">Aturan hashtag</label><input id="hn" className="input" value={ch.hashtagNote} onChange={(e) => set({ hashtagNote: e.target.value })} /><span className="muted small">Tulis &quot;Jangan pakai #namatag&quot; supaya otomatis dicek sebelum tayang.</span></div>
          </section>

          <section className="card stack" style={{ gap: 16 }}>
            <h2 className="h3">Tampilan video</h2>
            <div className="swatch-row">
              {COLOR_LABELS.map(([k, l]) => (
                <div className="swatch" key={k}>
                  <label htmlFor={`c-${k}`} className="small">{l}</label>
                  <input id={`c-${k}`} type="color" value={ch.colors[k]} onChange={(e) => set({ colors: { ...ch.colors, [k]: e.target.value.toUpperCase() } })} />
                </div>
              ))}
            </div>
            <div className="grid2">
              <div className="field">
                <label htmlFor="ft">Font</label>
                <select id="ft" className="select" value={ch.font} onChange={(e) => set({ font: e.target.value as Channel["font"] })}>
                  <option value="jakarta">Plus Jakarta Sans</option>
                  <option value="archivo">Archivo</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="vm">Gaya visual bawaan</label>
                <select id="vm" className="select" value={ch.visualMode} onChange={(e) => set({ visualMode: e.target.value as Channel["visualMode"] })}>
                  <option value="cards">Kartu motion graphic</option>
                  <option value="3d">Gambar 3D AI per scene</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="lay">Tampilan video bawaan</label>
              <select id="lay" className="select" value={ch.layout || "kartu"} onChange={(e) => set({ layout: e.target.value as Channel["layout"] })}>
                {LAYOUTS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <span className="muted small">{LAYOUTS.find((l) => l.id === (ch.layout || "kartu"))?.desc} Template bisa memakai tampilan lain.</span>
            </div>
            <label className="row small" style={{ gap: 8 }}>
              <input type="checkbox" checked={ch.grid} onChange={(e) => set({ grid: e.target.checked })} /> Latar grid tipis
            </label>
            <label className="row small" style={{ gap: 8 }}>
              <input type="checkbox" checked={!!ch.showHeader} onChange={(e) => set({ showHeader: e.target.checked })} /> Tampilkan header nama channel di atas video
              <span className="muted">(bawaan mati, area atas tertutup kolom cari TikTok)</span>
            </label>
            <div className="field"><label htmlFor="is">Gaya gambar 3D (bahasa Inggris)</label><textarea id="is" className="textarea" rows={2} value={ch.imageStyle} onChange={(e) => set({ imageStyle: e.target.value })} /></div>
          </section>

          <section className="card stack" style={{ gap: 16 }}>
            <h2 className="h3">Outro</h2>
            <div className="grid2">
              <div className="field"><label htmlFor="ot">Teaser episode depan</label><input id="ot" className="input" value={ch.outroTeaser} onChange={(e) => set({ outroTeaser: e.target.value })} /></div>
              <div className="field"><label htmlFor="of">Ajakan follow</label><input id="of" className="input" value={ch.outroFollow} onChange={(e) => set({ outroFollow: e.target.value })} /></div>
            </div>
            <div className="row" style={{ alignItems: "center" }}>
              {ch.logo ? <img src={fileUrl(ch.logo)} alt="Logo channel" style={{ height: 56, background: "#fff", padding: 8, borderRadius: 10, border: "1px solid var(--line2)" }} /> : <span className="muted small">Belum ada logo. Outro memakai nama channel sebagai teks.</span>}
              <button className="btn quiet sm" onClick={() => logoRef.current?.click()}>{ch.logo ? "Ganti logo" : "Upload logo"}</button>
              {ch.logo ? <button className="btn quiet sm" onClick={() => removeAsset("logo")}>Hapus logo</button> : null}
              <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => e.target.files?.[0] && upload("logo", e.target.files[0])} />
            </div>
          </section>

          <section className="card stack" style={{ gap: 16 }}>
            <h2 className="h3">Musik latar</h2>
            <div className="grid2">
              <div className="field">
                <label htmlFor="bp">Musik bawaan</label>
                <select id="bp" className="select" value={ch.bgmPreset} onChange={(e) => set({ bgmPreset: e.target.value as Channel["bgmPreset"] })}>
                  <option value="tech">Tech (tenang, berdenyut)</option>
                  <option value="ceria">Ceria (untuk anak & santai)</option>
                  <option value="horor">Horor (mencekam, pelan)</option>
                  <option value="motivasi">Motivasi (hangat, naik pelan)</option>
                  <option value="none">Tanpa musik</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="bv">Volume saat dialog: {Math.round(ch.bgmVolume * 100)}%</label>
                <input id="bv" type="range" min={0} max={0.3} step={0.01} value={ch.bgmVolume} onChange={(e) => set({ bgmVolume: Number(e.target.value) })} />
              </div>
            </div>
            <div className="row">
              {ch.bgm ? <audio controls src={fileUrl(ch.bgm)} style={{ height: 36 }} aria-label="Musik latar channel" /> : <span className="muted small">Musik bawaan dibuat khusus untuk studio ini. Upload musikmu sendiri kalau punya lisensinya.</span>}
              <button className="btn quiet sm" onClick={() => bgmRef.current?.click()}>{ch.bgm ? "Ganti musik" : "Upload musik"}</button>
              {ch.bgm ? <button className="btn quiet sm" onClick={() => removeAsset("bgm")}>Pakai musik bawaan</button> : null}
              <input ref={bgmRef} type="file" accept="audio/mpeg,audio/wav,audio/mp4" hidden onChange={(e) => e.target.files?.[0] && upload("bgm", e.target.files[0])} />
            </div>
          </section>
        </div>

        <aside>
          <div className="card stack">
            <h2 className="h3">Pratinjau</h2>
            <BrandPreview ch={ch} logoUrl={fileUrl(ch.logo)} />
          </div>
          <button className="btn primary" onClick={save} disabled={!dirty}>Simpan brand kit</button>
          {msg && !dirty ? <p className="small" role="status" style={{ margin: 0 }}>{msg}</p> : null}
          {dirty ? <p className="small muted" style={{ margin: 0 }}>Ada perubahan yang belum disimpan.</p> : null}
          <button className="btn quiet sm" style={{ alignSelf: "flex-start" }} onClick={removeChannel}>Hapus channel</button>
        </aside>
      </div>
    </div>
  );
}
