"use client";
import { useMemo } from "react";
import { Player } from "@remotion/player";
import { KodeKepoVideo, OUTRO_SEC, sceneFrames, type VideoProps } from "../remotion/KodeKepoVideo";
import { demoScript } from "../lib/script";
import { isAnimLayout, LOOK_PRESETS } from "../lib/anim";
import type { Channel, Layout, Look2D } from "../lib/types";

const FPS = 30;

/**
 * Pratinjau hidup (dirender di browser dengan komposisi video yang sama seperti hasil akhir):
 * tiga scene contoh dari style yang dipilih, lalu outro channel. Tanpa suara.
 */
export function StylePreview({ ch, layout, logoUrl, looks, width = 270 }: { ch: Channel; layout?: Layout; logoUrl?: string; looks?: Record<string, Look2D>; width?: number }) {
  const lay = layout || ch.layout || "kartu";
  const props = useMemo<VideoProps>(() => {
    const demo = demoScript(ch.id, lay);
    // tiga scene khas tiap style supaya pratinjau singkat tapi mewakili
    const pick = isAnimLayout(lay) ? (lay === "horor" ? [0, 2, 5] : lay === "motivasi" ? [0, 3, 4] : [0, 2, 3]) : [0, 1, 2];
    const scenes = pick.map((i) => demo.scenes[Math.min(i, demo.scenes.length - 1)]).map((s, i) => ({ ...s, id: `p${i}`, durationSec: 3.2 }));
    let t = 0;
    const cues = scenes.flatMap((s) => {
      const words = s.text.split(/\s+/);
      const half = Math.ceil(words.length / 2);
      const out = [
        { start: t, end: t + 1.6, text: words.slice(0, half).join(" "), keyword: s.keyword },
        { start: t + 1.6, end: t + 3.2, text: words.slice(half).join(" "), keyword: s.keyword },
      ];
      t += 3.2;
      return out;
    });
    const speakers = [...new Set(scenes.map((s) => s.speaker))];
    return {
      scenes,
      cues,
      characters: speakers.map((id, i) => ({ id, name: id === "narator" || id === "pencerita" ? "" : id.toUpperCase(), color: i ? ch.colors.accent2 : ch.colors.accent, textColor: ch.colors.bg })),
      theme: {
        headerText: ch.headerText, tagline: ch.tagline, outroTeaser: ch.outroTeaser, outroFollow: ch.outroFollow, channelName: ch.name,
        colors: ch.colors, grid: ch.grid, bgmVolume: 0, font: ch.font, layout: lay, showHeader: !!ch.showHeader,
      },
      episode: "EP.01",
      hookTitle: demo.coverText,
      hookKeyword: demo.coverKeyword,
      logo: undefined,
      looks: isAnimLayout(lay) ? { ...LOOK_PRESETS, ...(looks || {}) } : undefined,
      videoTitle: demo.title,
    };
  }, [ch, lay, looks]);
  const frames = props.scenes.reduce((n, s) => n + sceneFrames(s, FPS), 0) + Math.round(OUTRO_SEC * FPS);
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div style={{ width, borderRadius: 22, overflow: "hidden", background: "#000", boxShadow: "0 10px 30px rgba(15,25,40,0.18)" }}>
        <Player
          component={KodeKepoVideo as any}
          inputProps={props}
          durationInFrames={frames}
          compositionWidth={1080}
          compositionHeight={1920}
          fps={FPS}
          style={{ width, height: (width * 16) / 9 }}
          autoPlay
          loop
          controls
          initiallyMuted
          acknowledgeRemotionLicense
        />
      </div>
      <span className="muted small">Contoh isi tanpa suara. Warna, style, dan outro mengikuti brand kit.</span>
    </div>
  );
}
