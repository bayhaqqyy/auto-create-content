import React from "react";
import { Composition } from "remotion";
import { KodeKepoVideo, OUTRO_SEC, sceneFrames, type VideoProps } from "./KodeKepoVideo";
import { DEFAULT_CHANNELS } from "../lib/defaults";
import { ProductAd, END_SEC, adSceneFrames, type AdProps } from "./ProductAd";

export const FPS = 30;
const ch = DEFAULT_CHANNELS[0];

const sample: VideoProps = {
  scenes: [
    { id: "s1", speaker: "kepo", text: "Ada kurir minta kode OTP, kasih aja kan?", screenText: "Kurir minta OTP?", keyword: "OTP", visual: { kind: "question", items: [], icon: "package" }, prompt: "", durationSec: 3 },
    { id: "s2", speaker: "paham", text: "Langsung ganti password dan hubungi nomor resmi.", screenText: "Amankan akun", keyword: "akun", visual: { kind: "steps", items: ["Ganti password", "Logout semua perangkat", "Telepon nomor resmi"], icon: "shield" }, prompt: "", durationSec: 4 },
  ],
  cues: [
    { start: 0, end: 1.5, text: "Ada kurir minta kode OTP,", keyword: "OTP" },
    { start: 1.5, end: 3, text: "kasih aja kan?" },
    { start: 3, end: 5, text: "Langsung ganti password dan" },
    { start: 5, end: 7, text: "hubungi nomor resmi." },
  ],
  characters: [
    { id: "kepo", name: "KEPO", color: "#A4FF19", textColor: "#0F1928" },
    { id: "paham", name: "PAHAM", color: "#F6F8FC", textColor: "#0F1928" },
  ],
  theme: { headerText: ch.headerText, tagline: ch.tagline, outroTeaser: ch.outroTeaser, outroFollow: ch.outroFollow, channelName: ch.name, colors: ch.colors, grid: ch.grid, bgmVolume: ch.bgmVolume, font: ch.font },
  episode: "EP.026",
  hookTitle: "Jangan kasih OTP lo!",
  hookKeyword: "OTP",
};

const adSample: AdProps = {
  scenes: sample.scenes,
  cues: sample.cues,
  hook: "Kenapa nggak dari dulu?",
  product: { name: "Contoh produk", price: "", photos: [] },
  cta: "Cek keranjang kuning",
  accent: "#FFE14D",
  font: "jakarta",
  ambient: false,
};

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="ProductAd"
    component={ProductAd}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={FPS * 10}
    defaultProps={adSample}
    calculateMetadata={({ props }) => ({
      durationInFrames: props.scenes.reduce((n, s) => n + adSceneFrames(s, FPS), 0) + Math.round(END_SEC * FPS),
    })}
  />
  <Composition
    id="KodeKepoVideo"
    component={KodeKepoVideo}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={FPS * 10}
    defaultProps={sample}
    calculateMetadata={({ props }) => {
      const talk = props.scenes.reduce((n, s) => n + sceneFrames(s, FPS), 0);
      return { durationInFrames: talk + Math.round(OUTRO_SEC * FPS) };
    }}
  />

  </>
);
