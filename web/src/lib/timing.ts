import type { SolveRecord } from './local';
export type TimerPhase =
  'idle' | 'holding' | 'ready' | 'running' | 'memo-complete' | 'confirmation';
export interface TimerState {
  phase: TimerPhase;
  held: number;
  start: number;
  memo: number | null;
  elapsed: number;
}
export const IDLE: TimerState = { phase: 'idle', held: 0, start: 0, memo: null, elapsed: 0 };
export function transition(
  s: TimerState,
  event: 'down' | 'up' | 'tick' | 'blur' | 'reset',
  now: number,
  threshold = 300,
  split = false,
): TimerState {
  if (event === 'reset') return { ...IDLE };
  if (event === 'blur' && (s.phase === 'holding' || s.phase === 'ready')) return { ...IDLE };
  if (event === 'down') {
    if (s.phase === 'idle')
      return { ...IDLE, held: now, phase: threshold === 0 ? 'ready' : 'holding' };
    if (s.phase === 'running' && split)
      return { ...s, phase: 'memo-complete', memo: now - s.start, elapsed: now - s.start };
    if (s.phase === 'running' || s.phase === 'memo-complete')
      return { ...s, phase: 'confirmation', elapsed: now - s.start };
  }
  if (event === 'up' && (s.phase === 'holding' || s.phase === 'ready'))
    return now - s.held >= threshold
      ? { ...s, phase: 'running', start: now, elapsed: 0 }
      : { ...IDLE };
  if (event === 'tick') {
    if (s.phase === 'holding' && now - s.held >= threshold) return { ...s, phase: 'ready' };
    if (s.phase === 'running' || s.phase === 'memo-complete')
      return { ...s, elapsed: now - s.start };
  }
  return s;
}
export const adjusted = (s: SolveRecord) =>
  s.penalty === 'DNF' ? null : s.ms + (s.penalty === '+2' ? 2000 : 0);
export function formatTime(ms: number | null) {
  if (ms === null) return 'DNF';
  const seconds = Math.floor(ms / 10) / 100;
  return seconds >= 60
    ? `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(2).padStart(5, '0')}`
    : seconds.toFixed(2);
}
export function parseTime(text: string) {
  if (!/^\d+(?::[0-5]\d)?(?:\.\d{1,3})?$/.test(text.trim()))
    throw new Error('Use seconds or minutes:seconds, for example 75.20 or 1:15.20.');
  const parts = text.trim().split(':').map(Number);
  const ms = Math.round((parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0]) * 1000);
  if (!Number.isSafeInteger(ms) || ms <= 0) throw new Error('Time must be positive.');
  return ms;
}
export function statistics(solves: SolveRecord[]) {
  const ordered = [...solves].sort((a, b) => a.at - b.at),
    successful = ordered.map(adjusted).filter((x): x is number => x !== null);
  const means = ordered.slice(2).map((_, i) => {
    const values = ordered.slice(i, i + 3).map(adjusted);
    return values.includes(null) ? null : (values as number[]).reduce((a, b) => a + b, 0) / 3;
  });
  const valid = means.filter((x): x is number => x !== null);
  const splits = ordered.filter((s) => s.memo !== null && s.penalty !== 'DNF');
  return {
    attempts: ordered.length,
    successes: successful.length,
    dnfs: ordered.length - successful.length,
    rate: ordered.length ? successful.length / ordered.length : null,
    best: successful.length ? Math.min(...successful) : null,
    mean: successful.length ? successful.reduce((a, b) => a + b, 0) / successful.length : null,
    mo3: means.length ? means.at(-1) : undefined,
    bestMo3: valid.length ? Math.min(...valid) : undefined,
    memo: splits.length ? splits.reduce((a, s) => a + s.memo!, 0) / splits.length : null,
    execution: splits.length
      ? splits.reduce((a, s) => a + s.ms - s.memo!, 0) / splits.length
      : null,
  };
}
