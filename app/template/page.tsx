"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../components/api";
import { TplPreview } from "../../components/Strip";
import { useChannel } from "../../components/channel";
import type { Character, Project, Template } from "../../lib/types";

export default function Templates() {
  const router = useRouter();
  const [list, setList] = useState<Template[] | null>(null);
  const [chars, setChars] = useState<Character[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [err, setErr] = useState("");
  const { current } = useChannel();

  useEffect(() => {
    if (!current) return;
    setList(null);
    api(`/api/templates?channel=${current.id}`).then((d) => { setList(d.templates); setChars(d.characters); }).catch((e) => setErr(e.message));
    api("/api/projects").then((d) => setProjects(d.projects)).catch(() => {});
  }, [current?.id]);

  async function create() {
    try {
      const t = await api<Template>("/api/templates", { method: "POST", json: { channelId: current?.id } });
      router.push(`/template/${t.id}`);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <div className="wrap">
      <div className="row between" style={{ alignItems: "flex-end", gap: 24 }}>
        <div className="stack" style={{ gap: 10, flex: "1 1 400px" }}>
          <h1 className="h1">Template</h1>
          <p className="lead">Struktur yang dipakai setiap kali kamu buat konten di {current?.name || "channel ini"}. Ubah sekali, konten berikutnya ikut.</p>
        </div>
        <button className="btn primary" onClick={create}>Buat template baru</button>
      </div>
      {err ? <p className="banner" role="alert">{err}</p> : null}
      {list === null && !err ? <p className="muted">Memuat template…</p> : null}
      {list && list.length === 0 ? <p className="card" style={{ margin: 0 }}>Belum ada template di channel ini. Klik &quot;Buat template baru&quot;.</p> : null}
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
                </div>
                <div className="small" style={{ flex: "0 1 150px", color: used ? "var(--ink2)" : "var(--muted)" }}>{used ? `Dipakai di ${used} proyek` : "Belum dipakai"}</div>
                <Link className="btn quiet sm" href={`/template/${t.id}`} aria-label={`Edit template ${t.name}`}>Edit</Link>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
