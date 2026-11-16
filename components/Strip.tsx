import type { Character, TemplateScene } from "../lib/types";

/** Mini layar 9:16 yang menunjukkan ritme scene: tinggi blok = durasi, warna = karakter. */
export function Strip({ scenes, chars, w = 56, h = 100 }: { scenes: TemplateScene[]; chars: Character[]; w?: number; h?: number }) {
  const total = scenes.reduce((n, s) => n + s.seconds, 0) || 1;
  return (
    <span className="strip" aria-hidden="true" style={{ width: w, height: h }}>
      {scenes.map((s, i) => {
        const c = chars.find((x) => x.id === s.speaker);
        const bg = c?.id === "paham" ? "#0F1928" : c?.color || "#9AA8BD";
        return <span key={i} style={{ flex: `${s.seconds / total} 1 0`, background: bg }} />;
      })}
    </span>
  );
}
