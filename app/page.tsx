"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { api } from "../components/api";
import { TplPreview } from "../components/Strip";
import { useChannel } from "../components/channel";
import type { Character, Template, Layout } from "../lib/types";
import { LAYOUTS } from "../lib/defaults";
import { ANIM_LAYOUTS } from "../lib/anim";
import { StyleCover } from "../components/StyleCover";

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
  const { channels, current, setCurrent } = useChannel();
  const [tpl, setTpl] = useState(sp.get("template") || "");
  const [episode, setEpisode] = useState("");
  const [platform, setPlatform] = useState("TikTok");
  const [dur, setDur] = useState("60 detik");
  const [audience, setAudience] = useState("Gen Z");
  const [style, setStyle] = useState<"cards" | "3d">("cards");
  const [layout, setLayout] = useState<Layout>("kartu");
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
        setTpl((t) => (d.templates.some((x: Template) => x.id === t) ? t : "auto"));
      })
      .catch((e) => setError(e.message));
  }, [current?.id]);
  useEffect(() => {
    api("/api/status").then((d) => (setDemo(d.demo), setVoice(d.voice))).catch(() => {});
  }, []);

  const currentTpl = useMemo(() => templates?.find((t) => t.id === tpl), [templates, tpl]);
  // style bawaan ikut channel; tetap bisa diganti
  useEffect(() => {
    if (!current) return;
    setStyle(current.visualMode || "cards");
    setLayout(current.layout || "kartu");
  }, [current?.id]);
  const ready = topic.trim().length >= 10 && !!templates?.length;

  const [ask, setAsk] = useState(true);
  async function submit() {
    setBusy(true);
    setError("");
    try {
      const p = await api("/api/projects", {
        method: "POST",
        json: { topic, channelId: current?.id, templateId: tpl, platform, durationTarget: parseInt(dur), audience, visualStyle: style, layout, episode, skipBrief: !ask },
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
      <section className="stack" style={{ gap: 16 }} aria-labelledby="h-channel">
        <h1 className="h1" id="h-channel">Buat video untuk channel apa?</h1>
        <p className="lead" style={{ margin: 0 }}>Aturan bahasa, alur, suara, musik, dan brand otomatis ikut channel yang dipilih.</p>
        <div className="ch-pick">
          {(channels || []).map((c) => (
            <button type="button" key={c.id} className="ch-card" aria-pressed={current?.id === c.id} onClick={() => setCurrent(c.id)}
              style={{ ["--c-bg" as any]: c.colors.bg, ["--c-acc" as any]: c.colors.accent, ["--c-text" as any]: c.colors.text }}>
              <span className="ch-swatch" aria-hidden="true">
                {c.logo ? <img src={`/api/channels/${c.id}/file/${c.logo}`} alt="" /> : <b>{c.name.slice(0, 1)}</b>}
              </span>
              <span className="stack" style={{ gap: 4, minWidth: 0 }}>
                <span className="tpl-name">{c.name}</span>
                <span className="muted small">{c.tagline || c.niche}</span>
                <span className="muted small">Style: {LAYOUTS.find((l) => l.id === c.layout)?.name || "Kartu"}</span>
              </span>
            </button>
          ))}
          <a className="ch-card ch-new" href="/channel/baru">+ Channel baru</a>
        </div>
      </section>

      <section className="stack" style={{ gap: 16 }}>
        <h2 className="h2">Mau bahas apa?</h2>
        <label htmlFor="topik" className="muted" style={{ margin: 0 }}>Tulis topiknya sejelas mungkin. Alur yang paling cocok dipilih otomatis dari aturan {current?.name || "channel"}.</label>
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
        {templates && templates.length ? (
          <p className="muted small" style={{ margin: 0 }}>
            Alur {current?.name}: {templates.map((t) => t.name).join(", ")}.{" "}
            <a href="/template">Atur alur</a>
          </p>
        ) : templates ? (
          <p className="card" style={{ margin: 0 }}>Channel ini belum punya alur. <a href="/template">Tambahkan alur</a> dulu.</p>
        ) : null}
      </section>

      <section className="stack" style={{ gap: 18 }} aria-labelledby="h-style">
        <h2 className="h2" id="h-style">Style visual</h2>
        <div className="layout-pick" role="radiogroup" aria-labelledby="h-style">
          {LAYOUTS.map((l) => (
            <label key={l.id} className={"layout-opt" + (layout === l.id ? " on" : "")}>
              <input type="radio" name="layout" checked={layout === l.id} onChange={() => setLayout(l.id as Layout)} />
              {current ? <span aria-hidden="true"><StyleCover ch={current} layout={l.id as Layout} width={110} /></span> : <span className={`layout-thumb lt-${l.id}`} aria-hidden="true"><i /><b /><u /></span>}
              <span className="layout-name">{l.name}{current?.layout === l.id ? " · bawaan" : ""}</span>
              <span className="muted small">{l.desc}</span>
            </label>
          ))}
        </div>
        {ANIM_LAYOUTS.includes(layout as any) ? null : (
          <Seg label="Latar scene" opts={["Kartu motion graphic", "Gambar 3D AI"]} value={style === "3d" ? "Gambar 3D AI" : "Kartu motion graphic"} onChange={(v) => setStyle(v === "Gambar 3D AI" ? "3d" : "cards")} />
        )}
      </section>

      <section className="stack" style={{ gap: 18 }}>
        <h2 className="h2">Atur hasilnya</h2>
        <div className="row" style={{ gap: "24px 32px", alignItems: "flex-start" }}>
          <Seg label="Platform" opts={["TikTok", "Reels", "Shorts"]} value={platform} onChange={setPlatform} />
          <Seg label="Durasi" opts={["45 detik", "60 detik", "75 detik"]} value={dur} onChange={setDur} />
          <Seg label="Penonton" opts={["Gen Z", "Umum (FB)"]} value={audience} onChange={setAudience} />
          <div className="field" style={{ width: 160 }}>
            <label htmlFor="ep">Nomor episode</label>
            <input id="ep" className="input" placeholder="EP.026" value={episode} onChange={(e) => setEpisode(e.target.value)} />
          </div>
        </div>
      </section>

      {error ? (
        <p className="banner" role="alert">
          {error}
        </p>
      ) : null}

      <div className="actionbar">
        <p>{current ? `${current.name}, ${LAYOUTS.find((l) => l.id === layout)?.name}, ${platform} ${dur}. Naskah dan video menunggu persetujuanmu sebelum lanjut.` : "Pilih channel."}</p>
        <div className="row">
          <label className="small row" style={{ gap: 8, color: "#C9D2E0" }}>
            <input type="checkbox" checked={ask} onChange={(e) => setAsk(e.target.checked)} /> Tanya dulu sebelum menulis naskah
          </label>
          {!ready ? <span className="small" style={{ color: "#C9D2E0" }}>Aktif setelah topik diisi.</span> : null}
          <button className="btn accent" disabled={!ready || busy} onClick={submit}>
            {busy ? "Memulai…" : ask ? "Mulai rancang" : "Tulis naskah"}
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
