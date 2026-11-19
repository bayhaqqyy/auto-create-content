"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { api } from "../components/api";
import { TplPreview } from "../components/Strip";
import { useChannel } from "../components/channel";
import type { Character, Template } from "../lib/types";

const QUICK: Record<string, string[]> = {
  kodekepo: ["Kode dial HP yang jarang diketahui", "Cara kerja kode di meteran listrik", "Kenapa bank di Indonesia sering diserang siber"],
  "petualangan-kepi": ["Kenapa HP bisa panas", "Pesan WhatsApp jalan lewat mana", "Kenapa layar HP bisa disentuh"],
};

function Seg({ label, opts, value, onChange }: { label: string; opts: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0 }} className="stack">
      <legend className="label" style={{ marginBottom: 10 }}>{label}</legend>
      <div className="seg">
        {opts.map((o) => (
          <button type="button" key={o} aria-pressed={value === o} onClick={() => onChange(o)}>
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function CreatePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [topic, setTopic] = useState(sp.get("topik") || "");
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [chars, setChars] = useState<Character[]>([]);
  const { current } = useChannel();
  const [tpl, setTpl] = useState(sp.get("template") || "");
  const [episode, setEpisode] = useState("");
  const [platform, setPlatform] = useState("TikTok");
  const [dur, setDur] = useState("60 detik");
  const [audience, setAudience] = useState("Gen Z");
  const [style, setStyle] = useState<"cards" | "3d">("cards");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const [voice, setVoice] = useState(true);

  useEffect(() => {
    if (!current) return;
    setTemplates(null);
    api(`/api/templates?channel=${current.id}`)
      .then((d) => {
        setTemplates(d.templates);
        setChars(d.characters);
        setTpl((t) => (d.templates.some((x: Template) => x.id === t) ? t : d.templates[0]?.id || ""));
      })
      .catch((e) => setError(e.message));
  }, [current?.id]);
  useEffect(() => {
    api("/api/status").then((d) => (setDemo(d.demo), setVoice(d.voice))).catch(() => {});
  }, []);

  const currentTpl = useMemo(() => templates?.find((t) => t.id === tpl), [templates, tpl]);
  useEffect(() => {
    if (currentTpl || current) setStyle(currentTpl?.visualMode || current?.visualMode || "cards");
  }, [currentTpl?.id, current?.id]);
  const ready = topic.trim().length >= 10 && !!currentTpl;

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const p = await api("/api/projects", {
        method: "POST",
        json: { topic, templateId: tpl, platform, durationTarget: parseInt(dur), audience, visualStyle: style, episode },
      });
      router.push(`/proyek/${p.id}`);
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      {demo ? (
        <p className="banner" role="status">
          Mode demo: Claude CLI tidak ditemukan, jadi naskah memakai contoh. Login Claude (<code>CLAUDE_CODE_OAUTH_TOKEN</code>) untuk naskah asli.
        </p>
      ) : null}
      {!voice ? (
        <p className="banner" role="status">
          Belum ada GEMINI_API_KEY, jadi suara masih hening dan gambar/klip 3D tidak dibuat. Isi kuncinya di <code>.env</code> untuk suara asli.
        </p>
      ) : null}
      <section className="stack" style={{ gap: 16 }}>
        <p className="muted small" style={{ margin: 0 }}>{current ? `Channel: ${current.name}` : "Memuat channel…"}</p>
        <h1 className="h1">Mau bahas apa hari ini?</h1>
        <label htmlFor="topik" className="lead">Tulis topiknya sejelas mungkin. Riset, naskah, suara, dan videonya dibuat dari sini.</label>
        <textarea
          id="topik"
          className="textarea topic"
          rows={3}
          placeholder="Contoh: kenapa kode OTP nggak boleh dikasih ke siapa pun"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <div className="row">
          {(QUICK[current?.id || ""] || []).length ? <span className="muted small">Isi cepat:</span> : null}
          {(QUICK[current?.id || ""] || []).map((q) => (
            <button type="button" className="chip" key={q} onClick={() => setTopic(q)}>
              {q}
            </button>
          ))}
        </div>
      </section>

      <section className="stack" style={{ gap: 18 }} aria-labelledby="h-template">
        <div className="row between" style={{ alignItems: "flex-end" }}>
          <h2 className="h2" id="h-template">Pilih template</h2>
          <div className="legend" aria-label="Warna scene per karakter">
            {chars.map((c) => (
              <span key={c.id}>
                <i style={{ background: c.id === "paham" ? "#0F1928" : c.color }} />
                {c.name}
              </span>
            ))}
          </div>
        </div>
        {templates === null && !error ? <p className="muted">Memuat template…</p> : null}
        {templates && templates.length === 0 ? (
          <p className="card" style={{ margin: 0 }}>
            Channel ini belum punya template. <a href="/template">Buat template</a> dulu.
          </p>
        ) : null}
        <div className="tpl-grid">
          {templates?.map((t) => (
            <button type="button" key={t.id} className="tpl" aria-pressed={tpl === t.id} onClick={() => setTpl(t.id)}>
              <TplPreview t={t} chars={chars} />
              <span className="stack" style={{ gap: 6, minWidth: 0 }}>
                <span className="tpl-name">{t.name}</span>
                <span className="muted" style={{ fontSize: 14 }}>{t.description}</span>
                <span className="muted small">
                  {t.minSec}–{t.maxSec} detik
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>


      <section className="stack" style={{ gap: 18 }}>
        <h2 className="h2">Atur hasilnya</h2>
        <div className="row" style={{ gap: "24px 32px", alignItems: "flex-start" }}>
          <Seg label="Platform" opts={["TikTok", "Reels", "Shorts"]} value={platform} onChange={setPlatform} />
          <Seg label="Durasi" opts={["45 detik", "60 detik", "75 detik"]} value={dur} onChange={setDur} />
          <Seg label="Penonton" opts={["Gen Z", "Umum (FB)"]} value={audience} onChange={setAudience} />
          <Seg label="Visual" opts={["Kartu motion graphic", "Gambar 3D AI"]} value={style === "3d" ? "Gambar 3D AI" : "Kartu motion graphic"} onChange={(v) => setStyle(v === "Gambar 3D AI" ? "3d" : "cards")} />
          <div className="field" style={{ width: 160 }}>
            <label htmlFor="ep">Nomor episode</label>
            <input id="ep" className="input" placeholder="EP.026" value={episode} onChange={(e) => setEpisode(e.target.value)} />
          </div>
        </div>
        <p className="muted small" style={{ margin: 0, maxWidth: "72ch" }}>
          {style === "3d"
            ? "Tiap scene dapat gambar 3D dari Gemini sesuai referensi karakter, lalu kartu dan subtitle ditaruh di atasnya. Klip Google Flow buatanmu tetap bisa diupload per scene di editor."
            : "Kartu, judul bab, dan subtitle dirender sesuai brand kit channel. Klip atau gambar buatanmu bisa diupload per scene di editor."}
        </p>
      </section>

      {error ? (
        <p className="banner" role="alert">
          {error}
        </p>
      ) : null}

      <div className="actionbar">
        <p>{currentTpl ? `${currentTpl.name} untuk ${platform}, ${dur}, penonton ${audience}.` : "Pilih template."}</p>
        <div className="row">
          {!ready ? <span className="small" style={{ color: "#C9D2E0" }}>Aktif setelah topik diisi.</span> : null}
          <button className="btn accent" disabled={!ready || busy} onClick={submit}>
            {busy ? "Memulai…" : "Buat video"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <CreatePage />
    </Suspense>
  );
}
