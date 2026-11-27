import type { AlgData, CheckResult, CubeData, DemoData, ParityAlg } from './types';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

// The server answers errors as {"error": "..."} with a 4xx status.
async function getJson<T>(path: string, params?: Record<string, string>): Promise<ApiResult<T>> {
  const url = params ? `${path}?${new URLSearchParams(params)}` : path;
  try {
    const res = await fetch(url);
    const body = await res.json();
    return res.ok ? { ok: true, data: body as T } : { ok: false, error: body.error ?? `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** A scramble and its full solution. An empty scramble asks the server for a random one. */
export function fetchCube(scramble: string, parity: ParityAlg) {
  const params: Record<string, string> = { parity };
  if (scramble) params.scramble = scramble;
  return getJson<CubeData>('/api/cube', params);
}

/** Runs the user's typed solution (letters as executed) on the scramble. */
export function checkSolution(scramble: string, edges: string, corners: string, parity: boolean, parityAlg: ParityAlg) {
  return getJson<CheckResult>('/api/check', {
    scramble, edges, corners, parity: parity ? '1' : '0', parity_alg: parityAlg,
  });
}

export function fetchAlgs() {
  return getJson<AlgData>('/api/algs');
}

/** The letter-pair words as stored in letter-pairs.json (they may be newer than the bundled copy). */
export function fetchPairs() {
  return getJson<Record<string, string>>('/api/pairs');
}

/** Saves one edited pair word into letter-pairs.json; answers the word as stored. */
export async function savePairWord(pair: string, word: string): Promise<ApiResult<{ pair: string; word: string }>> {
  try {
    const res = await fetch('/api/pairs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pair, word }),
    });
    const body = await res.json();
    return res.ok ? { ok: true, data: body } : { ok: false, error: body.error ?? `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** A target's algorithm played on a solved cube, in phases (setup, swap, undo). */
export function fetchDemo(kind: 'edge' | 'corner', letter: string) {
  return getJson<DemoData>('/api/demo', { kind, letter });
}
