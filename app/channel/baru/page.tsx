"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../components/api";
import { useChannel } from "../../../components/channel";
import { Questions } from "../../../components/Questions";
import { StylePreview } from "../../../components/StylePreview";
import { DEFAULT_CHANNELS, GEMINI_VOICES, LAYOUTS, TEMPLATE_LIBRARY } from "../../../lib/defaults";
import { LOOK_PRESETS } from "../../../lib/anim";
import type { BriefQuestion, Channel, Layout } from "../../../lib/types";

type KitChar = { name: string; role: string; style: string; voice: string; look: string; lookPreset?: string };
type Kit = Partial<Channel> & { characters?: KitChar[]; alur?: string[]; demo?: boolean };

const COLOR_LABEL: [keyof Channel["colors"], string][] = [["bg", "Latar"], ["card", "Kartu"], ["accent", "Aksen"], ["accent2", "Aksen 2"], ["text", "Teks"], ["outroBg", "Latar outro"], ["outroText", "Teks outro"]];

export default function NewChannel() {
  const router = useRouter();
  const { reload, setCurrent } = useChannel();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [desc, setDesc] = useState("");
  const [name, setName] = useState("");
  const [questions, setQuestions] = useState<BriefQuestion[]>([]);
  const [kit, setKit] = useState<Kit | null>(null);
  const [busy, setBusy] = useState<"" | "ask" | "suggest" | "create">("");
  const [err, setErr] = useState("");
  const set = (patch: Partial<Kit>) => setKit((k) => ({ ...(k || {}), ...patch }));

  async function ask() {
    setBusy("ask");
    setErr("");
    try {
      const d = await api<{ questions: BriefQuestion[] }>("/api/channels/questions", { method: "POST", json: { description: desc } });
      setQuestions(d.questions);
      setStep(2);
    } catch (e: any) {
      setErr(e.message);
    }
    setBusy("");
  }

  async function suggest(answers: Record<string, string>, note: string) {
    setBusy("suggest");
    setErr("");
    try {
      const k = await api<Kit>("/api/channels/suggest", { method: "POST", json: { description: desc, name, questions, answers, note } });
      setKit(k);
      setName(k.name || name);
      setStep(3);
    } catch (e: any) {
      setErr(e.message);
    }
    setBusy("");
  }

  async function create() {
    setBusy("create");
    setErr("");
    try {
      const ch = await api<Channel>("/api/channels", { method: "POST", json: { ...(kit || {}), name, niche: kit?.niche || desc } });
      await reload();
      setCurrent(ch.id);
      router.push("/");
    } catch (e: any) {
      setErr(e.message);
      setBusy("");
    }
  }

  const base = DEFAULT_CHANNELS[0];
  const preview: Channel = {
    ...base, ...(kit || {}), id: "baru", name: name || "Nama channel",
    headerText: kit?.headerText || (name || "NAMA CHANNEL").toUpperCase(),
    colors: { ...base.colors, ...(kit?.colors || {}) },
  } as Channel;
  const looks = Object.fromEntries((kit?.characters || []).map((c, i) => [["pemuda", "pemudi-hijab", "pemuda-kaos"][i] || "pemuda", (({ label: _l, ...l }) => l)(LOOK_PRESETS[c.lookPreset || "pemuda"] || LOOK_PRESETS.pemuda)]));

  return (
    <div className="wrap" style={{ maxWidth: 1160 }}>
      <div className="stack" style={{ gap: 10 }}>
        <p className="muted small" style={{ margin: 0 }}>Langkah {step} dari 3</p>
        <h1 className="h1">{step === 1 ? "Channel baru" : step === 2 ? "Beberapa pertanyaan dulu" : "Tinjau brand kit"}</h1>
        <p className="lead" style={{ margin: 0 }}>
          {step === 1
            ? "Ceritakan channel-nya. AI akan bertanya beberapa hal dulu, baru menyusun brand kit, karakter, style, dan alurnya."
            : step === 2
              ? "Jawabanmu menentukan gaya bahasa, narator, style visual, dan alur channel. Pilihan pertama adalah rekomendasi AI."
              : "Semua masih bisa kamu ubah sekarang atau nanti di Brand kit."}
        </p>
      </div>
      {err ? <p className="banner" role="alert">{err}</p> : null}

      {step === 1 ? (
        <section className="card stack" style={{ gap: 16, maxWidth: 760 }}>
          <div className="field">
            <label htmlFor="ds">Channel ini tentang apa?</label>
            <textarea id="ds" className="textarea" rows={4} value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Contoh: serial cerita horor untuk Gen Z, dari cerita rakyat dan karangan sendiri, tiap episode bersambung" />
          </div>
          <div className="field">
            <label htmlFor="nm">Nama channel (opsional)</label>
            <input id="nm" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kosongkan kalau mau diusulkan AI" />
          </div>
          <div><button className="btn primary" onClick={ask} disabled={desc.trim().length < 10 || busy !== ""}>{busy === "ask" ? "Menyiapkan pertanyaan…" : "Lanjut"}</button></div>
        </section>
      ) : null}

      {step === 2 ? (
        <div className="stack" style={{ gap: 16, maxWidth: 760 }}>
          <Questions questions={questions} busy={busy !== ""} submitLabel={busy === "suggest" ? "Menyusun brand kit…" : "Susun brand kit"}
            notePlaceholder="Mis. warna merah darah, narator perempuan, ada tokoh nenek misterius…" onSubmit={(a, note) => suggest(a, note)} />
          <div><button className="btn quiet sm" onClick={() => setStep(1)} disabled={busy !== ""}>Kembali</button></div>
        </div>
      ) : null}

      {step === 3 && kit ? (
        <div className="editor">
          <div className="col">
            {kit.demo ? <p className="banner" role="status">Mode demo: usulan ini dari aturan bawaan, bukan AI. Ubah sesukamu.</p> : null}
            <section className="card stack" style={{ gap: 14 }}>
              <div className="grid2">
                <div className="field"><label htmlFor="k-nm">Nama channel</label><input id="k-nm" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="field"><label htmlFor="k-tg">Tagline</label><input id="k-tg" className="input" value={kit.tagline || ""} onChange={(e) => set({ tagline: e.target.value })} /></div>
              </div>
              <div className="field">
                <label htmlFor="k-vr">Aturan bahasa (satu per baris)</label>
                <textarea id="k-vr" className="textarea" rows={5} value={(kit.voiceRules || []).join("\n")} onChange={(e) => set({ voiceRules: e.target.value.split("\n") })} />
              </div>
              <div className="grid2">
                <div className="field"><label htmlFor="k-ot">Teaser outro</label><input id="k-ot" className="input" value={kit.outroTeaser || ""} onChange={(e) => set({ outroTeaser: e.target.value })} /></div>
                <div className="field"><label htmlFor="k-of">Ajakan follow</label><input id="k-of" className="input" value={kit.outroFollow || ""} onChange={(e) => set({ outroFollow: e.target.value })} /></div>
              </div>
            </section>

            <section className="card stack" style={{ gap: 12 }}>
              <h2 className="h3">Style visual bawaan</h2>
              <div className="layout-pick">
                {LAYOUTS.map((l) => (
                  <label key={l.id} className={"layout-opt" + (kit.layout === l.id ? " on" : "")}>
                    <input type="radio" name="k-layout" checked={kit.layout === l.id} onChange={() => set({ layout: l.id as Layout })} />
                    <span className={`layout-thumb lt-${l.id}`} aria-hidden="true"><i /><b /><u /></span>
                    <span className="layout-name">{l.name}</span>
                  </label>
                ))}
              </div>
              <div className="row" style={{ gap: 12 }}>
                {COLOR_LABEL.map(([k, lab]) => (
                  <label key={k} className="small" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="color" value={(preview.colors as any)[k]} onChange={(e) => set({ colors: { ...preview.colors, [k]: e.target.value } })} style={{ width: 36, height: 30, border: 0, padding: 0 }} />
                    {lab}
                  </label>
                ))}
              </div>
              <div className="field" style={{ maxWidth: 280 }}>
                <label htmlFor="k-bgm">Musik latar</label>
                <select id="k-bgm" className="select" value={kit.bgmPreset || "tech"} onChange={(e) => set({ bgmPreset: e.target.value as Channel["bgmPreset"] })}>
                  <option value="tech">Tech</option><option value="ceria">Ceria</option><option value="horor">Horor</option><option value="motivasi">Motivasi</option><option value="none">Tanpa musik</option>
                </select>
              </div>
            </section>

            <section className="card stack" style={{ gap: 12 }}>
              <h2 className="h3">Karakter & suara</h2>
              {(kit.characters || []).map((c, i) => (
                <div key={i} className="row" style={{ gap: 10, alignItems: "flex-end" }}>
                  <div className="field" style={{ flex: "1 1 140px" }}><label htmlFor={`kc-n${i}`} className="small">Nama</label><input id={`kc-n${i}`} className="input" value={c.name} onChange={(e) => set({ characters: kit.characters!.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} /></div>
                  <div className="field" style={{ flex: "2 1 220px" }}><label htmlFor={`kc-r${i}`} className="small">Peran</label><input id={`kc-r${i}`} className="input" value={c.role} onChange={(e) => set({ characters: kit.characters!.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)) })} /></div>
                  <div className="field" style={{ flex: "1 1 120px" }}><label htmlFor={`kc-v${i}`} className="small">Suara</label>
                    <select id={`kc-v${i}`} className="select" value={c.voice} onChange={(e) => set({ characters: kit.characters!.map((x, j) => (j === i ? { ...x, voice: e.target.value } : x)) })}>
                      {GEMINI_VOICES.map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="field" style={{ flex: "1 1 180px" }}><label htmlFor={`kc-l${i}`} className="small">Wujud kartun</label>
                    <select id={`kc-l${i}`} className="select" value={c.lookPreset || "pemuda"} onChange={(e) => set({ characters: kit.characters!.map((x, j) => (j === i ? { ...x, lookPreset: e.target.value } : x)) })}>
                      {Object.entries(LOOK_PRESETS).map(([id, l]) => <option key={id} value={id}>{l.label}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </section>

            <section className="card stack" style={{ gap: 10 }}>
              <h2 className="h3">Alur channel</h2>
              <p className="muted small" style={{ margin: 0 }}>Saat membuat video, AI memilih alur yang paling cocok dari sini sesuai topik.</p>
              {TEMPLATE_LIBRARY.map((t) => (
                <label key={t.id} className="row" style={{ gap: 10, alignItems: "flex-start", flexWrap: "nowrap" }}>
                  <input type="checkbox" checked={(kit.alur || []).includes(t.id)} onChange={(e) => set({ alur: e.target.checked ? [...(kit.alur || []), t.id] : (kit.alur || []).filter((x) => x !== t.id) })} />
                  <span><b>{t.name}</b> <span className="muted small">— {t.description}</span></span>
                </label>
              ))}
            </section>
          </div>
          <aside>
            <div className="card stack">
              <h2 className="h3">Pratinjau</h2>
              <StylePreview ch={preview} layout={kit.layout} looks={looks} />
            </div>
            <button className="btn primary" onClick={create} disabled={name.trim().length < 2 || !(kit.alur || []).length || busy !== ""}>{busy === "create" ? "Membuat…" : "Buat channel"}</button>
            <button className="btn quiet sm" onClick={() => setStep(2)} disabled={busy !== ""}>Ubah jawaban</button>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
