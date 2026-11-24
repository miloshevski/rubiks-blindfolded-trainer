import { useCallback, useMemo, useRef, useState, type RefObject } from 'react';
import type { CubeHandle } from '../components/cube/Cube3D';
import { frameSegments, rowSegments, type Segment, type SolutionRow } from '../lib/solution';
import type { CheckResult, CubeData, CubeView, Frame } from '../lib/types';
import { useLatest } from './useLatest';

export type Source = 'ref' | 'mine';
export interface Status { text: string; tone?: 'ok' | 'bad' }

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

interface Args {
  current: CubeData | null;
  practice: CheckResult | null;
  refRows: SolutionRow[];
  speed: number;                       // turns per second
  cube: RefObject<CubeHandle | null>;
}

/**
 * Steps through the reference solution, or the user's checked one, on the 3D cube.
 * `pos` is the number of moves applied so far. The async play loop reads everything through
 * refs, so it always sees the latest data and stops as soon as its token is outdated.
 */
export function usePlayback({ current, practice, refRows, speed, cube }: Args) {
  const [source, setSourceState] = useState<Source>('ref');
  const [pos, setPos] = useState(0);
  const [playing, setPlayingState] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  const latest = useLatest({ current, practice, refRows, speed });
  const sourceRef = useRef<Source>('ref');
  const posRef = useRef(0);
  const playingRef = useRef(false);
  const token = useRef(0);
  const busy = useRef(false);

  const framesOf = useCallback((src: Source): Frame[] | null => {
    const { current: c, practice: p } = latest.current;
    return src === 'mine' ? p?.frames ?? null : c?.frames ?? null;
  }, [latest]);

  const segmentsOf = useCallback((src: Source): Segment[] =>
    src === 'mine' ? frameSegments(framesOf('mine') ?? []) : rowSegments(latest.current.refRows), [framesOf, latest]);

  const show = useCallback((p: number) => {
    if (!latest.current.current) return;
    const n = (framesOf(sourceRef.current) ?? []).length;
    posRef.current = Math.max(0, Math.min(n, p));
    setPos(posRef.current);
  }, [framesOf, latest]);

  const setPlaying = useCallback((on: boolean) => { playingRef.current = on; setPlayingState(on); }, []);
  const pause = useCallback(() => { token.current++; setPlaying(false); }, [setPlaying]);

  const play = useCallback(async () => {
    if (playingRef.current) { pause(); return; }
    if (!latest.current.current) return;
    const fr = framesOf(sourceRef.current);
    if (!fr) { setStatus({ text: 'Server is outdated: restart python3 -m bld.server', tone: 'bad' }); return; }
    if (!fr.length) { setStatus({ text: 'No moves to play' }); return; }
    if (posRef.current >= fr.length) show(0);
    setStatus(null);
    const mine = ++token.current;
    setPlaying(true);
    while (posRef.current < fr.length) {
      const moveMs = 1000 / latest.current.speed, turnMs = moveMs / 2;
      await cube.current?.turn(fr[posRef.current].move, turnMs);
      if (mine !== token.current) { cube.current?.settle(); return; }
      show(posRef.current + 1);
      await sleep(moveMs - turnMs);
      if (mine !== token.current) return;
    }
    setPlaying(false);
    const p = latest.current.practice;
    if (sourceRef.current === 'ref') setStatus({ text: `Done: ${fr.length} moves, cube solved`, tone: 'ok' });
    else setStatus({
      text: `Your solution: ${fr.length} moves, ${p?.correct ? 'cube solved' : 'cube NOT solved'}`,
      tone: p?.correct ? 'ok' : 'bad',
    });
  }, [cube, framesOf, latest, pause, setPlaying, show]);

  const step = useCallback(async (d: 1 | -1) => {
    if (!latest.current.current) return;
    pause();
    setStatus(null);
    const fr = framesOf(sourceRef.current) ?? [];
    if (d > 0 && posRef.current < fr.length && !busy.current) {
      busy.current = true;
      await cube.current?.turn(fr[posRef.current].move, 120);
      busy.current = false;
      show(posRef.current + 1);
    } else show(posRef.current + d);
  }, [cube, framesOf, latest, pause, show]);

  /** Jumps to the start of the next target, or back to the start of this / the previous one. */
  const stepTarget = useCallback((d: 1 | -1) => {
    pause();
    setStatus(null);
    const segs = segmentsOf(sourceRef.current), p = posRef.current;
    if (d > 0) {
      const next = segs.find(s => s.start >= p);
      show(next ? next.start : (framesOf(sourceRef.current) ?? []).length);
      return;
    }
    const i = segs.findLastIndex(s => s.start < p);
    if (i < 0) { show(0); return; }
    show(p - segs[i].start <= 1 ? segs[i - 1]?.start ?? 0 : segs[i].start);
  }, [framesOf, pause, segmentsOf, show]);

  const switchSource = useCallback((src: Source) => {
    pause();
    sourceRef.current = src;
    setSourceState(src);
    setStatus(null);
    posRef.current = 0;
    setPos(0);
  }, [pause]);

  /** Back to the start of the reference solution (a new scramble was loaded). */
  const reset = useCallback(() => {
    switchSource('ref');
  }, [switchSource]);

  /** The user's solution was replaced or dropped: stop playing it. */
  const leaveMine = useCallback(() => {
    if (sourceRef.current === 'mine') switchSource('ref');
  }, [switchSource]);

  /** Scrubbing / clicking a solution row: stop and show position p of `src`. */
  const jumpTo = useCallback((p: number, src: Source = sourceRef.current) => {
    if (src !== sourceRef.current) switchSource(src);
    pause();
    setStatus(null);
    show(p);
  }, [pause, show, switchSource]);

  const frames = source === 'mine' ? practice?.frames ?? null : current?.frames ?? null;
  const segments = useMemo(
    () => (source === 'mine' ? frameSegments(practice?.frames ?? []) : rowSegments(refRows)),
    [source, practice, refRows],
  );
  const view: CubeView | null = pos === 0 ? current : frames?.[pos - 1] ?? current;

  return {
    source, pos, playing, status, frames, segments, view,
    play, pause, step, stepTarget, switchSource, reset, leaveMine, jumpTo, setStatus,
  };
}

export type Playback = ReturnType<typeof usePlayback>;
