import { FACES, type CubeView, type Face, type FaceStrings, type LetterMode } from './types';

// 3D cube: 26 cubies at (x, y, z) in {-1, 0, 1}; y is up, z is towards the front.
const FACE_AXIS: Record<Face, ['x' | 'y' | 'z', 1 | -1]> = {
  U: ['y', 1], D: ['y', -1], R: ['x', 1], L: ['x', -1], F: ['z', 1], B: ['z', -1],
};

// Sticker index (row * 3 + col) inside a face string, same layout as bld/render.py.
const CELL: Record<Face, (x: number, y: number, z: number) => number> = {
  U: (x, _y, z) => (1 + z) * 3 + (1 + x), D: (x, _y, z) => (1 - z) * 3 + (1 + x),
  F: (x, y) => (1 - y) * 3 + (1 + x), B: (x, y) => (1 - y) * 3 + (1 - x),
  R: (_x, y, z) => (1 - y) * 3 + (1 - z), L: (_x, y, z) => (1 - y) * 3 + (1 + z),
};

/** Order of the six sides inside each cubie (every cubie has all six, black where unstickered). */
export const CUBIE_SIDES: readonly Face[] = ['U', 'D', 'F', 'B', 'R', 'L'];

export interface Cubie {
  id: string;
  x: number;
  y: number;
  z: number;
  /** Sticker index on each outward face of this cubie. */
  stickers: Partial<Record<Face, number>>;
}

export const CUBIES: readonly Cubie[] = (() => {
  const list: Cubie[] = [];
  for (const x of [-1, 0, 1]) for (const y of [-1, 0, 1]) for (const z of [-1, 0, 1]) {
    if (!x && !y && !z) continue;
    const stickers: Cubie['stickers'] = {};
    for (const face of CUBIE_SIDES) {
      const [axis, dir] = FACE_AXIS[face];
      if ({ x, y, z }[axis] === dir) stickers[face] = CELL[face](x, y, z);
    }
    list.push({ id: `${x},${y},${z}`, x, y, z, stickers });
  }
  return list;
})();

export const CUBIE_BY_ID = new Map(CUBIES.map(c => [c.id, c]));

/** Resting position of a cubie, before any layer turn. */
export const cubieTranslate = (c: Cubie) =>
  `translate3d(calc(${c.x} * var(--c)), calc(${-c.y} * var(--c)), calc(${c.z} * var(--c)))`;

/** Places each side of a cubie on its face. */
export const SIDE_TRANSFORM: Record<Face, string> = {
  F: 'translateZ(calc(var(--c) / 2))',
  B: 'rotateY(180deg) translateZ(calc(var(--c) / 2))',
  R: 'rotateY(90deg) translateZ(calc(var(--c) / 2))',
  L: 'rotateY(-90deg) translateZ(calc(var(--c) / 2))',
  U: 'rotateX(90deg) translateZ(calc(var(--c) / 2))',
  D: 'rotateX(-90deg) translateZ(calc(var(--c) / 2))',
};

// Floating face copies: same rotation as the face, pushed out, then flipped to face the cube,
// so only the faces hidden behind the cube show through (exploded-cube view).
export const GHOST_OFFSET = 2.4;   // distance from the cube center, in cubie sizes
const GHOST_ROT: Record<Face, string> = {
  F: '', B: 'rotateY(180deg)', R: 'rotateY(90deg)', L: 'rotateY(-90deg)', U: 'rotateX(90deg)', D: 'rotateX(-90deg)',
};
export const ghostTransform = (face: Face) =>
  `${GHOST_ROT[face]} translateZ(calc(${GHOST_OFFSET} * var(--c))) rotateY(180deg)`;
/** The flip mirrors columns: grid cell `slot` of a ghost shows sticker ghostSticker(slot). */
export const ghostSticker = (slot: number) => Math.floor(slot / 3) * 3 + (2 - (slot % 3));

// Layer turns. CSS axes: X right, Y down, Z towards the viewer.
const TURNS: Record<string, ['X' | 'Y' | 'Z', number, (c: Cubie) => boolean]> = {
  U: ['Y', -90, c => c.y === 1], D: ['Y', 90, c => c.y === -1],
  R: ['X', 90, c => c.x === 1], L: ['X', -90, c => c.x === -1], M: ['X', -90, c => c.x === 0],
  F: ['Z', 90, c => c.z === 1], B: ['Z', -90, c => c.z === -1],
};

/** Axis, total angle and the cubies that a move like "R", "U'" or "M2" turns. */
export function layerTurn(move: string) {
  const [axis, quarter, inLayer] = TURNS[move[0]];
  const angle = quarter * (move.endsWith('2') ? 2 : move.endsWith("'") ? -1 : 1);
  return { axis, angle, cubies: CUBIES.filter(inLayer) };
}

export const FACE_COLOR: Record<Face, string> = {
  U: 'var(--color-face-u)', D: 'var(--color-face-d)', F: 'var(--color-face-f)',
  B: 'var(--color-face-b)', R: 'var(--color-face-r)', L: 'var(--color-face-l)',
};

/** Background of sticker (face, i) in a view; undefined before the first cube has loaded. */
export const stickerColor = (view: CubeView | null, face: Face, i: number) =>
  view ? FACE_COLOR[view.facelets[face][i] as Face] : undefined;

/**
 * Sticker lettering (display only): absolute = letter of the position, relative = letter of
 * the physical sticker (sent by the server for each state). Centers have none ('.').
 */
export function stickerLetter(
  view: CubeView | null, mode: LetterMode, absolute: FaceStrings | null, face: Face, i: number,
) {
  if (!view || mode === 'off') return '';
  const src = mode === 'absolute' ? absolute : view.letters;
  const ch = src?.[face][i];
  return ch && ch !== '.' ? ch : '';
}

/** The 24 Speffz letters, in order: four per face, U L F R B D. */
export const SPEFFZ_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWX'.split('');

export const SOLVED_FACELETS = Object.fromEntries(FACES.map(f => [f, f.repeat(9)])) as FaceStrings;

/** Key of one sticker, e.g. "U3". */
export const stickerKey = (face: Face, i: number) => `${face}${i}`;
