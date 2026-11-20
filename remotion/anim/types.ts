import type { AnimDirection, Look2D } from "../../lib/types";

export type AnimInput = {
  /** detik sejak scene mulai */
  t: number;
  /** panjang scene (detik) */
  dur: number;
  anim: AnimDirection;
  index: number;
  total: number;
  /** tampilan tokoh per id (karakter channel atau preset) */
  looks: Record<string, Look2D>;
  /** judul video (baris atas, tetap) */
  title: string;
  /** judul scene "BARIS 1|BARIS 2" */
  screenText: string;
  episode?: string;
  /** kotak voting di scene terakhir */
  vote?: { title: string; options: string[] } | null;
};
