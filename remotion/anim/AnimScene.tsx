import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import type { AnimLayout, Look2D, Scene } from "../../lib/types";
import { cleanAnim } from "../../lib/anim";
import { W, H } from "./kit";
import { drawHoror } from "./horor";
import { drawStick } from "./stick";
import { drawSiluet } from "./siluet";

export type AnimSceneProps = {
  scene: Scene;
  index: number;
  total: number;
  layout: AnimLayout;
  looks: Record<string, Look2D>;
  title: string;
  episode?: string;
};

/** Satu scene animasi: digambar ulang di kanvas tiap frame dari arahan scene.anim (fungsi murni dari waktu). */
export const AnimScene: React.FC<AnimSceneProps> = ({ scene, index, total, layout, looks, title, episode }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  // kanvas tidak ikut berubah saat font selesai dimuat, jadi tunggu font dulu lalu gambar ulang (penting untuk frame pertama/cover)
  const [fontsReady, setFontsReady] = useState(false);
  const [handle] = useState(() => delayRender("font animasi"));
  useEffect(() => {
    const want = ['400 80px "Anton"', '400 80px "Bungee"', '800 40px "Plus Jakarta Sans"', '700 40px "Plus Jakarta Sans"'];
    const wait = (tries: number): Promise<unknown> =>
      Promise.all(want.map((f) => document.fonts.load(f))).then(() =>
        want.every((f) => document.fonts.check(f)) || tries <= 0 ? null : new Promise((r) => setTimeout(r, 100)).then(() => wait(tries - 1)),
      );
    wait(50).catch(() => null).then(() => {
      setFontsReady(true);
      continueRender(handle);
    });
  }, [handle]);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const dur = Math.max(1, scene.durationSec || 4);
  const anim = cleanAnim(scene.anim, layout, Object.keys(looks));
  const last = index === total - 1;
  const vote = layout === "horor" && last && scene.visual.items.length >= 2 ? { title: scene.screenText.replace("|", " "), options: scene.visual.items.slice(0, 3) } : null;
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const inp = { t, dur, anim, index, total, looks, title, screenText: scene.screenText, episode, vote };
    if (layout === "horor") drawHoror(ctx, inp);
    else if (layout === "stickman") drawStick(ctx, inp);
    else drawSiluet(ctx, inp);
  }, [t, fontsReady, scene, layout, looks, title, episode, index, total]);
  return (
    <AbsoluteFill>
      <canvas ref={ref} width={W} height={H} style={{ width: "100%", height: "100%" }} />
    </AbsoluteFill>
  );
};
