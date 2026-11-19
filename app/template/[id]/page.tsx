"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../components/api";
import { Strip } from "../../../components/Strip";
import type { Character, Layout, Template } from "../../../lib/types";
import { LAYOUTS } from "../../../lib/defaults";

export default function EditTemplate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [t, setT] = useState<Template | null>(null);
  const [chars, setChars] = useState<Character[]>([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [newRule, setNewRule] = useState("");

  useEffect(() => {
    api<Template>(`/api/templates/${id}`)
      .then((tt) => {
        setT(tt);
        return api(`/api/templates?channel=${tt.channelId}`).then((d) => setChars(d.characters));
      })
      .catch((e) => setErr(e.message));
  }, [id]);

  if (!t) return <p className="muted">{err || "Memuat template…"}</p>;
  const set = (patch: Partial<Template>) => setT({ ...t, ...patch });
  const total = t.scenes.reduce((n, s) => n + (Number(s.seconds) || 0), 0);
  const inRange = total >= t.minSec && total <= t.maxSec;
  const nameOf = (cid: string) => chars.find((c) => c.id === cid)?.name || cid;

  async function save() {
    setErr("");
    try {
      await api(`/api/templates/${id}`, { method: "PUT", json: t });
      setMsg("Template disimpan.");
      setTimeout(() => setMsg(""), 2500);
    } catch (e: any) {
      setErr(e.message);
    }
  }
  async function remove() {
    if (!confirm(`Hapus template ${t!.name}?`)) return;
    try {
      await api(`/api/templates/${id}`, { method: "DELETE" });
      router.push("/template");
    } catch (e: any) {
      setErr(e.message);
    }
  }
  const move = (i: number, d: number) => {
    const s = [...t.scenes];
    const j = i + d;
    if (j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j], s[i]];
    set({ scenes: s });
  };

  return (
    <div className="wrap" style={{ maxWidth: 1200 }}>
      <div className="stack" style={{ gap: 10 }}>
        <nav aria-label="Breadcrumb" className="small">
          <Link href="/template">Template</Link> <span className="muted">/ {t.name}</span>
        </nav>
        <h1 className="h1">{t.name || "Template baru"}</h1>
      </div>
      {err ? <p className="banner" role="alert">{err}</p> : null}
      <div className="editor">
        <div className="col">
          <section className="card stack" style={{ gap: 18 }}>
            <h2 className="h3">Dasar</h2>
            <div className="field">
              <label htmlFor="nm">Nama template</label>
              <input id="nm" className="input" value={t.name} onChange={(e) => set({ name: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="ds">Deskripsi singkat</label>
              <input id="ds" className="input" value={t.description} onChange={(e) => set({ description: e.target.value })} />
              <span className="muted small">Muncul di kartu template saat buat konten.</span>
            </div>
            <div className="row" style={{ alignItems: "flex-start" }}>
              <div className="field" style={{ width: 200 }}>
                <label htmlFor="mn">Durasi minimal (detik)</label>
                <input id="mn" type="number" min={10} className="input" value={t.minSec} onChange={(e) => set({ minSec: Number(e.target.value) })} />
              </div>
              <div className="field" style={{ width: 200 }}>
                <label htmlFor="mx">Durasi maksimal (detik)</label>
                <input id="mx" type="number" min={10} className="input" value={t.maxSec} onChange={(e) => set({ maxSec: Number(e.target.value) })} />
              </div>
            </div>
            <div className="field" style={{ maxWidth: 320 }}>
              <label htmlFor="vm">Gaya visual</label>
              <select id="vm" className="select" value={t.visualMode || ""} onChange={(e) => set({ visualMode: (e.target.value || undefined) as Template["visualMode"] })}>
                <option value="">Ikut brand kit channel</option>
                <option value="cards">Kartu motion graphic</option>
                <option value="3d">Gambar 3D AI per scene</option>
              </select>
            </div>
            <fieldset style={{ border: 0, margin: 0, padding: 0 }} className="stack">
              <legend className="label" style={{ marginBottom: 8 }}>Tampilan video</legend>
              <div className="layout-pick">
                <label className={"layout-opt" + (!t.layout ? " on" : "")}>
                  <input type="radio" name="layout" checked={!t.layout} onChange={() => set({ layout: undefined })} />
                  <span className="layout-name">Ikut brand kit</span>
                  <span className="muted small">Pakai tampilan bawaan channel.</span>
                </label>
                {LAYOUTS.map((l) => (
                  <label key={l.id} className={"layout-opt" + (t.layout === l.id ? " on" : "")}>
                    <input type="radio" name="layout" checked={t.layout === l.id} onChange={() => set({ layout: l.id as Layout })} />
                    <span className={`layout-thumb lt-${l.id}`} aria-hidden="true"><i /><b /><u /></span>
                    <span className="layout-name">{l.name}</span>
                    <span className="muted small">{l.desc}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset style={{ border: 0, margin: 0, padding: 0 }} className="stack">
              <legend className="label" style={{ marginBottom: 8 }}>Karakter</legend>
              <div className="row">
                {chars.map((c) => (
                  <label key={c.id} className="row chip" style={{ gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={t.characters.includes(c.id)}
                      onChange={(e) => set({ characters: e.target.checked ? [...t.characters, c.id] : t.characters.filter((x) => x !== c.id) })}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <section className="card flush">
            <div className="card-head">
              <h2 className="h3">Struktur scene</h2>
              <button className="btn quiet sm" onClick={() => set({ scenes: [...t.scenes, { speaker: t.characters[0] || "narator", purpose: "", seconds: 6 }] })}>Tambah scene</button>
            </div>
            <ol className="list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {t.scenes.map((s, i) => (
                <li key={i} className="scene-row">
                  <span className="muted" style={{ width: 20, fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
                  <select aria-label={`Karakter scene ${i + 1}`} className="select" style={{ width: 130 }} value={s.speaker} onChange={(e) => set({ scenes: t.scenes.map((x, j) => (j === i ? { ...x, speaker: e.target.value } : x)) })}>
                    {t.characters.map((c) => <option key={c} value={c}>{nameOf(c)}</option>)}
                  </select>
                  <input aria-label={`Tujuan scene ${i + 1}`} className="input" style={{ flex: "1 1 240px" }} value={s.purpose} placeholder="Apa yang terjadi di scene ini" onChange={(e) => set({ scenes: t.scenes.map((x, j) => (j === i ? { ...x, purpose: e.target.value } : x)) })} />
                  <input aria-label={`Durasi scene ${i + 1} dalam detik`} type="number" min={1} className="input" style={{ width: 80 }} value={s.seconds} onChange={(e) => set({ scenes: t.scenes.map((x, j) => (j === i ? { ...x, seconds: Number(e.target.value) } : x)) })} />
                  <span className="muted small">dtk</span>
                  <span className="scene-actions">
                  <button className="btn quiet sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Naikkan scene ${i + 1}`}>Naik</button>
                  <button className="btn quiet sm" onClick={() => move(i, 1)} disabled={i === t.scenes.length - 1} aria-label={`Turunkan scene ${i + 1}`}>Turun</button>
                  <button className="btn quiet sm" onClick={() => set({ scenes: t.scenes.filter((_, j) => j !== i) })} disabled={t.scenes.length === 1} aria-label={`Hapus scene ${i + 1}`}>Hapus</button>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="card stack">
            <h2 className="h3">Aturan naskah</h2>
            <p className="muted small" style={{ margin: 0 }}>Dipakai AI setiap kali menulis naskah dengan template ini.</p>
            {t.rules.map((r, i) => (
              <div key={i} className="row" style={{ padding: "12px 14px", background: "var(--soft)", borderRadius: 10 }}>
                <span style={{ flex: 1, minWidth: 200 }}>{r}</span>
                <button className="btn quiet sm" onClick={() => set({ rules: t.rules.filter((_, j) => j !== i) })} aria-label={`Hapus aturan: ${r}`}>Hapus</button>
              </div>
            ))}
            <form
              className="row"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newRule.trim()) return;
                set({ rules: [...t.rules, newRule.trim()] });
                setNewRule("");
              }}
            >
              <label htmlFor="nr" style={{ position: "absolute", left: -9999 }}>Aturan baru</label>
              <input id="nr" className="input" style={{ flex: 1, minWidth: 220 }} placeholder="Tulis aturan baru" value={newRule} onChange={(e) => setNewRule(e.target.value)} />
              <button className="btn quiet" type="submit">Tambah aturan</button>
            </form>
          </section>
        </div>

        <aside>
          <div className="card stack">
            <h2 className="h3">Ritme scene</h2>
            <div className="row" style={{ alignItems: "flex-start", gap: 16 }}>
              <Strip scenes={t.scenes.map((s) => ({ ...s, seconds: Number(s.seconds) || 1 }))} chars={chars} w={110} h={196} />
              <div className="stack" style={{ gap: 6 }}>
                <div style={{ fontSize: 22, fontWeight: 800, fontStretch: "112%" }}>{total} detik</div>
                <div className={"small " + (inRange ? "muted" : "")} style={inRange ? undefined : { color: "#B23A22", fontWeight: 600 }}>
                  {inRange ? "Masuk" : "Di luar"} target {t.minSec}–{t.maxSec} detik
                </div>
                {t.characters.map((c) => (
                  <div key={c} className="small">{nameOf(c)} {t.scenes.filter((s) => s.speaker === c).reduce((n, s) => n + Number(s.seconds || 0), 0)} dtk</div>
                ))}
              </div>
            </div>
          </div>
          <button className="btn primary" onClick={save}>Simpan template</button>
          <Link className="btn quiet" href="/template">Kembali</Link>
          {msg ? <p className="small" role="status" style={{ margin: 0 }}>{msg}</p> : null}
          <p className="muted small" style={{ margin: 0 }}>Proyek yang sudah dibuat tidak berubah. Perubahan berlaku untuk konten berikutnya.</p>
          <button className="btn quiet sm" style={{ alignSelf: "flex-start" }} onClick={remove}>Hapus template</button>
        </aside>
      </div>
    </div>
  );
}
