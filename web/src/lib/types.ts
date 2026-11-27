// Shapes of the data sent by the Python server (bld/api.py).

export const FACES = ['U', 'R', 'F', 'D', 'L', 'B'] as const;
export type Face = (typeof FACES)[number];
export type FaceStrings = Record<Face, string>;

/** One cube state: a 9-character color string and a 9-character letter string per face. */
export interface CubeView {
  facelets: FaceStrings;
  letters: FaceStrings | null;
}

/** The cube after one move of a solution. `label` is e.g. "Edges S", "Parity", "Corners D". */
export interface Frame extends CubeView {
  label: string;
  move: string;
}

/** One cycle of a memo: how many letters it spans, and what kind it is (a "flip" is a piece solved in place but flipped or twisted). */
export interface MemoCycle {
  size: number;
  kind: 'buffer' | 'cycle' | 'flip';
}

export interface CubeData extends CubeView {
  scramble: string;
  absolute_letters: FaceStrings;
  edge_memo: string;
  corner_memo: string;
  edge_cycles: MemoCycle[];
  corner_cycles: MemoCycle[];
  solution: string;
  verified: boolean;
  frames: Frame[];
}

/** One target's algorithm played on a solved cube (the tutorial's animation). */
export interface DemoData {
  kind: 'edge' | 'corner';
  letter: string;
  sticker: string;
  /** `phase` is setup / swap / undo, or (a whole scramble's execution) "Edges B" etc. */
  parts: { phase: string; alg: string }[];
  /** Only for a scramble's execution: the memo letters and its cycles. */
  targets?: string[];
  groups?: { size: number; kind: string }[];
  buffers: string[];
  /** Where the buffer stickers and the target sticker are: face, cell 0-8 of that face. */
  marks: { face: Face; index: number; role: 'buffer' | 'target'; letter: string }[];
  start: CubeView;
  absolute_letters: FaceStrings;
  /** One per move; `label` is the phase the move belongs to. */
  frames: Frame[];
}

export interface CheckResult {
  correct: boolean;
  edges_correct: boolean;
  corners_correct: boolean;
  centers_correct?: boolean;
  wrong_edges?: string[];
  wrong_corners?: string[];
  note?: string;
  edges: string;
  corners: string;
  frames: Frame[];
}

export interface AlgRow {
  letter: string;
  sticker: string;
  setup: string;
  core: string;
  undo: string;
  alg: string;
  buffer?: boolean;
  special?: boolean;
  opposite?: string | null;
}

export interface AlgData {
  edges: AlgRow[];
  corners: AlgRow[];
  parity: { number: number; alg: string }[];
  default_parity: number;
}

export type ParityAlg = '1' | '2';
export type LetterMode = 'off' | 'absolute' | 'relative';
export type AppMode = 'solve' | 'drill' | 'algs' | 'pairs' | 'timer' | 'home' | 'tutorial';
