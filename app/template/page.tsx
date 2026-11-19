"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../components/api";
import { TplPreview } from "../../components/Strip";
import { useChannel } from "../../components/channel";
import type { Character, Project, Template } from "../../lib/types";
import { LAYOUTS, type TemplatePreset } from "../../lib/defaults";

export default function Templates() {
  const router = useRouter();
  const [list, setList] = useState<Template[] | null>(null);
  const [chars, setChars] = useState<Character[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [err, setErr] = useState("");
  const [library, setLibrary] = useState<TemplatePreset[]>([]);
  const [busy, setBusy] = useState("");
  const { current } = useChannel();

  useEffect(() => {
    if (!current) return;
    setList(null);
    api(`/api/templates?channel=${current.id}`).then((d) => { setList(d.templates); setChars(d.characters); setLibrary(d.library || []); }).catch((e) => setErr(e.message));
    api("/api/projects").then((d) => setProjects(d.projects)).catch(() => {});
  }, [current?.id]);

  async function create(presetId?: string) {
    setErr("");
    setBusy(presetId || "kosong");
    try {
      const t = await api<Template>("/api/templates", { method: "POST", json: { channelId: current?.id, presetId } });
      router.push(`/template/${t.id}`);
    } catch (e: any) {
      setErr(e.message);
      setBusy("");
    }
  }
  const layoutName = (id?: string) => LAYOUTS.find((l) => l.id === id)?.name || "Ikut brand kit";

  return (
    <div className="wrap">
      <div className="row between" style={{ alignItems: "flex-end", gap: 24 }}>
        <div className="stack" style={{ gap: 10, flex: "1 1 400px" }}>
          <h1 className="h1">Template</h1>
          <p className="lead">Struktur yang dipakai setiap kali kamu buat konten di {current?.name || "channel ini"}. Ubah sekali, konten berikutnya ikut.</p>
        </div>
        <button className="btn primary" onClick={() => create()} disabled={!!busy}>Buat template kosong</button>
      </div>
      {err ? <p className="banner" role="alert">{err}</p> : null}
      {list === null && !err ? <p className="muted">Memuat template…</p> : null}
      {list && list.length === 0 ? <p className="card" style={{ margin: 0 }}>Belum ada template di channel ini. Pilih dari galeri di bawah atau buat template kosong.</p> : null}
      {list && list.length ? (
        <div className="card flush list">
          {list.map((t) => {
            const used = projects.filter((p) => p.templateId === t.id).length;
            return (
              <div key={t.id} className="row" style={{ padding: "18px 22px", gap: 20 }}>
                <TplPreview t={t} chars={chars} w={54} />
                <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                  <div style={{ fontWeight: 750, fontSize: 17 }}>
                    {t.name}
                  </div>
                  <div className="muted">{t.description}</div>
                </div>
                <div style={{ flex: "0 1 240px" }}>
                  <div style={{ fontWeight: 500 }}>{t.scenes.length} scene, {t.minSec}–{t.maxSec} detik</div>
                  <div className="muted small">Karakter: {t.characters.map((c) => chars.find((x) => x.id === c)?.name || c).join(", ")}</div>
                  <div className="muted small">Tampilan: {layoutName(t.layout)}</div>
                </div>
                <div className="small" style={{ flex: "0 1 150px", color: used ? "var(--ink2)" : "var(--muted)" }}>{used ? `Dipakai di ${used} proyek` : "Belum dipakai"}</div>
                <Link className="btn quiet sm" href={`/template/${t.id}`} aria-label={`Edit template ${t.name}`}>Edit</Link>
              </div>
            );
          })}
        </div>
      ) : null}

      {library.length ? (
        <section className="stack" style={{ gap: 14, marginTop: 28 }} aria-labelledby="galeri">
          <div className="stack" style={{ gap: 6 }}>
            <h2 id="galeri" className="h2">Galeri template</h2>
            <p className="muted" style={{ margin: 0 }}>Format siap pakai untuk channel mana pun. Saat ditambahkan, peran narator/penanya/penjawab otomatis diisi karakter {current?.name || "channel ini"}, lalu bisa kamu ubah.</p>
          </div>
          <div className="gallery">
            {library.map((p) => (
              <article key={p.id} className="gallery-item">
                <div className="row" style={{ gap: 12, marginTop: 0, alignItems: "flex-start", flexWrap: "nowrap" }}>
                  <span className={`layout-thumb lt-${p.layout || "kartu"}`} aria-hidden="true"><i /><b /><u /></span>
                  <div className="stack" style={{ gap: 4 }}>
                    <h3 className="h3" style={{ margin: 0 }}>{p.name}</h3>
                    <span className="muted small">{layoutName(p.layout)} · {p.scenes.length} scene · {p.minSec}–{p.maxSec} dtk</span>
                  </div>
                </div>
                <p style={{ margin: 0 }}>{p.description}</p>
                <p className="muted small" style={{ margin: 0 }}>Contoh: {p.example}</p>
                <div className="row">
                  <button className="btn quiet sm" onClick={() => create(p.id)} disabled={!!busy} aria-label={`Tambahkan template ${p.name} ke ${current?.name || "channel ini"}`}>
                    {busy === p.id ? "Menambahkan…" : "Tambahkan ke channel"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
