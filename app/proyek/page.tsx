"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../components/api";
import type { Project, Template } from "../../lib/types";
import { useChannel } from "../../components/channel";

const FILTERS = ["Semua", "Diproses", "Draft", "Review", "Tayang"] as const;
const BUSY = ["queued", "researching", "writing", "voicing", "imaging", "rendering"];

function statusOf(p: Project): { label: string; cls: string } {
  if (BUSY.includes(p.status)) return { label: "Diproses", cls: "" };
  if (p.status === "failed") return { label: "Gagal", cls: "warn" };
  if (p.review === "tayang") return { label: "Tayang", cls: "dark" };
  if (p.review === "review") return { label: "Review", cls: "warn" };
  return { label: "Draft", cls: "" };
}

export default function Projects() {
  const [list, setList] = useState<Project[] | null>(null);
  const [tpls, setTpls] = useState<Template[]>([]);
  const [f, setF] = useState<(typeof FILTERS)[number]>("Semua");
  const [error, setError] = useState("");
  const { current } = useChannel();

  useEffect(() => {
    const load = () =>
      api("/api/projects")
        .then((d) => setList(d.projects))
        .catch((e) => setError(e.message));
    load();
    api("/api/templates").then((d) => setTpls(d.templates)).catch(() => {});
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const mine = (list || []).filter((p) => !current || p.channelId === current.id);
  const rows = mine.filter((p) => f === "Semua" || statusOf(p).label === f);

  return (
    <div className="wrap">
      <div className="row between" style={{ alignItems: "flex-end" }}>
        <div className="stack" style={{ gap: 6 }}>
          <p className="muted small" style={{ margin: 0 }}>{current ? `Channel: ${current.name}` : ""}</p>
          <h1 className="h1">Proyek</h1>
        </div>
        <Link href="/" className="btn accent">
          Buat konten
        </Link>
      </div>
      {error ? <p className="banner" role="alert">Daftar proyek gagal dimuat: {error}</p> : null}
      {list === null && !error ? <p className="muted">Memuat proyek…</p> : null}
      {list && mine.length === 0 ? (
        <div className="card empty stack">
          <h2 className="h2">Belum ada proyek</h2>
          <p className="lead">Mulai dari satu topik. Naskah, suara, video, dan caption-nya muncul di sini, lengkap dengan statusnya.</p>
          <div>
            <Link href="/" className="btn accent">
              Buat konten pertama
            </Link>
          </div>
        </div>
      ) : null}
      {list && mine.length > 0 ? (
        <>
          <div className="seg" role="group" aria-label="Saring status" style={{ alignSelf: "flex-start" }}>
            {FILTERS.map((x) => (
              <button key={x} aria-pressed={f === x} onClick={() => setF(x)}>
                {x}
              </button>
            ))}
          </div>
          <div className="card flush table-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th scope="col">Episode</th>
                  <th scope="col">Template</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="num">Views TikTok</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const st = statusOf(p);
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/proyek/${p.id}`} style={{ fontWeight: 650, textDecoration: "none" }}>
                          {p.title || p.topic}
                        </Link>
                        <div className="muted small">{p.episode || new Date(p.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</div>
                      </td>
                      <td style={{ color: "var(--ink2)" }}>{tpls.find((t) => t.id === p.templateId)?.name || p.templateId}</td>
                      <td>
                        <span className={"tag " + st.cls}>{st.label}</span>
                      </td>
                      <td className="num">{p.views || "–"}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      Tidak ada proyek berstatus {f}. Pilih filter lain.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <p className="muted small" style={{ margin: 0 }}>
            Views diisi manual di halaman proyek. Angka ini dipakai untuk melihat template mana yang paling sering ramai.
          </p>
        </>
      ) : null}
    </div>
  );
}
