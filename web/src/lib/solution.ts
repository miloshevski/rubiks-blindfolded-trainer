import { translate } from './local';
import type { Frame } from './types';

export const Y_PERM = "R U' R' U' R U R' F' R U R' U' R' F R";

export type Phase = 'edges' | 'parity' | 'corners';
export const PHASE_NAME: Record<Phase, string> = { edges: 'Edges', parity: 'Parity', corners: 'Corners' };

/** setup / core (the swap or Y-perm) / undo, or plain (parity and dedicated algorithms). */
export type MoveRole = 'setup' | 'core' | 'undo' | 'plain';

export interface SolutionRow {
  kind: Phase;
  letter: string;          // 'P' for parity
  exec: string | null;     // letter actually executed on an even edge target
  moves: { m: string; role: MoveRole }[];
}

export interface SolutionSection {
  kind: Phase;
  rows: SolutionRow[];
  solved: boolean;
}

const HEADERS: Record<string, Phase> = { 'Edges:': 'edges', 'Parity:': 'parity', 'Corners:': 'corners' };
const TARGET_LINE = /^([A-Z]): (.*?)(?:\s+# executed as ([A-Z]))?$/;
const Y_PERM_MOVES = Y_PERM.split(' ');

function moveRoles(kind: Phase, toks: string[]): SolutionRow['moves'] {
  if (kind === 'parity') return toks.map(m => ({ m, role: 'plain' }));
  let core: number[] = [];
  if (kind === 'edges') core = toks.flatMap((t, i) => (t === 'M2' ? [i] : []));
  else {
    for (let i = 0; i + Y_PERM_MOVES.length <= toks.length; i++)
      if (Y_PERM_MOVES.every((t, k) => toks[i + k] === t)) { core = Y_PERM_MOVES.map((_, k) => i + k); break; }
  }
  if (!core.length) return toks.map(m => ({ m, role: 'setup' }));
  const lo = Math.min(...core), hi = Math.max(...core);
  return toks.map((m, i) => ({
    m, role: i >= lo && i <= hi ? (core.includes(i) ? 'core' : 'setup') : i > hi ? 'undo' : 'setup',
  }));
}

/** Solution text (as sent by the server) → sections of rows of tokens. Display only. */
export function parseSolution(text: string): SolutionSection[] {
  const sections: SolutionSection[] = [];
  let sec: SolutionSection | null = null;
  for (const line of text.split('\n')) {
    const kind = HEADERS[line];
    if (kind) { sec = { kind, rows: [], solved: false }; sections.push(sec); continue; }
    if (!sec) continue;
    if (line === '(already solved)') { sec.solved = true; continue; }
    let letter: string | null = null, exec: string | null = null, alg = line;
    const m = line.match(TARGET_LINE);
    if (m && sec.kind !== 'parity') { letter = m[1]; alg = m[2]; exec = m[3] ?? null; }
    const toks = alg.trim().split(/\s+/).filter(Boolean);
    sec.rows.push({ kind: sec.kind, letter: sec.kind === 'parity' ? 'P' : translate(letter || 'P', sec.kind), exec: exec && sec.kind !== 'parity' ? translate(exec, sec.kind) : exec, moves: moveRoles(sec.kind, toks) });
  }
  return sections;
}

/** One target on the timeline: moves [start, end) of the frame list. */
export interface Segment {
  phase: Phase;
  letter: string;
  exec: string | null;
  start: number;
  end: number;
}

/** Reference playback: one segment per solution row. */
export function rowSegments(rows: SolutionRow[]): Segment[] {
  let i = 0;
  return rows.map(r => {
    const s = { phase: r.kind, letter: r.letter, exec: r.exec, start: i, end: i + r.moves.length };
    i = s.end;
    return s;
  });
}

/** The user's own solution: consecutive frames with the same label form one segment. */
export function frameSegments(frames: Frame[]): Segment[] {
  const out: (Segment & { label: string })[] = [];
  frames.forEach((f, i) => {
    const last = out[out.length - 1];
    const identity = f.step === undefined ? f.label : `${f.step}:${f.label}`;
    if (last && last.label === identity) { last.end = i + 1; return; }
    const [ph, letter] = f.label.split(' ');
    out.push({ label: identity, phase: ph.toLowerCase() as Phase, letter: ph === 'Parity' ? 'P' : translate(letter || 'P', ph === 'Edges' ? 'edges' : 'corners'), exec: null, start: i, end: i + 1 });
  });
  return out;
}

/** Segment of the move just played at position `pos` (pos = moves applied so far). */
export const segmentAt = (segments: Segment[], pos: number) => segments.find(s => pos > s.start && pos <= s.end);

/** Consecutive segments of the same phase, for the labels under the timeline. */
export function phaseRuns(segments: Segment[]) {
  const runs: { phase: Phase; moves: number }[] = [];
  for (const s of segments) {
    const last = runs[runs.length - 1];
    if (last && last.phase === s.phase) last.moves += s.end - s.start;
    else runs.push({ phase: s.phase, moves: s.end - s.start });
  }
  return runs;
}

/** Translate target labels without ever rewriting face-turn notation. */
export function displaySolution(text: string) {
  let kind: 'edges' | 'corners' = 'edges';
  return text.split('\n').map(line => {
    if (line === 'Corners:') kind = 'corners';
    return line.replace(/^([A-X]):/, (_, letter: string) => `${translate(letter, kind)}:`)
      .replace(/# executed as ([A-X])/, (_, letter: string) => `# executed as ${translate(letter, kind)}`);
  }).join('\n');
}
