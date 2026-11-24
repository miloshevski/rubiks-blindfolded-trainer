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
  step?: number;
  label: string;
  move: string;
}

export interface CubeData extends CubeView {
  scramble: string;
  absolute_letters: FaceStrings;
  edge_memo: string;
  corner_memo: string;
  solution: string;
  verified: boolean;
  steps: SolutionStep[];
  frames: Frame[];
}

export interface CheckResult {
  correct: boolean;
  edges_correct: boolean;
  corners_correct: boolean;
  centers_correct?: boolean;
  wrong_edges?: string[];
  wrong_stickers?: string[];
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
export type AppMode = 'home' | 'learn' | 'practice' | 'timer' | 'stats' | 'settings' | 'solve' | 'drill' | 'algs' | 'pairs';

export interface SolutionStep {
  phase: 'edges' | 'parity' | 'corners'; memo_target: string | null; execution_target: string | null;
  cycle_break: boolean; algorithm: string; setup: string; start: number; buffer_sticker: string | null; target_sticker: string | null;
}
