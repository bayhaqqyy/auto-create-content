"use client";
import { useMemo } from "react";
import { Thumbnail } from "@remotion/player";
import { KodeKepoVideo, OUTRO_SEC, type VideoProps } from "../remotion/KodeKepoVideo";
import { isAnimLayout, LOOK_PRESETS } from "../lib/anim";
import type { AnimDirection, Channel, Layout, Look2D, Scene } from "../lib/types";

const FPS = 30;
const SCENE_SEC = 3;

/** Isi contoh netral per style: bukan topik tertentu, hanya menunjukkan bentuk tampilannya. */
const GENERIC: Record<Layout, { title: string; screen: string; anim?: AnimDirection; items?: string[]; kind?: Scene["visual"]["kind"] }> = {
  kartu: { title: "Judul video di sini", screen: "JUDUL BAB|BARIS KEDUA", kind: "steps", items: ["Poin pertama", "Poin kedua", "Poin ketiga"] },
  layar: { title: "Judul video di sini", screen: "JUDUL BAB|BARIS KEDUA", kind: "steps", items: ["Buka Pengaturan", "Pilih menu", "Aktifkan fitur"] },
  teks: { title: "Judul video di sini", screen: "KALIMAT BESAR|DI TENGAH", kind: "statement" },
  horor: {
    title: "Judul Serial", screen: "JUDUL|EPISODE",
    anim: { set: "jalan", cast: [{ who: "pemuda", pose: "peluk", mood: "kaget" }, { who: "pemudi-hijab", pose: "tunjuk", mood: "cemas" }], event: "lampu-merah", camera: "diam", stamp: "HARI | 00.00 | TEMPAT" },
  },
  stickman: { title: "Judul video", screen: "JUDUL VIDEO|DI SINI", anim: { set: "kamar", cast: [{ who: "pemuda", pose: "kaget", mood: "kaget" }], event: "tidak-ada", camera: "diam" } },
  motivasi: { title: "Kalimat penyemangat", screen: "KALIMAT|PENYEMANGAT", anim: { set: "puncak", cast: [{ who: "pemuda", pose: "sorak", mood: "siluet" }], event: "matahari", camera: "diam" } },
};

export function genericProps(ch: Channel, layout: Layout, looks?: Record<string, Look2D>): VideoProps {
  const g = GENERIC[layout] || GENERIC.kartu;
  const scene: Scene = {
    id: "g1", speaker: "narator", tag: "CONTOH", text: "Subtitle contoh dengan kata kunci", screenText: g.screen, keyword: "kunci",
    visual: { kind: g.kind || "statement", items: g.items || [], icon: "question" }, prompt: "", durationSec: SCENE_SEC, anim: g.anim,
  };
  return {
    scenes: [scene],
    cues: [{ start: 0, end: SCENE_SEC, text: "Subtitle contoh dengan kata kunci", keyword: "kunci" }],
    characters: [{ id: "narator", name: "", color: ch.colors.accent, textColor: ch.colors.bg }],
    theme: {
      headerText: ch.headerText, tagline: ch.tagline, outroTeaser: ch.outroTeaser, outroFollow: ch.outroFollow, channelName: ch.name,
      colors: ch.colors, grid: ch.grid, bgmVolume: 0, font: ch.font, layout, showHeader: !!ch.showHeader,
    },
    episode: "EP.01",
    hookTitle: g.title,
    hookKeyword: "",
    looks: isAnimLayout(layout) ? { ...LOOK_PRESETS, ...(looks || {}) } : undefined,
    videoTitle: g.title,
  };
}

/** Satu frame contoh (seperti cover) dari sebuah style, berwarna sesuai brand kit channel. */
export function StyleCover({ ch, layout, looks, width = 120, outro = false }: { ch: Channel; layout: Layout; looks?: Record<string, Look2D>; width?: number; outro?: boolean }) {
  const props = useMemo(() => genericProps(ch, layout, looks), [ch, layout, looks]);
  const frames = SCENE_SEC * FPS + Math.round(OUTRO_SEC * FPS);
  // tunggu judul & isi scene muncul (style kartu: lewati kartu judul pembuka supaya bentuk tiap style terlihat)
  const frame = outro ? frames - 2 : isAnimLayout(layout) ? 45 : 75;
  return (
    <Thumbnail
      component={KodeKepoVideo as any}
      inputProps={props}
      compositionWidth={1080}
      compositionHeight={1920}
      frameToDisplay={frame}
      durationInFrames={frames}
      fps={FPS}
      style={{ width, height: (width * 16) / 9, borderRadius: Math.round(width / 12), overflow: "hidden", display: "block" }}
    />
  );
}
