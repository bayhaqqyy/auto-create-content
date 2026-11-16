import type { Channel } from "../lib/types";

/** Pratinjau mini satu frame video dan outro, memakai warna & teks brand kit. Skala 1:4 dari 1080×1920. */
export function BrandPreview({ ch, logoUrl }: { ch: Channel; logoUrl?: string }) {
  const c = ch.colors;
  const font = ch.font === "archivo" ? "Archivo, sans-serif" : '"Plus Jakarta Sans", sans-serif';
  const grid = ch.grid
    ? { backgroundImage: `linear-gradient(${c.text}12 1px, transparent 1px), linear-gradient(90deg, ${c.text}12 1px, transparent 1px)`, backgroundSize: "15px 15px" }
    : {};
  const [t1, t2] = ch.tagline.includes(",") ? [ch.tagline.split(",")[0] + ".", ch.tagline.split(",").slice(1).join(",").trim()] : [ch.tagline, ""];
  return (
    <div className="row" style={{ gap: 14, alignItems: "flex-start" }} aria-label="Pratinjau tampilan video">
      <div className="preview-phone" style={{ background: c.bg, ...grid, fontFamily: font, color: c.text }}>
        <div style={{ position: "absolute", top: 18, left: 18, right: 18, display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 800 }}>
          <span>{ch.headerText}</span>
          <span style={{ color: c.muted }}>EP.001 / 01–06</span>
        </div>
        <div style={{ position: "absolute", top: 34, left: 18, right: 18, height: 2, background: `${c.text}24` }}>
          <div style={{ width: "35%", height: 2, background: c.accent }} />
        </div>
        <div style={{ position: "absolute", top: 50, left: 18, right: 18 }}>
          <span style={{ display: "inline-block", background: c.accent, color: c.bg, fontSize: 7, fontWeight: 800, padding: "3px 7px", borderRadius: 99 }}>CARA KERJA</span>
          <div style={{ fontSize: 23, fontWeight: 800, lineHeight: 1.02, marginTop: 6, textTransform: "uppercase" }}>
            Judul bab
            <br />
            <span style={{ color: c.accent }}>baris kedua</span>
          </div>
        </div>
        <div style={{ position: "absolute", top: 150, left: 18, right: 18, background: c.card, border: `1px solid ${c.text}1f`, borderRadius: 8, padding: 9, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ width: 22, height: 22, borderRadius: 11, background: `${c.accent}29`, flex: "none" }} />
          <span style={{ fontSize: 11, fontWeight: 800 }}>Kartu info</span>
          <span style={{ marginLeft: "auto", background: c.accent2, color: c.bg, fontSize: 6, fontWeight: 800, padding: "3px 6px", borderRadius: 99 }}>PILL</span>
        </div>
        <div style={{ position: "absolute", bottom: 100, left: 18, right: 35, background: `${c.bg}dd`, border: `1px solid ${c.text}1a`, borderRadius: 7, padding: "6px 8px" }}>
          <span style={{ display: "inline-block", background: c.accent, color: c.bg, fontSize: 6, fontWeight: 800, padding: "2px 5px", borderRadius: 99 }}>KARAKTER</span>
          <div style={{ fontSize: 12, fontWeight: 800, marginTop: 3 }}>
            Subtitle dengan <span style={{ color: c.accent }}>kata kunci</span> <span style={{ opacity: 0.35 }}>berikutnya</span>
          </div>
        </div>
      </div>
      <div className="preview-phone" style={{ background: c.outroBg, color: c.outroText, fontFamily: font, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 16, textAlign: "center" }}>
        {logoUrl ? <img src={logoUrl} alt="Logo channel" style={{ maxWidth: 170, maxHeight: 60, objectFit: "contain" }} /> : <div style={{ fontSize: 26, fontWeight: 800 }}>{ch.name}</div>}
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>{ch.outroTeaser}</div>
        <div style={{ border: `1.5px solid ${c.outroText}`, fontSize: 8, fontWeight: 800, padding: "4px 8px", borderRadius: 99, textTransform: "uppercase" }}>{ch.outroFollow}</div>
        {t1 ? (
          <div style={{ background: c.accent, color: c.bg, fontSize: 17, fontWeight: 800, padding: "8px 12px", borderRadius: 8, textTransform: "uppercase", lineHeight: 1.05 }}>
            {t1}
            {t2 ? <div>{t2}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
