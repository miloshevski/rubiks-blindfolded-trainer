// Pure timer maths: solve times, penalties and statistics. No React.

export type Penalty = 'none' | 'plus2' | 'dnf';

export interface Solve {
  /** Raw time in milliseconds, before any penalty. */
  ms: number;
  penalty: Penalty;
  scramble: string;
}

/** Time counted for a solve: raw + 2 s for +2, Infinity for a DNF. */
export function effective(s: Solve): number {
  if (s.penalty === 'dnf') return Infinity;
  return s.ms + (s.penalty === 'plus2' ? 2000 : 0);
}

/** 12.34, or 1:02.34 from a minute up. Truncates to hundredths, like a stopwatch. */
export function formatTime(ms: number): string {
  const t = Math.floor(ms / 10) / 100;
  if (t < 60) return t.toFixed(2);
  const m = Math.floor(t / 60);
  return `${m}:${(t - m * 60).toFixed(2).padStart(5, '0')}`;
}

/** A solve as shown in a list: "DNF", "14.33+" or "12.34". */
export function formatSolve(s: Solve): string {
  if (s.penalty === 'dnf') return 'DNF';
  return formatTime(effective(s)) + (s.penalty === 'plus2' ? '+' : '');
}

/** Average of the last `n` solves: drop the best and the worst, mean of the rest (n - 2). Null until there are n. */
export function averageOf(solves: readonly Solve[], n: number): number | 'DNF' | null {
  if (solves.length < n) return null;
  const times = solves.slice(-n).map(effective).sort((a, b) => a - b);
  const kept = times.slice(1, n - 1);   // a single DNF is the worst and is dropped; two make the average DNF
  if (kept.some(t => t === Infinity)) return 'DNF';
  return kept.reduce((a, b) => a + b, 0) / kept.length;
}

export interface Stats {
  deviation: number | null;
  mean: number | null;
  best: number | null;
  count: number;
  ao: { n: number; value: number | 'DNF' | null }[];
}

export const AVERAGES = [5, 12, 50, 100] as const;

/** Deviation (population standard deviation), mean and best ignore DNFs. */
export function computeStats(solves: readonly Solve[]): Stats {
  const times = solves.map(effective).filter(Number.isFinite);
  const mean = times.length ? times.reduce((a, b) => a + b, 0) / times.length : null;
  const deviation = mean == null || times.length < 2
    ? null
    : Math.sqrt(times.reduce((a, t) => a + (t - mean) ** 2, 0) / times.length);
  return {
    deviation,
    mean,
    best: times.length ? Math.min(...times) : null,
    count: solves.length,
    ao: AVERAGES.map(n => ({ n, value: averageOf(solves, n) })),
  };
}

/** Stored solves: only the last 1000 are kept, and bad entries are dropped. */
export const MAX_STORED = 1000;

export const solvesCodec = {
  parse(raw: string): Solve[] | null {
    try {
      const data: unknown = JSON.parse(raw);
      if (!Array.isArray(data)) return null;
      return data.filter((s): s is Solve =>
        s && typeof s.ms === 'number' && typeof s.scramble === 'string'
        && (s.penalty === 'none' || s.penalty === 'plus2' || s.penalty === 'dnf')).slice(-MAX_STORED);
    } catch {
      return null;
    }
  },
  serialize: (v: Solve[]) => JSON.stringify(v.slice(-MAX_STORED)),
};
