"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../components/api";
import { useChannel } from "../../../components/channel";
import { BrandPreview } from "../../../components/BrandPreview";
import { DEFAULT_CHANNELS } from "../../../lib/defaults";
import type { Channel } from "../../../lib/types";

type Kit = Partial<Channel> & { characters?: { name: string; role: string; style: string; voice: string; look: string }[] };

export default function NewChannel() {
  const router = useRouter();
  const { reload, setCurrent } = useChannel();
  const [desc, setDesc] = useState("");
  const [name, setName] = useState("");
  const [kit, setKit] = useState<Kit | null>(null);
  const [busy, setBusy] = useState<"" | "suggest" | "create">("");
  const [err, setErr] = useState("");

  async function suggest() {
    setBusy("suggest");
    setErr("");
    try {
      const k = await api<Kit>("/api/channels/suggest", { method: "POST", json: { description: desc } });
      setKit(k);
      setName(k.name || name);
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
      router.push("/channel");
    } catch (e: any) {
      setErr(e.message);
      setBusy("");
    }
  }

  const preview: Channel = { ...DEFAULT_CHANNELS[0], ...(kit || {}), name: name || "Nama channel", headerText: kit?.headerText || (name || "NAMA CHANNEL").toUpperCase(), colors: { ...DEFAULT_CHANNELS[0].colors, ...(kit?.colors || {}) } } as Channel;

  return (
    <div className="wrap" style={{ maxWidth: 1100 }}>
      <div className="stack" style={{ gap: 10 }}>
        <h1 className="h1">Channel baru</h1>
        <p className="lead">Ceritakan channel-nya, lalu biarkan AI mengusulkan brand kit dan karakter awal. Semuanya bisa kamu ubah setelah dibuat.</p>
      </div>
      {err ? <p className="banner" role="alert">{err}</p> : null}
      <div className="editor">
        <div className="col">
          <section className="card stack" style={{ gap: 16 }}>
            <div className="field">
              <label htmlFor="ds">Channel ini tentang apa?</label>
              <textarea
                id="ds"
                className="textarea"
                rows={4}
                placeholder="Contoh: fakta sains sehari-hari untuk anak SMP, gaya lucu, ada dua karakter yang suka debat"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
            <div className="row">
              <button className="btn" onClick={suggest} disabled={!desc.trim() || busy !== ""}>{busy === "suggest" ? "Menyusun usulan…" : "Usulkan brand kit dengan AI"}</button>
              <span className="muted small">Tanpa API key, lewati langkah ini dan atur brand kit manual setelah channel dibuat.</span>
            </div>
            <div className="field">
              <label htmlFor="nm">Nama channel</label>
              <input id="nm" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama yang muncul di header dan outro" />
            </div>
            {kit ? (
              <div className="stack" style={{ gap: 8 }}>
                <h2 className="h3">Usulan AI</h2>
                <p style={{ margin: 0 }}><b>Tagline:</b> {kit.tagline}</p>
                <p style={{ margin: 0 }}><b>Gaya visual:</b> {kit.visualMode === "3d" ? "Gambar 3D AI per scene" : "Kartu motion graphic"}</p>
                <p style={{ margin: 0 }}><b>Karakter:</b> {(kit.characters || []).map((c) => `${c.name} (${c.role})`).join(", ")}</p>
              </div>
            ) : null}
          </section>
        </div>
        <aside>
          <div className="card stack">
            <h2 className="h3">Pratinjau</h2>
            <BrandPreview ch={preview} />
          </div>
          <button className="btn primary" onClick={create} disabled={name.trim().length < 2 || busy !== ""}>{busy === "create" ? "Membuat…" : "Buat channel"}</button>
          <p className="muted small" style={{ margin: 0 }}>Channel baru langsung dapat satu template dan karakter awal, jadi bisa dipakai untuk membuat konten.</p>
        </aside>
      </div>
    </div>
  );
}
