import { SPEFFZ_LETTERS } from './cube';
import type { Face, FaceStrings } from './types';

export type StickerSet = 'edges' | 'corners' | 'both';

export interface DrillTarget {
  face: Face;
  i: number;
  kind: 'edge' | 'corner';
  letter: string;
}

/**
 * A random sticker on one of `faces` (corners sit at even indexes, edges at odd; 4 is the
 * center), never the same one as `prevKey` twice in a row.
 */
export function pickTarget(faces: readonly Face[], set: StickerSet, letters: FaceStrings, prevKey: string | null) {
  const pool: DrillTarget[] = [];
  for (const face of faces) for (let i = 0; i < 9; i++) {
    if (i === 4) continue;
    const kind = i % 2 ? 'edge' : 'corner';
    if (set !== 'both' && set !== `${kind}s`) continue;
    if (`${face}${i}` !== prevKey) pool.push({ face, i, kind, letter: letters[face][i] });
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export const DRILL_LETTERS = SPEFFZ_LETTERS;
