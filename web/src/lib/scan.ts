import type { Grid } from './paint';
import { FACES, type Face } from './types';

// Scanning a cube with the camera. Each face is photographed once; the colour read from its nine
// squares is matched to the nearest of the six centre stickers (the centres are all different and
// never move), so the cube's own lighting is the reference. No thresholds, no learning.

export type Rgb = readonly [number, number, number];

/** The faces in the order they are shown to the camera, and how to hold the cube for each. */
export const SCAN_ORDER: readonly { face: Face; hold: string }[] = [
  { face: 'F', hold: 'Green centre facing you, white centre on top.' },
  { face: 'R', hold: 'Red centre facing you, white centre on top.' },
  { face: 'B', hold: 'Blue centre facing you, white centre on top.' },
  { face: 'L', hold: 'Orange centre facing you, white centre on top.' },
  { face: 'U', hold: 'White centre facing you, blue centre on top.' },
  { face: 'D', hold: 'Yellow centre facing you, green centre on top.' },
];

/** Where the nine squares sit inside the square camera view, as fractions of its side. */
export const SCAN_FRAME = { start: 0.15, size: 0.7 };
export const squareCentre = (n: number) => SCAN_FRAME.start + (n + 0.5) * (SCAN_FRAME.size / 3);

const distance = (a: Rgb, b: Rgb) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

/** Average colour of RGBA pixel data (the alpha channel is ignored). */
export function averageRgb(data: ArrayLike<number>): Rgb {
  let r = 0, g = 0, b = 0;
  const n = Math.floor(data.length / 4);
  for (let i = 0; i < n; i++) { r += data[i * 4]; g += data[i * 4 + 1]; b += data[i * 4 + 2]; }
  return n ? [r / n, g / n, b / n] : [0, 0, 0];
}

/** The colour of a face's nine squares, each matched to the nearest centre. The centres stay as they are. */
export function classifyScan(samples: Record<Face, Rgb[]>): Grid {
  const centres = FACES.map(f => [f, samples[f][4]] as const);
  const grid = {} as Grid;
  for (const face of FACES) {
    grid[face] = samples[face].map((rgb, i) => {
      if (i === 4) return face;
      let best = centres[0][0], bestD = Infinity;
      for (const [f, c] of centres) {
        const d = distance(rgb, c);
        if (d < bestD) { best = f; bestD = d; }
      }
      return best;
    });
  }
  return grid;
}
