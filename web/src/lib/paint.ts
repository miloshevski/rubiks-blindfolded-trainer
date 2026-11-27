import { FACES, type Face } from './types';

// A cube painted by hand is sent as a "scramble" "~" + 54 colours: nine per face in the order
// U R F D L B, each face in reading order. bld/paint.py turns it back into a cube.
export const PAINT_PREFIX = '~';

/** Colour of each sticker of each face; '' is not painted yet. */
export type Grid = Record<Face, (Face | '')[]>;

export const isPainted = (scramble: string) => scramble.trim().startsWith(PAINT_PREFIX);

/** What to show for a scramble that is a painted cube. */
export const scrambleLabel = (scramble: string) => (isPainted(scramble) ? 'Painted cube' : scramble);

/** Nothing painted but the centres, which never move. */
export function blankGrid(): Grid {
  return Object.fromEntries(FACES.map(f => [f, Array.from({ length: 9 }, (_, i) => (i === 4 ? f : ''))])) as Grid;
}

export function solvedGrid(): Grid {
  return Object.fromEntries(FACES.map(f => [f, Array<Face>(9).fill(f)])) as Grid;
}

export function gridFromFacelets(facelets: Record<Face, string>): Grid {
  return Object.fromEntries(FACES.map(f => [f, [...facelets[f]] as Face[]])) as Grid;
}

/** The "~…" scramble of a completely painted grid, or null while stickers are missing. */
export function paintedScramble(grid: Grid): string | null {
  const text = FACES.map(f => grid[f].join('')).join('');
  return text.length === 54 ? PAINT_PREFIX + text : null;
}

/** How many stickers of each colour are painted. */
export function colourCounts(grid: Grid): Record<Face, number> {
  const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 } as Record<Face, number>;
  for (const f of FACES) for (const c of grid[f]) if (c) counts[c]++;
  return counts;
}
