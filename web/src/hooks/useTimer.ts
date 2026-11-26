import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCube } from '../lib/api';
import { formatTime, solvesCodec, type Penalty, type Solve } from '../lib/timer';
import type { CubeData } from '../lib/types';
import { useStoredState } from './useStoredState';

export type TimerPhase = 'idle' | 'armed' | 'running' | 'done';

/**
 * The solve timer: a key held down arms it (phase 'armed'), releasing starts it, any key stops it. The running clock is written straight to `display` (a DOM node), so
 * the page does not re-render 60 times a second; React state only changes on start and stop.
 */
export function useTimer() {
  const [solves, setSolves] = useStoredState<Solve[]>('bld.solves', [], solvesCodec);
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [cube, setCube] = useState<CubeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const display = useRef<HTMLDivElement>(null);
  const startedAt = useRef(0);
  const frame = useRef(0);
  const request = useRef(0);

  const nextScramble = useCallback(async () => {
    const id = ++request.current;
    setCube(null);
    const res = await fetchCube('', '1');
    if (id !== request.current) return;   // a newer scramble was asked for
    if (res.ok) { setCube(res.data); setError(null); }
    else setError(res.error);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void nextScramble();
    return () => cancelAnimationFrame(frame.current);
  }, [nextScramble]);

  const tick = useCallback(() => {
    if (display.current) display.current.textContent = formatTime(performance.now() - startedAt.current);
    frame.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    if (!cube) return;
    startedAt.current = performance.now();
    setPhase('running');
    frame.current = requestAnimationFrame(tick);
  }, [cube, tick]);

  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current);
    const ms = performance.now() - startedAt.current;
    setSolves([...solves, { ms, penalty: 'none', scramble: cube?.scramble ?? '' }]);
    setPhase('done');
  }, [cube, solves, setSolves]);

  /** Next solve: a fresh scramble, clock back to zero. */
  const next = useCallback(() => {
    setPhase('idle');
    void nextScramble();
  }, [nextScramble]);

  const last = solves[solves.length - 1];

  const setPenalty = useCallback((penalty: Penalty) => {
    if (!last || phase !== 'done') return;
    // Pressing the active penalty again takes it off.
    const p = last.penalty === penalty ? 'none' : penalty;
    setSolves([...solves.slice(0, -1), { ...last, penalty: p }]);
  }, [last, phase, solves, setSolves]);

  const discard = useCallback(() => {
    if (phase !== 'done') return;
    setSolves(solves.slice(0, -1));
    next();
  }, [phase, solves, setSolves, next]);

  /** A key goes down: stops a running clock; otherwise arms the next start (from a finished solve, with a new scramble). */
  const keyDown = useCallback(() => {
    if (phase === 'running') stop();
    else if (phase === 'idle') { if (cube) setPhase('armed'); }
    else if (phase === 'done') { next(); setPhase('armed'); }
  }, [phase, cube, stop, next]);

  /** The key comes up: an armed timer starts (or stands down if the scramble has not arrived). */
  const keyUp = useCallback(() => {
    if (phase === 'armed') { if (cube) start(); else setPhase('idle'); }
  }, [phase, cube, start]);

  /** A held key or finger is cancelled (the browser took the touch): an armed timer stands down instead of starting. */
  const disarm = useCallback(() => { if (phase === 'armed') setPhase('idle'); }, [phase]);

  /** A tap on the time: stops a running clock, starts an idle one at once (no holding), and from a finished solve moves on to the next. */
  const tap = useCallback(() => {
    if (phase === 'running') stop();
    else if (phase === 'idle') start();
    else if (phase === 'done') next();
  }, [phase, stop, start, next]);

  return { solves, phase, cube, error, display, last: phase === 'done' ? last : undefined, keyDown, keyUp, disarm, tap, nextSolve: next, setPenalty, discard, nextScramble };
}
