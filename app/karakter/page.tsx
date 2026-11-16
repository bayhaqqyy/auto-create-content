"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "../../components/api";
import { useChannel } from "../../components/channel";
import type { Character } from "../../lib/types";

export default function Characters() {
  const { current } = useChannel();
  const [list, setList] = useState<Character[] | null>(null);
  const [voices, setVoices] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);
  const files = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!current) return;
    setList(null);
    setDirty(false);
    api(`/api/characters?channel=${current.id}`).then((d) => { setList(d.characters); setVoices(d.voices); }).catch((e) => setErr(e.message));
  }, [current?.id]);

  const set = (id: string, patch: Partial<Character>) => {
    setList((l) => l!.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setDirty(true);
  };

  async function save() {
    setErr("");
    try {
      await api("/api/characters", { method: "PUT", json: { channelId: current!.id, characters: list } });
      setDirty(false);
      setMsg("Karakter disimpan. Video berikutnya memakai voice dan tampilan ini.");
    } catch (e: any) {
      setErr(e.message);
    }
  }

  async function sample(c: Character) {
    setErr("");
    setBusy("voice-" + c.id);
    try {
      const res = await fetch(`/api/characters/${c.id}/sample`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ voice: c.voice }) });
      if (!res.ok) throw new Error((await res.json()).error);
      const url = URL.createObjectURL(await res.blob());
      audio.current?.pause();
      audio.current = new Audio(url);
      audio.current.onended = () => setBusy("");
      await audio.current.play();
    } catch (e: any) {
      setErr(e.message);
      setBusy("");
    }
  }

  async function refImage(c: Character, file?: File) {
    if (dirty) await save();
    setErr("");
    setBusy("ref-" + c.id);
    try {
      let d: Character;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        d = await api<Character>(`/api/characters/${c.id}/ref`, { method: "POST", body: fd });
      } else {
        d = await api<Character>(`/api/characters/${c.id}/ref`, { method: "POST", json: { generate: true } });
      }
      setList((l) => l!.map((x) => (x.id === c.id ? { ...x, refImage: d.refImage } : x)));
      setMsg(`Gambar referensi ${c.name} diperbarui.`);
    } catch (e: any) {
      setErr(e.message);
    }
    setBusy("");
  }

  function add() {
    const id = `${current!.id}-tokoh-${Math.random().toString(36).slice(2, 6)}`;
    setList((l) => [...(l || []), { id, channelId: current!.id, name: "Tokoh baru", role: "", style: "Santai dan jelas", voice: "Kore", look: "", color: current!.colors.accent2, textColor: current!.colors.bg, group: "lain" }]);
    setDirty(true);
  }

  const card = (c: Character, big: boolean) => (
    <div key={c.id} className="card stack" style={{ flex: big ? "1 1 420px" : "1 1 100%", gap: 14 }}>
      <div className="row between">
        <span className="tag" style={{ fontSize: big ? 22 : 15, padding: big ? "4px 12px" : undefined, background: c.color, color: c.textColor }}>{c.name}</span>
        <button className="btn sm" onClick={() => sample(c)} disabled={busy === "voice-" + c.id}>{busy === "voice-" + c.id ? "Memutar…" : "Putar contoh suara"}</button>
      </div>
      <div className="row" style={{ alignItems: "flex-start", gap: 16 }}>
        <div className="stack" style={{ gap: 8, alignItems: "flex-start" }}>
          {c.refImage ? (
            <img className="ref" src={`/api/channels/${c.channelId}/file/${c.refImage.replace("chars/", "chars~")}`} alt={`Referensi ${c.name}`} />
          ) : (
            <div className="ref" style={{ display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 8 }}>
              <span className="muted small">Belum ada gambar referensi</span>
            </div>
          )}
          <button className="btn quiet sm" onClick={() => files.current[c.id]?.click()} disabled={busy === "ref-" + c.id}>Upload gambar</button>
          <button className="btn quiet sm" onClick={() => refImage(c)} disabled={busy === "ref-" + c.id || !c.look.trim()} title={!c.look.trim() ? "Isi deskripsi tampilan dulu" : undefined}>
            {busy === "ref-" + c.id ? "Membuat…" : "Buat dengan AI"}
          </button>
          <input ref={(el) => { files.current[c.id] = el; }} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => e.target.files?.[0] && refImage(c, e.target.files[0])} />
        </div>
        <div className="grid2" style={{ flex: 1, minWidth: 260 }}>
          <div className="field"><label htmlFor={`n-${c.id}`} className="small">Nama</label><input id={`n-${c.id}`} className="input" value={c.name} onChange={(e) => set(c.id, { name: e.target.value })} /></div>
          <div className="field">
            <label htmlFor={`v-${c.id}`} className="small">Voice Gemini TTS</label>
            <input id={`v-${c.id}`} className="input" list="voices" value={c.voice} onChange={(e) => set(c.id, { voice: e.target.value })} />
          </div>
          <div className="field"><label htmlFor={`r-${c.id}`} className="small">Peran</label><input id={`r-${c.id}`} className="input" value={c.role} onChange={(e) => set(c.id, { role: e.target.value })} /></div>
          <div className="field"><label htmlFor={`s-${c.id}`} className="small">Gaya bicara (arahan suara)</label><input id={`s-${c.id}`} className="input" value={c.style} onChange={(e) => set(c.id, { style: e.target.value })} /></div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label htmlFor={`l-${c.id}`} className="small">Tampilan untuk gambar 3D (bahasa Inggris)</label>
            <input id={`l-${c.id}`} className="input" value={c.look} placeholder="Kosongkan untuk narator tanpa wujud" onChange={(e) => set(c.id, { look: e.target.value })} />
          </div>
          <div className="field"><label htmlFor={`c-${c.id}`} className="small">Warna label</label><input id={`c-${c.id}`} type="color" className="input" style={{ height: 46, padding: 4 }} value={c.color} onChange={(e) => set(c.id, { color: e.target.value })} /></div>
          <div className="field"><label htmlFor={`t-${c.id}`} className="small">Warna teks label</label><input id={`t-${c.id}`} type="color" className="input" style={{ height: 46, padding: 4 }} value={c.textColor} onChange={(e) => set(c.id, { textColor: e.target.value })} /></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="wrap">
      <div className="row between" style={{ alignItems: "flex-end", gap: 24 }}>
        <div className="stack" style={{ gap: 10, flex: "1 1 400px" }}>
          <h1 className="h1">Karakter &amp; suara</h1>
          <p className="lead">Satu karakter, satu voice dan satu wujud, dikunci supaya sama di semua video {current ? current.name : ""}.</p>
        </div>
        <button className="btn primary" onClick={add} disabled={!current}>Tambah karakter</button>
      </div>
      <datalist id="voices">{voices.map((v) => <option key={v} value={v} />)}</datalist>
      {err ? <p className="banner" role="alert">{err}</p> : null}
      {msg && !dirty ? <p className="small" role="status" style={{ margin: 0 }}>{msg}</p> : null}
      {list === null && !err ? <p className="muted">Memuat karakter…</p> : null}
      {list && list.length === 0 ? <p className="card" style={{ margin: 0 }}>Channel ini belum punya karakter. Tambahkan minimal satu supaya bisa membuat template.</p> : null}
      {list && list.length ? (
        <>
          {list.some((c) => c.group === "duo") ? (
            <section className="stack" style={{ gap: 16 }}>
              <h2 className="h2">Duo utama</h2>
              <div className="row" style={{ alignItems: "stretch", gap: 20 }}>{list.filter((c) => c.group === "duo").map((c) => card(c, true))}</div>
            </section>
          ) : null}
          {list.some((c) => c.group !== "duo") ? (
            <section className="stack" style={{ gap: 16 }}>
              <h2 className="h2">Narator dan tokoh lain</h2>
              <div className="stack" style={{ gap: 16 }}>{list.filter((c) => c.group !== "duo").map((c) => card(c, false))}</div>
            </section>
          ) : null}
        </>
      ) : null}
      <div className="actionbar">
        <p>{dirty ? "Ada perubahan yang belum disimpan." : "Semua perubahan tersimpan."}</p>
        <button className="btn accent" disabled={!dirty} onClick={save}>Simpan karakter</button>
      </div>
    </div>
  );
}
