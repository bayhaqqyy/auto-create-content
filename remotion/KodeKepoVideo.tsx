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
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { fade } from "@remotion/transitions/fade";
import type { AnimLayout, Look2D, Scene } from "../lib/types";
import { isAnimLayout } from "../lib/anim";
import { AnimScene } from "./anim/AnimScene";
import type { Cue } from "../lib/subtitle";
import { Icon } from "./Icons";

export type Theme = {
  headerText: string;
  tagline: string;
  outroTeaser: string;
  outroFollow: string;
  channelName: string;
  colors: { bg: string; card: string; accent: string; accent2: string; text: string; muted: string; outroBg: string; outroText: string };
  grid: boolean;
  bgmVolume: number;
  font: "jakarta" | "archivo";
  /** "kartu" (bawaan), "layar" = latar terang dengan HP besar, "teks" = teks besar di tengah, atau tampilan animasi */
  layout?: "kartu" | "layar" | "teks" | AnimLayout;
  /** header nama channel + garis progres di atas (bawaan mati: tertutup kolom cari TikTok) */
  showHeader?: boolean;
};

export type VideoProps = {
  scenes: Scene[];
  cues: Cue[];
  characters: { id: string; name: string; color: string; textColor: string }[];
  theme: Theme;
  episode?: string;
  hookTitle?: string;
  hookKeyword?: string;
  logo?: string;
  bgm?: string;
  products?: Record<string, ProductInfo>;
  /** teks ajakan di scene terakhir konten affiliate, mis. "Cek keranjang kuning" */
  affiliateCta?: string;
  /** tampilan animasi: tokoh kartun per id, dan judul video yang tampil tetap di atas (horor) */
  looks?: Record<string, Look2D>;
  videoTitle?: string;
};

export type ProductInfo = { name: string; brand: string; price: string; platform: string; photo?: string };

export const TRANSITION = 10;
export const OUTRO_SEC = 3.2;
const HOOK = 40; // frame: judul besar di awal, jadi frame pertama berisi klaim seperti cover
const X = 72;
const XR = 140;

/* ---------------- util ---------------- */

const fontFamily = (t: Theme) => (t.font === "archivo" ? "Archivo" : "Plus Jakarta Sans");

function useFonts() {
  const [handle] = useState(() => delayRender("font"));
  useEffect(() => {
    const fonts = [
      new FontFace("Plus Jakarta Sans", `url(${staticFile("fonts/PlusJakartaSans.ttf")})`, { weight: "200 800" }),
      new FontFace("Archivo", `url(${staticFile("fonts/Archivo.ttf")})`, { weight: "100 900", stretch: "62% 125%" }),
      new FontFace("Anton", `url(${staticFile("fonts/Anton.woff2")})`, { weight: "400" }),
      new FontFace("Bungee", `url(${staticFile("fonts/Bungee-Regular.ttf")})`, { weight: "400" }),
    ];
    Promise.all(fonts.map((f) => f.load().then((ff) => document.fonts.add(ff)).catch(() => null))).then(() => continueRender(handle));
  }, [handle]);
}

const norm = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const alpha = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
const rgb = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** Luminans relatif 0..1 (WCAG). */
const lum = (hex: string) => {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** Gelapkan warna aksen yang terlalu terang supaya terbaca di latar putih. */
const deepen = (hex: string) => {
  let [r, g, b] = rgb(hex);
  for (let i = 0; i < 12 && lum(`#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`) > 0.2; i++) {
    r = Math.round(r * 0.85); g = Math.round(g * 0.85); b = Math.round(b * 0.85);
  }
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
};
/** Versi terang tema channel, dipakai tampilan "layar". */
const lightTheme = (t: Theme): Theme => ({
  ...t,
  grid: false,
  colors: { ...t.colors, bg: "#F4F6FA", card: "#FFFFFF", text: "#0F1928", muted: "#5B6678", accent: deepen(t.colors.accent), accent2: deepen(t.colors.accent2) },
});
const layoutOf = (t: Theme) => t.layout || "kartu";

const useSpring = (delay = 0, damping = 15, stiffness = 160) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, stiffness, mass: 0.7 } });
};
const lines = (s: string) => {
  const parts = s.split("|").map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 2) return [parts[0], parts.slice(1).join(" ")];
  const w = s.split(/\s+/);
  if (w.length < 3) return [s, ""];
  const cut = Math.ceil(w.length / 2);
  return [w.slice(0, cut).join(" "), w.slice(cut).join(" ")];
};

/* ---------------- latar ---------------- */

const Backdrop: React.FC<{ theme: Theme; seed: number }> = ({ theme, seed }) => {
  const frame = useCurrentFrame();
  const top = 520 + (seed % 3) * 120;
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      {theme.grid ? (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(${alpha(theme.colors.text, 0.045)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(theme.colors.text, 0.045)} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      ) : null}
      {/* lingkaran dekoratif seperti di cover KodeKepo! */}
      {[640, 440].map((d, i) => (
        <div
          key={d}
          aria-hidden
          style={{
            position: "absolute",
            right: -220 + i * 100,
            top: top + i * 100,
            width: d,
            height: d,
            borderRadius: "50%",
            border: `2px solid ${alpha(seed % 2 ? theme.colors.accent2 : theme.colors.accent, i ? 0.1 : 0.16)}`,
            transform: `scale(${1 + Math.sin((frame + i * 20) / 40) * 0.015})`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const SceneImage: React.FC<{ src: string; index: number; theme: Theme }> = ({ src, index, theme }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = frame / Math.max(1, durationInFrames);
  const dir = index % 2 === 0 ? 1 : -1;
  return (
    <AbsoluteFill>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.06 + p * 0.1}) translateX(${dir * (p * 40 - 20)}px)` }} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${alpha(theme.colors.bg, 0.92)} 0%, ${alpha(theme.colors.bg, 0.55)} 22%, ${alpha(theme.colors.bg, 0)} 42%, ${alpha(theme.colors.bg, 0)} 58%, ${alpha(theme.colors.bg, 0.85)} 80%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/* ---------------- kartu-kartu visual ---------------- */

const cardStyle = (t: Theme): React.CSSProperties => ({
  background: t.colors.card,
  border: `2px solid ${alpha(t.colors.text, 0.12)}`,
  borderRadius: 32,
});

const IconCircle: React.FC<{ name?: string; theme: Theme; size?: number; color?: string }> = ({ name, theme, size = 92, color }) => (
  <div style={{ flex: "none", width: size, height: size, borderRadius: "50%", background: alpha(color || theme.colors.accent, 0.16), display: "flex", alignItems: "center", justifyContent: "center" }}>
    <Icon name={name} size={size * 0.52} color={color || theme.colors.accent} stroke={2} />
  </div>
);

const Hero: React.FC<{ scene: Scene; theme: Theme; index: number }> = ({ scene, theme, index }) => {
  const frame = useCurrentFrame();
  const s = useSpring(8, 12);
  const col = index % 2 ? theme.colors.accent2 : theme.colors.accent;
  const float = Math.sin(frame / 18) * 10;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 520, position: "relative" }}>
      {Array.from({ length: 12 }).map((_, i) => {
        const r = 230 + random(`r${index}-${i}`) * 140;
        const a = random(`a${index}-${i}`) * Math.PI * 2 + frame / (100 + i * 7);
        const sz = 6 + random(`s${index}-${i}`) * 9;
        return <div key={i} style={{ position: "absolute", width: sz, height: sz, borderRadius: sz, background: i % 3 ? alpha(theme.colors.text, 0.3) : col, transform: `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r * 0.6}px)`, opacity: s }} />;
      })}
      <div style={{ position: "absolute", width: 440, height: 440, borderRadius: "50%", border: `3px dashed ${alpha(col, 0.35)}`, transform: `rotate(${frame * 0.5}deg) scale(${s})` }} />
      <div
        style={{
          width: 330,
          height: 330,
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, ${alpha(col, 0.3)}, ${theme.colors.card} 70%)`,
          border: `2px solid ${alpha(col, 0.35)}`,
          boxShadow: `0 0 120px ${alpha(col, 0.22)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${float}px) scale(${s})`,
        }}
      >
        <Icon name={scene.visual.icon} size={170} color={col} stroke={1.8} />
      </div>
    </div>
  );
};

const Pop: React.FC<{ delay: number; children: React.ReactNode; from?: "left" | "right" | "up" }> = ({ delay, children, from = "up" }) => {
  const e = useSpring(delay);
  const d = (1 - e) * 70;
  const tr = from === "left" ? `translateX(${-d}px)` : from === "right" ? `translateX(${d}px)` : `translateY(${d}px)`;
  return <div style={{ opacity: e, transform: `${tr} scale(${0.94 + e * 0.06})` }}>{children}</div>;
};

/** Jadwal kemunculan item agar menyebar sepanjang scene (dipakai juga untuk SFX). */
export const itemDelays = (scene: Scene, fps: number, n: number) => {
  const dur = (scene.durationSec || 4) * fps;
  const gap = Math.min(fps * 1.5, (dur * 0.6) / Math.max(1, n));
  return Array.from({ length: n }, (_, i) => Math.round(12 + i * gap));
};

const Steps: React.FC<{ scene: Scene; theme: Theme }> = ({ scene, theme }) => {
  const { fps } = useVideoConfig();
  const d = itemDelays(scene, fps, scene.visual.items.length);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {scene.visual.items.map((it, i) => (
        <Pop key={i} delay={d[i]} from="right">
          <div style={{ ...cardStyle(theme), padding: "26px 30px", display: "flex", alignItems: "center", gap: 26 }}>
            <div style={{ flex: "none", width: 72, height: 72, borderRadius: "50%", background: theme.colors.accent, color: theme.colors.bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 38 }}>{i + 1}</div>
            <div style={{ fontWeight: 800, fontSize: 46, lineHeight: 1.15, color: theme.colors.text }}>{it}</div>
          </div>
        </Pop>
      ))}
    </div>
  );
};

const Compare: React.FC<{ scene: Scene; theme: Theme }> = ({ scene, theme }) => {
  const [a, b] = scene.visual.items;
  const vs = useSpring(18);
  const box = (t: string, hl: boolean) => (
    <div style={{ ...cardStyle(theme), padding: "30px 30px", display: "flex", alignItems: "center", gap: 24, border: hl ? `2px solid ${alpha(theme.colors.accent2, 0.6)}` : cardStyle(theme).border }}>
      <IconCircle name={hl ? "alert" : "user"} theme={theme} color={hl ? theme.colors.accent2 : theme.colors.accent} />
      <div style={{ flex: 1, fontWeight: 800, fontSize: 46, lineHeight: 1.12, color: theme.colors.text }}>{t}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Pop delay={10}>{box(a, false)}</Pop>
      <div style={{ alignSelf: "center", fontWeight: 800, fontSize: 40, color: theme.colors.muted, transform: `scale(${vs})` }}>VS</div>
      <Pop delay={22}>{box(b, true)}</Pop>
    </div>
  );
};

const NumberCard: React.FC<{ scene: Scene; theme: Theme }> = ({ scene, theme }) => {
  const frame = useCurrentFrame();
  const raw = scene.visual.items[0] || "";
  const m = raw.match(/[\d.,]+/);
  let shown = raw;
  if (m) {
    const target = parseFloat(m[0].replace(/\./g, "").replace(",", "."));
    if (Number.isFinite(target) && target > 0) {
      const p = interpolate(frame, [6, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      const dec = (m[0].split(",")[1] || "").length;
      shown = raw.replace(m[0], (target * (1 - Math.pow(1 - p, 3))).toLocaleString("id-ID", { minimumFractionDigits: dec, maximumFractionDigits: dec }));
    }
  }
  return (
    <Pop delay={6}>
      <div style={{ ...cardStyle(theme), padding: "44px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 150, lineHeight: 0.95, letterSpacing: "-0.03em", color: theme.colors.accent }}>{shown}</div>
        <div style={{ fontWeight: 600, fontSize: 42, lineHeight: 1.25, color: theme.colors.muted }}>{scene.visual.items[1] || ""}</div>
      </div>
    </Pop>
  );
};

const isMe = (w: string) => /^(kamu|aku|saya|gue|gw|lo|me|anda)$/i.test(w);
const parseChat = (items: string[]) =>
  items.map((m) => {
    const i = m.indexOf(":");
    return i > 0 ? { who: m.slice(0, i).trim(), text: m.slice(i + 1).trim() } : { who: "", text: m };
  });

const Chat: React.FC<{ scene: Scene; theme: Theme }> = ({ scene, theme }) => {
  const { fps } = useVideoConfig();
  const msgs = parseChat(scene.visual.items);
  const other = msgs.find((m) => m.who && !isMe(m.who))?.who || "Chat";
  const d = itemDelays(scene, fps, msgs.length);
  return (
    <Pop delay={4}>
      <div style={{ ...cardStyle(theme), overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "22px 28px", background: alpha(theme.colors.text, 0.06) }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: alpha(theme.colors.accent2, 0.25), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 30, color: theme.colors.accent2 }}>{other.slice(0, 1).toUpperCase()}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 34, color: theme.colors.text }}>{other}</div>
            <div style={{ fontWeight: 500, fontSize: 24, color: theme.colors.muted }}>online</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "26px 28px 30px" }}>
          {msgs.map((m, i) => {
            const me = isMe(m.who);
            return (
              <div key={i} style={{ alignSelf: me ? "flex-end" : "flex-start", maxWidth: "84%" }}>
                <Pop delay={d[i]} from={me ? "right" : "left"}>
                  <div
                    style={{
                      background: me ? alpha(theme.colors.accent, 0.2) : alpha(theme.colors.text, 0.09),
                      border: me ? `1.5px solid ${alpha(theme.colors.accent, 0.45)}` : "none",
                      borderRadius: me ? "26px 26px 6px 26px" : "26px 26px 26px 6px",
                      padding: "18px 24px",
                      fontWeight: 600,
                      fontSize: 36,
                      lineHeight: 1.3,
                      color: theme.colors.text,
                    }}
                  >
                    {m.text}
                  </div>
                </Pop>
              </div>
            );
          })}
        </div>
      </div>
    </Pop>
  );
};

const Notification: React.FC<{ scene: Scene; theme: Theme }> = ({ scene, theme }) => {
  const [app, title, body] = scene.visual.items;
  const e = useSpring(6, 13);
  return (
    <div style={{ transform: `translateY(${(1 - e) * -160}px)`, opacity: e }}>
      <div style={{ ...cardStyle(theme), padding: "28px 30px", display: "flex", gap: 24, boxShadow: `0 30px 80px ${alpha("#000000", 0.35)}` }}>
        <div style={{ flex: "none", width: 84, height: 84, borderRadius: 22, background: theme.colors.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={scene.visual.icon || "chat"} size={46} color={theme.colors.bg} stroke={2.4} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, fontSize: 26, color: theme.colors.muted }}>
            <span>{(app || "").toUpperCase()}</span>
            <span>sekarang</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: 38, color: theme.colors.text }}>{title}</div>
          <div style={{ fontWeight: 500, fontSize: 34, lineHeight: 1.3, color: alpha(theme.colors.text, 0.85) }}>{body}</div>
        </div>
      </div>
    </div>
  );
};

const Call: React.FC<{ scene: Scene; theme: Theme }> = ({ scene, theme }) => {
  const frame = useCurrentFrame();
  const [who, status] = scene.visual.items;
  const ring = 1 + Math.abs(Math.sin(frame / 6)) * 0.06;
  const dots = ".".repeat(1 + (Math.floor(frame / 8) % 3));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Pop delay={4}>
        <div style={{ ...cardStyle(theme), padding: "26px 30px", display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ transform: `scale(${ring})` }}>
            <IconCircle name="phone" theme={theme} color={theme.colors.accent2} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontWeight: 800, fontSize: 44, color: theme.colors.text }}>{who}</div>
            <div style={{ fontWeight: 500, fontSize: 28, color: theme.colors.muted }}>
              {(status || "memanggil").replace(/[.…]+$/, "")}
              {dots}
            </div>
          </div>
          <div style={{ flex: "none", background: theme.colors.accent2, color: theme.colors.bg, fontWeight: 800, fontSize: 24, letterSpacing: "0.04em", padding: "12px 20px", borderRadius: 999 }}>PANGGILAN</div>
        </div>
      </Pop>
      <Pop delay={12}>
        <div style={{ ...cardStyle(theme), height: 200, padding: "0 30px", display: "flex", alignItems: "center", justifyContent: "space-between", border: `2px solid ${alpha(theme.colors.accent2, 0.5)}` }}>
          {Array.from({ length: 24 }).map((_, i) => {
            const h = 30 + Math.abs(Math.sin(frame / 5 + i * 0.7)) * 130 * (0.5 + random(`w${i}`) * 0.5);
            return <div key={i} style={{ width: 14, height: h, borderRadius: 7, background: theme.colors.accent2 }} />;
          })}
        </div>
      </Pop>
    </div>
  );
};

/** Kartu produk: foto asli milik kreator (bukan gambar AI), nama, merek, harga. */
const ProductCard: React.FC<{ info?: ProductInfo; theme: Theme }> = ({ info, theme }) => {
  const e = useSpring(4, 13);
  const frame = useCurrentFrame();
  if (!info) return null;
  return (
    <div style={{ opacity: e, transform: `translateY(${(1 - e) * 80}px) scale(${0.92 + e * 0.08})` }}>
      <div style={{ ...cardStyle(theme), overflow: "hidden" }}>
        <div style={{ height: 470, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          {info.photo ? (
            <Img src={staticFile(info.photo)} style={{ width: "100%", height: "100%", objectFit: "contain", transform: `scale(${1 + frame * 0.0008})` }} />
          ) : (
            <Icon name="package" size={200} color={theme.colors.bg} stroke={1.4} />
          )}
        </div>
        <div style={{ padding: "26px 30px 30px", display: "flex", flexDirection: "column", gap: 10 }}>
          {info.brand ? <div style={{ fontWeight: 700, fontSize: 28, letterSpacing: "0.06em", textTransform: "uppercase", color: theme.colors.muted }}>{info.brand}</div> : null}
          <div style={{ fontWeight: 800, fontSize: 46, lineHeight: 1.12, color: theme.colors.text }}>{info.name}</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
            {info.price ? <div style={{ background: theme.colors.accent, color: theme.colors.bg, fontWeight: 800, fontSize: 30, padding: "10px 20px", borderRadius: 999 }}>{info.price}</div> : null}
            <div style={{ border: `2px solid ${alpha(theme.colors.text, 0.3)}`, color: theme.colors.muted, fontWeight: 700, fontSize: 26, padding: "9px 18px", borderRadius: 999 }}>{info.platform}</div>
          </div>
          {info.price ? <div style={{ fontWeight: 500, fontSize: 24, color: theme.colors.muted }}>Harga bisa berubah, cek di keranjang.</div> : null}
        </div>
      </div>
    </div>
  );
};

const ProsCons: React.FC<{ scene: Scene; theme: Theme }> = ({ scene, theme }) => {
  const { fps } = useVideoConfig();
  const items = scene.visual.items.map((x) => ({ plus: x.trim().startsWith("+"), text: x.trim().replace(/^[+-]\s*/, "") }));
  const d = itemDelays(scene, fps, items.length);
  return (
    <div style={{ ...cardStyle(theme), padding: "26px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
      {items.map((it, i) => (
        <Pop key={i} delay={d[i]} from="right">
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ flex: "none", width: 60, height: 60, borderRadius: "50%", background: alpha(it.plus ? theme.colors.accent : theme.colors.accent2, 0.18), display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={it.plus ? "check" : "x"} size={34} color={it.plus ? theme.colors.accent : theme.colors.accent2} stroke={3} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 40, lineHeight: 1.2, color: theme.colors.text }}>{it.text}</div>
          </div>
        </Pop>
      ))}
    </div>
  );
};

const Visual: React.FC<{ scene: Scene; theme: Theme; index: number; media: boolean; products?: Record<string, ProductInfo> }> = ({ scene, theme, index, media, products }) => {
  const v = scene.visual;
  switch (v.kind) {
    case "product":
      return <ProductCard info={products?.[v.items[0]]} theme={theme} />;
    case "proscons":
      return <ProsCons scene={scene} theme={theme} />;
    case "steps":
      return v.items.length >= 2 ? <Steps scene={scene} theme={theme} /> : null;
    case "compare":
      return v.items.length === 2 ? <Compare scene={scene} theme={theme} /> : null;
    case "number":
      return <NumberCard scene={scene} theme={theme} />;
    case "chat":
      return <Chat scene={scene} theme={theme} />;
    case "notification":
      return <Notification scene={scene} theme={theme} />;
    case "call":
      return <Call scene={scene} theme={theme} />;
    default:
      return media ? null : <Hero scene={scene} theme={theme} index={index} />;
  }
};

/* ---------------- bab: pill tag + judul dua baris ---------------- */

const Chapter: React.FC<{ scene: Scene; theme: Theme; index: number }> = ({ scene, theme, index }) => {
  const tag = useSpring(0, 12, 200);
  const l1 = useSpring(4);
  const l2 = useSpring(9);
  const [a, b] = lines(scene.screenText);
  const col2 = index % 2 ? theme.colors.accent2 : theme.colors.accent;
  const big = Math.max(a.length, b.length) > 13 ? 78 : 92;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {scene.tag ? (
        <div style={{ alignSelf: "flex-start", background: col2, color: theme.colors.bg, fontWeight: 800, fontSize: 28, letterSpacing: "0.06em", padding: "10px 22px", borderRadius: 999, transform: `scale(${tag})`, transformOrigin: "left center" }}>
          {scene.tag}
        </div>
      ) : null}
      <div style={{ fontWeight: 800, fontSize: big, lineHeight: 1.02, letterSpacing: "-0.02em", textTransform: "uppercase" }}>
        <div style={{ color: theme.colors.text, opacity: l1, transform: `translateY(${(1 - l1) * 40}px)` }}>{a}</div>
        {b ? <div style={{ color: col2, opacity: l2, transform: `translateY(${(1 - l2) * 40}px)` }}>{b}</div> : null}
      </div>
    </div>
  );
};

type SceneProps = { scene: Scene; index: number; theme: Theme; products?: Record<string, ProductInfo>; cta?: string; total?: number; looks?: Record<string, Look2D>; videoTitle?: string; episode?: string };

const SceneKartu: React.FC<SceneProps> = ({ scene, index, theme, products, cta }) => {
  const ctaIn = useSpring(14, 11);
  const isClip = scene.visual.kind === "clip" && !!scene.visual.clip;
  const media = isClip || !!scene.image;
  return (
    <AbsoluteFill style={{ fontFamily: fontFamily(theme) }}>
      {isClip ? (
        <AbsoluteFill>
          <OffthreadVideo src={staticFile(scene.visual.clip!)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <AbsoluteFill style={{ background: `linear-gradient(180deg, ${alpha(theme.colors.bg, 0.9)} 0%, ${alpha(theme.colors.bg, 0)} 38%, ${alpha(theme.colors.bg, 0)} 58%, ${alpha(theme.colors.bg, 0.85)} 80%)` }} />
        </AbsoluteFill>
      ) : scene.image ? (
        <SceneImage src={scene.image} index={index} theme={theme} />
      ) : (
        <Backdrop theme={theme} seed={index} />
      )}
      <div style={{ position: "absolute", top: 190, left: X, right: X }}>
        <Chapter scene={scene} theme={theme} index={index} />
      </div>
      <div style={{ position: "absolute", top: 560, left: X, right: X, bottom: 700, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <Visual scene={scene} theme={theme} index={index} media={media} products={products} />
      </div>
      {cta ? (
        <div style={{ position: "absolute", left: X, top: 1160, display: "flex", alignItems: "center", gap: 14, background: theme.colors.accent, color: theme.colors.bg, fontWeight: 800, fontSize: 40, padding: "16px 28px", borderRadius: 999, transform: `scale(${ctaIn})`, transformOrigin: "left center" }}>
          <Icon name="cart" size={42} color={theme.colors.bg} stroke={2.6} />
          {cta}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

const CtaPill: React.FC<{ cta: string; theme: Theme; top: number }> = ({ cta, theme, top }) => {
  const ctaIn = useSpring(14, 11);
  return (
    <div style={{ position: "absolute", left: X, top, display: "flex", alignItems: "center", gap: 14, background: theme.colors.accent, color: theme.colors.bg, fontWeight: 800, fontSize: 40, padding: "16px 28px", borderRadius: 999, transform: `scale(${ctaIn})`, transformOrigin: "left center" }}>
      <Icon name="cart" size={42} color={theme.colors.bg} stroke={2.6} />
      {cta}
    </div>
  );
};

/** Latar terang penuh layar (tampilan "layar"): gradasi lembut, tanpa area gelap yang terbaca seperti bingkai. */
const LightBackdrop: React.FC<{ theme: Theme }> = ({ theme }) => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, #EEF3FC 0%, #DCE6F7 55%, #C9D9F5 100%)" }}>
    <AbsoluteFill style={{ background: `radial-gradient(circle at 85% 12%, ${alpha(theme.colors.accent, 0.16)}, transparent 45%)` }} />
  </AbsoluteFill>
);

const StatusBar: React.FC = () => (
  <div style={{ position: "absolute", top: 34, left: 60, right: 60, display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 800, fontSize: 30, color: "#0F1928" }}>
    <span>09:41</span>
    <span style={{ width: 54, height: 26, borderRadius: 8, border: "3px solid #0F1928", padding: 3, boxSizing: "border-box", display: "flex" }}>
      <span style={{ flex: 1, background: "#0F1928", borderRadius: 3 }} />
    </span>
  </div>
);

/** Tampilan "layar": HP besar di tengah latar terang, isi scene tampil di layar HP. Gaya yang paling ditonton di EP.031/032. */
const SceneLayar: React.FC<SceneProps> = ({ scene, index, theme, products, cta }) => {
  const frame = useCurrentFrame();
  const lt = lightTheme(theme);
  const e = useSpring(0, 16, 140);
  const isClip = scene.visual.kind === "clip" && !!scene.visual.clip;
  const media = isClip || !!scene.image;
  const zoom = 1 + Math.min(1, frame / 120) * 0.025;
  return (
    <AbsoluteFill style={{ fontFamily: fontFamily(theme) }}>
      <LightBackdrop theme={theme} />
      <div style={{ position: "absolute", top: 160, left: X, right: X }}>
        <Chapter scene={scene} theme={lt} index={index} />
      </div>
      <div
        style={{
          position: "absolute", left: 100, right: 100, top: 560, height: 1500, borderRadius: 96, background: "#0B0F18",
          boxShadow: "0 40px 80px rgba(15,25,40,0.25)", transform: `translateY(${(1 - e) * 120}px) scale(${zoom})`, transformOrigin: "50% 0%",
        }}
      >
        <div style={{ position: "absolute", top: 20, left: 20, right: 20, bottom: 0, borderRadius: 78, background: lt.colors.bg, overflow: "hidden" }}>
          {isClip ? (
            <OffthreadVideo src={staticFile(scene.visual.clip!)} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : scene.image ? (
            <Img src={staticFile(scene.image)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.04 + frame * 0.0006})` }} />
          ) : (
            <>
              <StatusBar />
              <div style={{ position: "absolute", top: 120, left: 40, right: 40 }}>
                <Visual scene={scene} theme={lt} index={index} media={media} products={products} />
              </div>
            </>
          )}
        </div>
        <div style={{ position: "absolute", top: 40, left: "50%", width: 150, height: 40, marginLeft: -75, borderRadius: 20, background: "#0B0F18" }} />
      </div>
      {cta ? <CtaPill cta={cta} theme={lt} top={1180} /> : null}
    </AbsoluteFill>
  );
};

/** Tampilan "teks": judul bab sangat besar di tengah, ikon kecil, subtitle besar tanpa kotak. */
const SceneTeks: React.FC<SceneProps> = ({ scene, index, theme, products, cta }) => {
  const frame = useCurrentFrame();
  const tag = useSpring(0, 12, 200);
  const l1 = useSpring(3);
  const l2 = useSpring(8);
  const ic = useSpring(12, 12);
  const [a, b] = lines(scene.screenText);
  const col = index % 2 ? theme.colors.accent2 : theme.colors.accent;
  const longest = Math.max(a.length, b.length);
  const big = longest > 14 ? 104 : longest > 10 ? 124 : 148;
  const showVisual = scene.visual.kind === "number" || scene.visual.kind === "product";
  return (
    <AbsoluteFill style={{ fontFamily: fontFamily(theme) }}>
      {scene.image ? <SceneImage src={scene.image} index={index} theme={theme} /> : <Backdrop theme={theme} seed={index} />}
      <div style={{ position: "absolute", top: 300, left: X, right: X, display: "flex", flexDirection: "column", alignItems: "center", gap: 44, textAlign: "center" }}>
        {scene.tag ? (
          <div style={{ background: col, color: theme.colors.bg, fontWeight: 800, fontSize: 32, letterSpacing: "0.06em", padding: "12px 26px", borderRadius: 999, transform: `scale(${tag})` }}>{scene.tag}</div>
        ) : null}
        <div style={{ fontWeight: 800, fontSize: big, lineHeight: 1.0, letterSpacing: "-0.03em", textTransform: "uppercase" }}>
          <div style={{ color: theme.colors.text, opacity: l1, transform: `translateY(${(1 - l1) * 50}px)` }}>{a}</div>
          {b ? <div style={{ color: col, opacity: l2, transform: `translateY(${(1 - l2) * 50}px)` }}>{b}</div> : null}
        </div>
        {showVisual ? (
          <div style={{ width: "100%", textAlign: "left" }}>
            <Visual scene={scene} theme={theme} index={index} media={false} products={products} />
          </div>
        ) : (
          <div style={{ transform: `scale(${ic}) translateY(${Math.sin(frame / 16) * 8}px)` }}>
            <IconCircle name={scene.visual.icon} theme={theme} size={230} color={col} />
          </div>
        )}
      </div>
      {cta ? <CtaPill cta={cta} theme={theme} top={1160} /> : null}
    </AbsoluteFill>
  );
};

const SceneView: React.FC<SceneProps> = (props) => {
  const l = layoutOf(props.theme);
  if (isAnimLayout(l))
    return <AnimScene scene={props.scene} index={props.index} total={props.total || 1} layout={l} looks={props.looks || {}} title={props.videoTitle || ""} episode={props.episode} />;
  if (l === "layar") return <SceneLayar {...props} />;
  if (l === "teks") return <SceneTeks {...props} />;
  return <SceneKartu {...props} />;
};

/* ---------------- hook: frame pertama seperti cover ---------------- */

const Hook: React.FC<{ title: string; keyword?: string; theme: Theme; episode?: string; tag?: string }> = ({ title, keyword, theme: base, episode, tag }) => {
  const frame = useCurrentFrame();
  const light = layoutOf(base) === "layar";
  const theme = light ? lightTheme(base) : base;
  const out = interpolate(frame, [HOOK - 8, HOOK], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const words = title.toUpperCase().split(/\s+/).filter(Boolean);
  const nRows = Math.min(4, Math.max(2, Math.ceil(words.length / 2)));
  const per = Math.ceil(words.length / nRows);
  const rows: string[] = [];
  for (let i = 0; i < words.length; i += per) rows.push(words.slice(i, i + per).join(" "));
  const k = keyword ? norm(keyword) : "";
  const kRow = k ? rows.findIndex((r) => r.split(" ").some((w) => norm(w) === k)) : -1;
  const accentFrom = kRow >= 0 ? kRow : rows.length - 1;
  const size = rows.some((r) => r.length > 11) ? 104 : 124;
  return (
    <AbsoluteFill style={{ opacity: out, fontFamily: fontFamily(theme) }}>
      {light ? <LightBackdrop theme={base} /> : <Backdrop theme={theme} seed={0} />}
      <div style={{ position: "absolute", top: 300, left: 96, right: XR, display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={{ display: "flex", gap: 14 }}>
          {episode ? <div style={{ background: theme.colors.accent, color: theme.colors.bg, fontWeight: 800, fontSize: 30, letterSpacing: "0.04em", padding: "10px 22px", borderRadius: 999 }}>{episode}</div> : null}
          {tag ? <div style={{ border: `2px solid ${theme.colors.accent}`, color: theme.colors.accent, fontWeight: 700, fontSize: 28, letterSpacing: "0.06em", padding: "8px 22px", borderRadius: 999 }}>{tag}</div> : null}
        </div>
        <div style={{ fontWeight: 800, fontSize: size, lineHeight: 1.02, letterSpacing: "-0.02em" }}>
          {rows.map((r, i) => (
            <div key={i} style={{ color: i >= accentFrom ? theme.colors.accent : theme.colors.text }}>
              {r}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- lapisan tetap: header & subtitle ---------------- */

const useSceneIndex = (scenes: Scene[]) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let acc = 0;
  for (let i = 0; i < scenes.length; i++) {
    const d = sceneFrames(scenes[i], fps);
    if (frame < acc + d) return i;
    acc += d;
  }
  return scenes.length - 1;
};

const Header: React.FC<{ theme: Theme; scenes: Scene[]; episode?: string; total: number }> = ({ theme, scenes, episode, total }) => {
  const frame = useCurrentFrame();
  const idx = useSceneIndex(scenes);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return (
    <div style={{ position: "absolute", top: 70, left: X, right: X, fontFamily: fontFamily(theme) }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 34, letterSpacing: "0.02em", color: theme.colors.text }}>{theme.headerText}</div>
        <div style={{ fontWeight: 700, fontSize: 28, color: theme.colors.muted, fontVariantNumeric: "tabular-nums" }}>
          {episode ? `${episode} / ` : ""}
          {p2(idx + 1)}–{p2(scenes.length)}
        </div>
      </div>
      <div style={{ marginTop: 18, height: 6, borderRadius: 3, background: alpha(theme.colors.text, 0.14), overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(100, (frame / total) * 100)}%`, background: theme.colors.accent, borderRadius: 3 }} />
      </div>
    </div>
  );
};

const Subtitles: React.FC<{ cues: Cue[]; scenes: Scene[]; theme: Theme; characters: VideoProps["characters"] }> = ({ cues, scenes, theme, characters }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = useSceneIndex(scenes);
  const t = frame / fps;
  const cue = cues.find((c) => t >= c.start && t < c.end);
  if (!cue) return null;
  const who = characters.find((c) => c.id === scenes[idx]?.speaker);
  const words = cue.text.split(/\s+/);
  const total = words.reduce((n, w) => n + w.length + 1, 0);
  const progress = (t - cue.start) / Math.max(0.01, cue.end - cue.start);
  let acc = 0;
  const k = cue.keyword ? norm(cue.keyword) : "";
  const layout = layoutOf(theme);
  if (layout === "horor") {
    // gaya serial horor: kotak putih, nama penutur berwarna, di atas kaki tokoh
    return (
      <div style={{ position: "absolute", left: 60, right: 60, top: 1390, display: "flex", justifyContent: "center", fontFamily: fontFamily(theme) }}>
        <div style={{ background: "rgba(255,255,255,0.96)", borderRadius: 18, padding: "14px 28px 18px", fontSize: 40, lineHeight: 1.25, color: "#2B2522", textAlign: "center", maxWidth: 940 }}>
          {who && who.id !== "narator" && who.id !== "pencerita" ? <span style={{ fontWeight: 800, color: lum(who.color) > 0.6 ? "#8E4C88" : who.color }}>{who.name.toUpperCase()}: </span> : null}
          {words.map((w, i) => {
            const startFrac = acc / total;
            acc += w.length + 1;
            const said = progress >= startFrac;
            const isK = k && norm(w) === k;
            return (
              <span key={i} style={{ fontWeight: isK ? 800 : 600, color: isK ? "#C2271F" : "#2B2522", opacity: said ? 1 : 0.4 }}>
                {w}{" "}
              </span>
            );
          })}
        </div>
      </div>
    );
  }
  if (layout === "stickman" || layout === "motivasi") {
    const gold = layout === "motivasi" ? "#FFC94A" : "#E5484D";
    return (
      <div style={{ position: "absolute", left: X, right: X, bottom: 360, fontFamily: fontFamily(theme), textAlign: "center" }}>
        <div style={{ display: "inline-block", background: layout === "stickman" ? "rgba(255,255,255,0.94)" : "rgba(10,10,20,0.55)", borderRadius: 26, padding: "16px 28px 20px", border: layout === "stickman" ? "6px solid #141414" : "none" }}>
          <div style={{ fontWeight: 800, fontSize: 50, lineHeight: 1.2 }}>
            {words.map((w, i) => {
              const startFrac = acc / total;
              acc += w.length + 1;
              const said = progress >= startFrac;
              const isK = k && norm(w) === k;
              return (
                <span key={i} style={{ color: isK ? gold : layout === "stickman" ? "#141414" : "#FFFFFF", opacity: said ? 1 : 0.4 }}>
                  {w}{" "}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  if (layout === "teks") {
    // subtitle besar tanpa kotak, kata yang sedang diucapkan diberi warna aksen
    return (
      <div style={{ position: "absolute", left: X, right: X, bottom: 460, fontFamily: fontFamily(theme), textAlign: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 66, lineHeight: 1.18, textShadow: `0 4px 18px ${alpha("#000000", 0.45)}` }}>
          {words.map((w, i) => {
            const startFrac = acc / total;
            acc += w.length + 1;
            const endFrac = acc / total;
            const now = progress >= startFrac && progress < endFrac;
            const said = progress >= startFrac;
            const isK = k && norm(w) === k;
            return (
              <span key={i} style={{ color: now || isK ? theme.colors.accent : theme.colors.text, opacity: said ? 1 : 0.4 }}>
                {w}{" "}
              </span>
            );
          })}
        </div>
      </div>
    );
  }
  if (layout === "layar") {
    const lt = lightTheme(theme);
    return (
      <div style={{ position: "absolute", left: X, right: X, bottom: 330, fontFamily: fontFamily(theme), display: "flex", justifyContent: "center" }}>
        <div style={{ background: alpha("#0F1928", 0.92), borderRadius: 30, padding: "20px 32px 24px", textAlign: "center", boxShadow: "0 20px 50px rgba(15,25,40,0.3)" }}>
          <div style={{ fontWeight: 800, fontSize: 50, lineHeight: 1.22 }}>
            {words.map((w, i) => {
              const startFrac = acc / total;
              acc += w.length + 1;
              const said = progress >= startFrac;
              const isK = k && norm(w) === k;
              return (
                <span key={i} style={{ color: isK ? theme.colors.accent : "#FFFFFF", opacity: said ? 1 : 0.45 }}>
                  {w}{" "}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: X, right: XR, bottom: 400, fontFamily: fontFamily(theme) }}>
      <div style={{ background: alpha(theme.colors.bg, 0.86), border: `2px solid ${alpha(theme.colors.text, 0.1)}`, borderRadius: 28, padding: "20px 28px 24px" }}>
        {who ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ background: who.color, color: who.textColor, fontWeight: 800, fontSize: 24, letterSpacing: "0.06em", padding: "6px 14px", borderRadius: 999 }}>{who.name}</div>
            <div style={{ display: "flex", gap: 4, alignItems: "center", height: 26 }} aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ width: 5, borderRadius: 3, background: who.color, height: 8 + Math.abs(Math.sin(frame / 3 + i * 1.3)) * 18 }} />
              ))}
            </div>
          </div>
        ) : null}
        <div style={{ fontWeight: 800, fontSize: 50, lineHeight: 1.22 }}>
          {words.map((w, i) => {
            const startFrac = acc / total;
            acc += w.length + 1;
            const said = progress >= startFrac;
            const isK = k && norm(w) === k;
            return (
              <span key={i} style={{ color: isK ? theme.colors.accent : theme.colors.text, opacity: said ? 1 : 0.35 }}>
                {w}{" "}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ---------------- outro ---------------- */

const Outro: React.FC<{ theme: Theme; logo?: string }> = ({ theme, logo }) => {
  const a = useSpring(2, 12);
  const b = useSpring(10);
  const c = useSpring(18);
  const d = useSpring(26, 11);
  const parts = theme.tagline.split(",").map((x) => x.trim()).filter(Boolean);
  const t1 = parts.length > 1 ? parts[0] + "." : theme.tagline;
  const t2 = parts.length > 1 ? parts.slice(1).join(", ") : "";
  return (
    <AbsoluteFill style={{ background: theme.colors.outroBg, alignItems: "center", justifyContent: "center", gap: 54, padding: `0 ${X}px`, fontFamily: fontFamily(theme) }}>
      <div style={{ transform: `scale(${0.8 + a * 0.2})`, opacity: a }}>
        {logo ? (
          <Img src={staticFile(logo)} style={{ maxWidth: 720, maxHeight: 240, objectFit: "contain" }} />
        ) : (
          <div style={{ fontWeight: 800, fontSize: 110, letterSpacing: "-0.03em", color: theme.colors.outroText, textAlign: "center" }}>{theme.channelName}</div>
        )}
      </div>
      <div style={{ fontWeight: 800, fontSize: 46, lineHeight: 1.2, letterSpacing: "0.01em", textTransform: "uppercase", color: theme.colors.outroText, textAlign: "center", maxWidth: 880, opacity: b, transform: `translateY(${(1 - b) * 30}px)` }}>
        {theme.outroTeaser}
      </div>
      <div style={{ border: `3px solid ${theme.colors.outroText}`, color: theme.colors.outroText, fontWeight: 800, fontSize: 34, letterSpacing: "0.04em", textTransform: "uppercase", padding: "14px 30px", borderRadius: 999, opacity: c, transform: `scale(${0.9 + c * 0.1})` }}>
        {theme.outroFollow}
      </div>
      {t1 ? (
        <div style={{ background: theme.colors.accent, color: theme.colors.bg, fontWeight: 800, fontSize: 72, lineHeight: 1.05, textTransform: "uppercase", padding: "30px 46px", borderRadius: 28, textAlign: "center", transform: `scale(${d}) rotate(${(1 - d) * -4}deg)` }}>
          <div>{t1}</div>
          {t2 ? <div>{t2}</div> : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ---------------- komposisi ---------------- */

const transitionFor = (i: number) => {
  const d = [slide({ direction: "from-right" }), wipe({ direction: "from-left" }), slide({ direction: "from-bottom" }), wipe({ direction: "from-top-right" })];
  return d[i % d.length] as any;
};

export const sceneFrames = (s: Scene, fps: number) => Math.max(1, Math.ceil((s.durationSec || 3) * fps));

export const KodeKepoVideo: React.FC<VideoProps> = ({ scenes, cues, characters, theme, episode, hookTitle, hookKeyword, logo, bgm, products, affiliateCta, looks, videoTitle }) => {
  const anim = isAnimLayout(layoutOf(theme));
  const soft = layoutOf(theme) === "horor" || layoutOf(theme) === "motivasi";
  useFonts();
  const { fps } = useVideoConfig();
  const outro = Math.round(OUTRO_SEC * fps);
  const talk = scenes.reduce((n, s) => n + sceneFrames(s, fps), 0);
  const starts: number[] = [];
  scenes.reduce((acc, s) => (starts.push(acc), acc + sceneFrames(s, fps)), 0);
  // SFX "pop" tiap item kartu muncul (langkah, bubble chat, notifikasi)
  const pops: number[] = [];
  scenes.forEach((s, i) => {
    if (s.visual.kind === "steps" || s.visual.kind === "chat" || s.visual.kind === "proscons") itemDelays(s, fps, s.visual.items.length).forEach((d) => pops.push(starts[i] + d));
    if (s.visual.kind === "notification") pops.push(starts[i] + 6);
  });
  return (
    <AbsoluteFill style={{ background: theme.colors.bg }}>
      {/* Tiap visual diperpanjang sepanjang transisi supaya awal scene tetap pas dengan awal suaranya. */}
      <TransitionSeries>
        {scenes.flatMap((s, i) => [
          <TransitionSeries.Sequence key={s.id} durationInFrames={sceneFrames(s, fps) + TRANSITION}>
            <SceneView scene={s} index={i} total={scenes.length} theme={theme} products={products} cta={i === scenes.length - 1 ? affiliateCta : undefined} looks={looks} videoTitle={videoTitle || hookTitle} episode={episode} />
          </TransitionSeries.Sequence>,
          <TransitionSeries.Transition key={s.id + "-t"} presentation={i === scenes.length - 1 || soft ? fade() : transitionFor(i)} timing={linearTiming({ durationInFrames: TRANSITION })} />,
        ])}
        <TransitionSeries.Sequence durationInFrames={outro}>
          <Outro theme={theme} logo={logo} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {hookTitle && !anim ? (
        <Sequence durationInFrames={HOOK}>
          <Hook title={hookTitle} keyword={hookKeyword} theme={theme} episode={episode} tag={scenes[0]?.tag} />
        </Sequence>
      ) : null}

      <Sequence durationInFrames={talk}>
        {theme.showHeader ? <Header theme={theme} scenes={scenes} episode={episode} total={talk} /> : null}
        <Subtitles cues={cues} scenes={scenes} theme={theme} characters={characters} />
      </Sequence>

      {scenes.map((s, i) =>
        s.audio ? (
          <Sequence key={s.id + "-a"} from={starts[i]} durationInFrames={sceneFrames(s, fps)}>
            <Audio src={staticFile(s.audio)} />
          </Sequence>
        ) : null,
      )}
      {[...starts.slice(1), talk].map((f, i) => (
        <Sequence key={"w" + i} from={Math.max(0, f - 6)} durationInFrames={20}>
          <Audio src={staticFile("audio/whoosh.wav")} volume={0.32} />
        </Sequence>
      ))}
      {pops.map((f, i) => (
        <Sequence key={"p" + i} from={f} durationInFrames={8}>
          <Audio src={staticFile("audio/pop.wav")} volume={0.35} />
        </Sequence>
      ))}
      {/* musik pelan selama dialog, naik di outro */}
      {bgm ? (
        <Audio
          src={staticFile(bgm)}
          loop
          volume={(f) => (f < talk ? theme.bgmVolume : interpolate(f, [talk, talk + 10], [theme.bgmVolume, Math.min(0.45, theme.bgmVolume * 3.2)], { extrapolateRight: "clamp" }))}
        />
      ) : null}
    </AbsoluteFill>
  );
};
