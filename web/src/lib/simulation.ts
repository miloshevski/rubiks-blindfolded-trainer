import { ABSOLUTE_LETTERS, CUBIES } from './cube';
import { FACES, type CubeView, type Face, type FaceStrings } from './types';
type Vector = [number, number, number];
const NORMAL: Record<Face, Vector> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  R: [1, 0, 0],
  L: [-1, 0, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};
const rotate = (v: Vector, face: string): Vector => {
  const [x, y, z] = v;
  switch (face) {
    case 'U':
      return [-z, y, x];
    case 'D':
      return [z, y, -x];
    case 'R':
      return [x, z, -y];
    case 'L':
    case 'M':
      return [x, -z, y];
    case 'F':
      return [y, -x, z];
    default:
      return [-y, x, z];
  }
};
const layer = (v: Vector, f: string) =>
  f === 'M'
    ? v[0] === 0
    : f === 'R'
      ? v[0] === 1
      : f === 'L'
        ? v[0] === -1
        : f === 'U'
          ? v[1] === 1
          : f === 'D'
            ? v[1] === -1
            : f === 'F'
              ? v[2] === 1
              : v[2] === -1;
const cell = (face: Face, [x, y, z]: Vector) =>
  face === 'U'
    ? (1 + z) * 3 + 1 + x
    : face === 'D'
      ? (1 - z) * 3 + 1 + x
      : face === 'F'
        ? (1 - y) * 3 + 1 + x
        : face === 'B'
          ? (1 - y) * 3 + 1 - x
          : face === 'R'
            ? (1 - y) * 3 + 1 - z
            : (1 - y) * 3 + 1 + z;
export function simulate(algorithm: string): CubeView & { identity: string } {
  const stickers = CUBIES.flatMap((c) =>
    Object.entries(c.stickers).map(([face, i]) => ({
      pos: [c.x, c.y, c.z] as Vector,
      normal: NORMAL[face as Face],
      home: `${face}${i}`,
      color: face,
      letter: ABSOLUTE_LETTERS[face as Face][i!],
    })),
  );
  for (const move of algorithm.trim().split(/\s+/).filter(Boolean)) {
    if (!/^[URFDLBM](2|')?$/.test(move))
      throw new Error(`Invalid move: ${move}. Use U R F D L B M, with ' or 2.`);
    for (let n = 0; n < (move.endsWith('2') ? 2 : move.endsWith("'") ? 3 : 1); n++)
      for (const s of stickers)
        if (layer(s.pos, move[0])) {
          s.pos = rotate(s.pos, move[0]);
          s.normal = rotate(s.normal, move[0]);
        }
  }
  const colors = Object.fromEntries(FACES.map((f) => [f, Array<string>(9)])) as Record<
    Face,
    string[]
  >;
  const letters = Object.fromEntries(FACES.map((f) => [f, Array<string>(9)])) as Record<
    Face,
    string[]
  >;
  const ids = Object.fromEntries(FACES.map((f) => [f, Array<string>(9)])) as Record<Face, string[]>;
  for (const s of stickers) {
    const face = FACES.find((f) => NORMAL[f].every((v, i) => v === s.normal[i]))!;
    const i = cell(face, s.pos);
    colors[face][i] = s.color;
    letters[face][i] = s.letter;
    ids[face][i] = s.home;
  }
  return {
    facelets: Object.fromEntries(FACES.map((f) => [f, colors[f].join('')])) as FaceStrings,
    letters: Object.fromEntries(FACES.map((f) => [f, letters[f].join('')])) as FaceStrings,
    identity: FACES.map((f) => ids[f].join(',')).join(';'),
  };
}
// A separate worker bundle keeps cubing's nested module workers independent of React's runtime.
let worker: Worker | null = null;
let requestId = 0;
const requests = new Map<number, { resolve: (s: string) => void; reject: (e: Error) => void }>();
export function randomStateScramble(): Promise<string> {
  if (!worker) {
    worker = new Worker(new URL('./scrambler.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = ({
      data,
    }: MessageEvent<{ id: number; scramble: string; error?: string }>) => {
      const pending = requests.get(data.id);
      if (!pending) return;
      requests.delete(data.id);
      if (data.error) pending.reject(new Error(data.error));
      else pending.resolve(data.scramble);
    };
    worker.onerror = () => {
      for (const pending of requests.values())
        pending.reject(new Error('Scramble worker failed. Retry generating the scramble.'));
      requests.clear();
      worker?.terminate();
      worker = null;
    };
  }
  const key = ++requestId;
  return new Promise((resolve, reject) => {
    requests.set(key, { resolve, reject });
    worker!.postMessage(key);
  });
}
