"use client";
import { StyleCover } from "./StyleCover";
import type { Channel, Layout, Look2D } from "../lib/types";

/** Pratinjau brand kit: contoh frame (seperti cover) dari style bawaan dan outro channel, isi contohnya netral. */
export function StylePreview({ ch, layout, looks, width = 200 }: { ch: Channel; layout?: Layout; logoUrl?: string; looks?: Record<string, Look2D>; width?: number }) {
  const lay = layout || ch.layout || "kartu";
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row" style={{ gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <StyleCover ch={ch} layout={lay} looks={looks} width={width} />
        <StyleCover ch={ch} layout={lay} looks={looks} width={width} outro />
      </div>
      <span className="muted small">Isi contoh netral. Style, warna, dan outro mengikuti brand kit.</span>
    </div>
  );
}
