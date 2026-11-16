import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ShoppingCart } from "lucide-react";
import type { Scene } from "../lib/types";
import type { Cue } from "../lib/subtitle";

/**
 * Video affiliate gaya TikTok: klip produk dipakai sehari-hari memenuhi layar,
 * hook besar di detik pertama, caption kata-per-kata, kartu produk + ajakan di akhir.
 * Area aman: kanan 150px dan bawah 380px dibiarkan kosong untuk tombol TikTok.
 */
export type AdProps = {
  scenes: Scene[];
  cues: Cue[];
  hook: string;
  product: { name: string; price: string; photos: string[] };
  cta: string;
  accent: string;
  font: "jakarta" | "archivo";
  ambient: boolean;
  bgm?: string;
  /** satu klip panjang sebagai latar seluruh video (mode satu take) */
  bgClip?: string;
};

export const END_SEC = 1.6;
const PAD = 3; // jeda kecil antar adegan (frame)
export const adSceneFrames = (s: Scene, fps: number) => Math.max(Math.round(fps * 1.6), Math.ceil((s.durationSec || 3) * fps) + PAD);

const INK = "#111111";
const outline = (w: number) =>
  ({ WebkitTextStroke: `${w}px ${INK}`, paintOrder: "stroke fill", textShadow: `0 6px 0 ${INK}` }) as React.CSSProperties;

function useFonts() {
  const [h] = useState(() => delayRender("font"));
  useEffect(() => {
    const f = [
      new FontFace("Archivo", `url(${staticFile("fonts/Archivo.ttf")})`, { weight: "100 900", stretch: "62% 125%" }),
      new FontFace("Plus Jakarta Sans", `url(${staticFile("fonts/PlusJakartaSans.ttf")})`, { weight: "200 800" }),
    ];
    Promise.all(f.map((x) => x.load().then((ff) => document.fonts.add(ff)).catch(() => null))).then(() => continueRender(h));
  }, [h]);
}

const useSpr = (delay = 0, damping = 13, stiffness = 210) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, stiffness, mass: 0.6 } });
};

/** Latar adegan: klip AI/klip sendiri, atau foto produk bergerak bila klip belum ada. */
const Shot: React.FC<{ scene: Scene; photo?: string; index: number; frames: number; ambient: boolean }> = ({ scene, photo, index, frames, ambient }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // hentakan zoom di awal potongan + dorongan pelan sepanjang shot supaya terasa hidup
  const punch = interpolate(frame, [0, 6], [1.12, 1], { extrapolateRight: "clamp" }) * interpolate(frame, [0, frames], [1, 1.07]);
  if (scene.visual.clip) {
    const need = frames / fps;
    const rate = scene.clipSec && scene.clipSec < need ? Math.max(0.55, scene.clipSec / need) : 1;
    return (
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>
        <OffthreadVideo
          src={staticFile(scene.visual.clip)}
          playbackRate={rate}
          muted={!ambient}
          volume={ambient ? 0.16 : 0}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    );
  }
  // tanpa klip: foto produk dengan gerak kamera berbeda tiap adegan
  const p = frame / Math.max(1, frames);
  const moves = [
    { s: 1 + p * 0.14, x: 0, y: -p * 40 },
    { s: 1.14 - p * 0.12, x: p * 50, y: 0 },
    { s: 1.05 + p * 0.1, x: -p * 40, y: p * 30 },
  ];
  const m = moves[index % moves.length];
  return (
    <AbsoluteFill style={{ background: "#ECE7DF", transform: `scale(${punch})` }}>
      {photo ? (
        <>
          <Img src={staticFile(photo)} style={{ position: "absolute", inset: -80, width: "calc(100% + 160px)", height: "calc(100% + 160px)", objectFit: "cover", filter: "blur(40px) saturate(1.2)", opacity: 0.7 }} />
          <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
            <Img src={staticFile(photo)} style={{ width: 900, height: 1100, objectFit: "contain", transform: `translate(${m.x}px, ${m.y}px) scale(${m.s})`, filter: "drop-shadow(0 40px 60px rgba(0,0,0,.28))" }} />
          </AbsoluteFill>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/** Hook besar di awal video. */
const Hook: React.FC<{ text: string; accent: string; font: string; frames: number }> = ({ text, accent, font, frames }) => {
  const frame = useCurrentFrame();
  const words = text.split(/\s+/).filter(Boolean);
  const out = interpolate(frame, [frames - 8, frames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: out }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,0) 55%)" }} />
      <div style={{ position: "absolute", top: 250, left: 70, right: 170, display: "flex", flexWrap: "wrap", gap: "6px 22px" }}>
        {words.map((w, i) => (
          <HookWord key={i} w={w} i={i} last={i === words.length - 1} accent={accent} font={font} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
const HookWord: React.FC<{ w: string; i: number; last: boolean; accent: string; font: string }> = ({ w, i, last, accent, font }) => {
  const e = useSpr(i * 2);
  const k = 0.82 + e * 0.18; // sudah terlihat sejak frame 0 supaya thumbnail TikTok berisi hook
  return (
    <span
      style={{
        fontFamily: font,
        fontWeight: 900,
        fontStretch: "80%",
        fontSize: 132,
        lineHeight: 1.02,
        textTransform: "uppercase",
        color: last ? accent : "#fff",
        transform: `scale(${k}) rotate(${(1 - e) * -4}deg)`,
        display: "inline-block",
        ...outline(10),
      }}
    >
      {w}
    </span>
  );
};

/** Label singkat per adegan, gaya stiker. */
const Sticker: React.FC<{ text: string; delay: number; font: string }> = ({ text, delay, font }) => {
  const e = useSpr(delay, 11, 240);
  if (!text) return null;
  return (
    <div style={{ position: "absolute", top: 230, left: 70, right: 170, display: "flex" }}>
      <div
        style={{
          background: "#fff",
          color: INK,
          fontFamily: font,
          fontWeight: 900,
          fontStretch: "85%",
          fontSize: 66,
          lineHeight: 1.05,
          padding: "14px 28px 16px",
          borderRadius: 18,
          transform: `rotate(-2.5deg) scale(${e})`,
          transformOrigin: "left center",
          boxShadow: "0 10px 0 rgba(0,0,0,.25)",
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Caption kata per kata; kata yang sedang diucapkan diberi warna aksen. */
const Captions: React.FC<{ cues: Cue[]; accent: string; font: string }> = ({ cues, accent, font }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const cue = cues.find((c) => t >= c.start && t < c.end);
  if (!cue) return null;
  const words = cue.text.split(/\s+/);
  const total = words.reduce((n, w) => n + w.length + 1, 0);
  let acc = 0;
  const active = words.findIndex((w) => {
    acc += w.length + 1;
    return t < cue.start + ((cue.end - cue.start) * acc) / total;
  });
  const local = Math.round((t - cue.start) * fps);
  const pop = spring({ frame: local, fps, config: { damping: 12, stiffness: 260, mass: 0.5 } });
  return (
    <div style={{ position: "absolute", top: 1130, left: 60, right: 170, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 18px", transform: `scale(${0.9 + pop * 0.1})` }}>
      {words.map((w, i) => (
        <span
          key={i}
          style={{ fontFamily: font, fontWeight: 900, fontStretch: "85%", fontSize: 96, lineHeight: 1.1, color: i === active ? accent : "#fff", ...outline(9) }}
        >
          {w}
        </span>
      ))}
    </div>
  );
};

/** Ajakan di akhir: pill "Cek keranjang kuning" + panah ke arah keranjang (kiri bawah layar TikTok). */
const Cta: React.FC<{ cta: string; accent: string; font: string }> = ({ cta, accent, font }) => {
  const frame = useCurrentFrame();
  const pill = useSpr(0, 9, 220);
  const bob = Math.sin(frame / 4) * 8;
  const arrow = Math.sin(frame / 3.2) * 14;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 1330, left: 60, right: 150, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            background: accent,
            color: INK,
            fontFamily: font,
            fontWeight: 900,
            fontStretch: "88%",
            fontSize: 60,
            whiteSpace: "nowrap",
            padding: "22px 38px",
            borderRadius: 999,
            border: `5px solid ${INK}`,
            transform: `scale(${pill}) translateY(${bob}px)`,
            transformOrigin: "left center",
            boxShadow: `0 10px 0 ${INK}`,
          }}
        >
          <ShoppingCart size={60} strokeWidth={3} color={INK} />
          {cta}
        </div>
        <svg width="110" height="110" viewBox="0 0 100 100" style={{ marginLeft: 40, opacity: pill, transform: `translate(${-arrow * 0.6}px, ${arrow}px)` }}>
          <path d="M80 10 C 60 40, 40 55, 18 82" stroke="#fff" strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d="M14 56 L 16 86 L 44 80" stroke="#fff" strokeWidth="9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export const ProductAd: React.FC<AdProps> = ({ scenes, cues, hook, product, cta, accent, font, ambient, bgm, bgClip }) => {
  useFonts();
  const { fps, durationInFrames } = useVideoConfig();
  const fam = "Archivo"; // caption butuh huruf tebal sempit, dipakai di semua channel
  const acc = accent || "#FFE14D";
  let start = 0;
  const parts = scenes.map((s, i) => {
    const frames = adSceneFrames(s, fps);
    const from = start;
    start += frames;
    return { s, i, from, frames };
  });
  // jadwal caption mengikuti jeda antar adegan
  const shifted: Cue[] = [];
  let off = 0;
  scenes.forEach((s, i) => {
    const audioStart = parts[i].from / fps;
    const sc = cues.filter((c) => c.start >= off - 0.001 && c.start < off + (s.durationSec || 0) - 0.001);
    sc.forEach((c) => shifted.push({ ...c, start: c.start - off + audioStart, end: c.end - off + audioStart }));
    off += s.durationSec || 0;
  });
  const endFrom = start;
  const photos = product.photos;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {bgClip ? (
        <AbsoluteFill>
          <OffthreadVideo src={staticFile(bgClip)} muted={!ambient} volume={ambient ? 0.16 : 0} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </AbsoluteFill>
      ) : null}
      {parts.map(({ s, i, from, frames }) => (
        <Sequence key={s.id} from={from} durationInFrames={i === parts.length - 1 ? frames + Math.round(END_SEC * fps) : frames}>
          {bgClip ? null : <Shot scene={s} photo={photos.length ? photos[i % photos.length] : undefined} index={i} frames={frames + (i === parts.length - 1 ? Math.round(END_SEC * fps) : 0)} ambient={ambient} />}
          <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,.35) 100%)" }} />
          {i > 0 ? <Sticker text={s.screenText} delay={3} font={fam} /> : null}
          {i > 0 && s.screenText ? (
            <Sequence from={3}>
              <Audio src={staticFile("audio/pop.wav")} volume={0.35} />
            </Sequence>
          ) : null}
          {s.audio ? <Audio src={staticFile(s.audio)} /> : null}
          {i > 0 ? <Audio src={staticFile("audio/whoosh.wav")} volume={0.35} /> : null}
        </Sequence>
      ))}
      {/* hook bertahan sepanjang adegan pertama (minimal 2 detik) */}
      <Sequence from={0} durationInFrames={Math.max(60, parts[0]?.frames || 60)}>
        <Hook text={hook || scenes[0]?.screenText || ""} accent={acc} font={fam} frames={Math.max(60, parts[0]?.frames || 60)} />
      </Sequence>
      <Sequence from={0} durationInFrames={endFrom}>
        <Captions cues={shifted} accent={acc} font={fam} />
      </Sequence>
      {/* ajakan muncul di adegan terakhir dan bertahan sampai video selesai, tanpa kartu harga */}
      <Sequence from={Math.max(0, (parts[parts.length - 1]?.from || 0) + 6)}>
        <Cta cta={cta} accent={acc} font={fam} />
        <Audio src={staticFile("audio/pop.wav")} volume={0.6} />
      </Sequence>
      {bgm ? (
        <Audio
          src={staticFile(bgm)}
          loop
          volume={(f) => interpolate(f, [0, endFrom - 6, endFrom + 4, durationInFrames - 12, durationInFrames], [0.13, 0.13, 0.24, 0.24, 0], { extrapolateRight: "clamp" })}
        />
      ) : null}
    </AbsoluteFill>
  );
};
