import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useViewRotation } from '../../hooks/useViewRotation';
import { fetchDemo, fetchSolveDemo } from '../../lib/api';
import { cn } from '../../lib/cn';
import { stickerKey } from '../../lib/cube';
import type { CubeView, DemoData, LetterMode } from '../../lib/types';
import { Cube3D, type CubeHandle } from '../cube/Cube3D';
import type { StickerMark } from '../cube/Sticker';
import { IconButton } from '../ui/IconButton';
import { IconNext, IconPause, IconPlay, IconPrev, IconReset } from '../ui/icons';
import { Segmented, type SegOption } from '../ui/Segmented';
import { ALG, tokenClass } from '../ui/text';
import { Box, Loading } from './parts';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const TURN_MS = 480;     // one animated turn
const GAP_MS = 260;      // the pause after it
const ROLE = { setup: 'setup', swap: 'core', undo: 'undo' } as const;
const PHASE_NAME = { setup: 'Setup', swap: 'Swap', undo: 'Undo' } as const;

const LETTERS: readonly SegOption<LetterMode>[] = [
  { value: 'off', label: 'Off' },
  { value: 'absolute', label: 'Spots', title: 'The letter of each spot on the cube' },
  { value: 'relative', label: 'Pieces', title: 'The letter each sticker would have in a solved cube: follow a piece as it moves' },
];

const LOOP_PAUSE_MS = 1800;   // how long the finished cube stays before the loop starts over

interface Props {
  kind: 'edge' | 'corner';
  /** The target whose algorithm is played on a solved cube... */
  letter?: string;
  /** ...or a scramble whose edges / corners are executed target by target. */
  scramble?: string;
  /** Caption of the scrambled cube (scramble mode). */
  intro?: string;
  /** Replaces the default one-line caption of the finished algorithm. */
  finished?: string;
  /** Caption of a target's moves (scramble mode); gets the target letter and its number from 1. */
  step?: (letter: string, n: number) => string;
  title?: string;
}

/**
 * A target's algorithm played on a 3D solved cube, split into setup, swap and undo. The buffer's
 * stickers have a white ring and the target blinks; the frames come from the server, so the
 * animation is exactly what the solver would execute.
 */
export function AlgDemo({ kind, letter, scramble, intro, finished, step: stepCaption, title }: Props) {
  const [data, setData] = useState<DemoData | null>(null);
  const [failed, setFailed] = useState(false);
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [letters, setLetters] = useState<LetterMode>('relative');

  const cube = useRef<CubeHandle>(null);
  const rotation = useViewRotation({ wheel: false });
  const posRef = useRef(0);
  const token = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    let live = true;
    const request = scramble ? fetchSolveDemo(scramble, kind === 'edge' ? 'edges' : 'corners') : fetchDemo(kind, letter ?? '');
    request.then(res => {
      if (!live) return;
      if (res.ok) setData(res.data); else setFailed(true);
    });
    return () => { live = false; };
  }, [kind, letter, scramble]);
  useEffect(() => () => { token.current++; }, []);    // leaving the page stops a running demo

  const total = data?.frames.length ?? 0;
  const show = useCallback((p: number) => {
    posRef.current = Math.max(0, Math.min(total, p));
    setPos(posRef.current);
  }, [total]);
  const pause = useCallback(() => { token.current++; setPlaying(false); }, []);

  const play = useCallback(async () => {
    if (!data) return;
    if (playing) { pause(); return; }
    if (posRef.current >= total) show(0);
    const mine = ++token.current;
    setPlaying(true);
    for (;;) {     // plays forever: after the last move the finished cube rests, then it starts over
      while (posRef.current < total) {
        await cube.current?.turn(data.frames[posRef.current].move, TURN_MS);
        if (mine !== token.current) { cube.current?.settle(); return; }
        show(posRef.current + 1);
        await sleep(GAP_MS);
        if (mine !== token.current) return;
      }
      await sleep(LOOP_PAUSE_MS);
      if (mine !== token.current) return;
      show(0);
      await sleep(GAP_MS * 2);
      if (mine !== token.current) return;
    }
  }, [data, pause, playing, show, total]);

  // Plays by itself while it is on screen, and rests while it is not (unless the person took over).
  const stageEl = useRef<HTMLDivElement | null>(null);
  const manual = useRef(false);
  const playRef = useRef(play);
  playRef.current = play;
  const playingRef = useRef(playing);
  playingRef.current = playing;
  useEffect(() => {
    const stage = stageEl.current;
    if (!data || !stage) return;
    const watcher = new IntersectionObserver(([entry]) => {
      if (manual.current) return;
      if (entry.isIntersecting && !playingRef.current) playRef.current();
      else if (!entry.isIntersecting && playingRef.current) pause();
    }, { threshold: 0.4 });
    watcher.observe(stage);
    return () => watcher.disconnect();
  }, [data, pause]);

  const step = useCallback(async (d: 1 | -1) => {
    if (!data) return;
    manual.current = true;
    pause();
    if (d > 0 && posRef.current < total && !busy.current) {
      busy.current = true;
      await cube.current?.turn(data.frames[posRef.current].move, 200);
      busy.current = false;
      show(posRef.current + 1);
    } else if (d < 0) show(posRef.current - 1);
  }, [data, pause, show, total]);

  // where each part ends, in moves: parts can repeat a label (a cycle closes on the letter it began with)
  const ends = useMemo(() => {
    let n = 0;
    return (data?.parts ?? []).map(p => (n += p.alg.split(' ').length));
  }, [data]);
  const jumpToEndOf = (part: number) => {
    manual.current = true;
    pause();
    show(ends[part]);
  };

  const view: CubeView | null = data ? (pos === 0 ? data.start : data.frames[pos - 1]) : null;
  const tags = useMemo(() => new Map<string, StickerMark>(
    (data?.marks ?? []).map(m => [stickerKey(m.face, m.index), m.role === 'target' ? 'target' : 'buffer']),
  ), [data]);

  if (failed) return <Box className="px-4 py-3 text-[12.5px] text-bad">The animation could not be loaded. Is the server up to date?</Box>;
  if (!data || !view) return <Loading />;

  const phase = pos > 0 ? data.frames[pos - 1].label : null;
  const phaseName = (name: string) => PHASE_NAME[name as keyof typeof PHASE_NAME] ?? name.replace(/^\w+ /, '');
  const solveMode = Boolean(scramble);
  const nth = pos > 0 ? ends.findIndex(e => pos <= e) : -1;
  const swapName = kind === 'edge' ? 'M2' : 'the Y-permutation';
  const caption = solveMode
    ? pos === 0 ? intro ?? 'A scrambled cube. Press play.'
      : pos >= total ? finished ?? 'Solved.'
        : stepCaption?.(phaseName(phase ?? ''), nth + 1) ?? `Target ${phaseName(phase ?? '')}.`
    : pos === 0
    ? `A solved cube. The ringed stickers are the buffer; the blinking one is the target, ${data.letter}. Press play.`
    : pos >= total
      ? finished ?? (kind === 'edge'
        ? `Done. The buffer's piece and the target's piece have traded places: follow the letters. M2 also swapped a second pair of edges, a side effect the rest of the method is built around.`
        : `Done. The buffer's corner and the target's corner have traded places: follow the letters.`)
      : phase === 'setup' ? 'Setup: turn the cube so the target sits where the swap can reach it.'
        : phase === 'swap' ? `Swap: ${swapName} trades the buffer's piece with the target's piece.`
          : 'Undo: the setup backwards puts everything else back where it was.';

  let index = 0;       // running move number, to tell played moves from upcoming ones
  return (
    <Box className="flex flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule px-4 py-2.5">
        <span className="text-[12.5px] font-medium">
          {title ?? <>Watch {kind} <span className="font-mono text-accent">{data.letter}</span></>}
          {!solveMode && <span className="ml-2 font-mono text-[11px] text-ink-3">{data.sticker}</span>}
        </span>
        <span className="flex items-center gap-2 text-[11.5px] text-ink-3">Letters
          <Segmented options={LETTERS} value={letters} onChange={setLetters} label="Letters on the cube" />
        </span>
      </div>

      <div ref={el => { stageEl.current = el; return rotation.stageRef(el); }}
           className={cn('relative flex h-[340px] cursor-grab touch-pan-y items-center justify-center overflow-hidden bg-sunk select-none',
             'perspective-[1100px] [--c:46px] active:cursor-grabbing max-md:h-[290px] max-md:perspective-[700px] max-md:[--c:33px]')}
           aria-label={`3D cube playing ${solveMode ? `the ${kind} solution of a scramble` : `the algorithm for ${kind} ${data.letter}`} on a loop. Drag to turn it.`}>
        <Cube3D ref={cube} elementRef={rotation.cubeRef} view={view} letterMode={letters}
                absoluteLetters={data.absolute_letters} marks={null} tags={tags} />
        <span className="pointer-events-none absolute right-3 bottom-2 text-[10.5px] text-ink-3">drag to turn</span>
        {data.marks.length > 0 && <span className="pointer-events-none absolute bottom-2 left-3 flex items-center gap-3 text-[10.5px] text-ink-3">
          <i className="inline-block size-2.5 rounded-[2px] shadow-[inset_0_0_0_2px_var(--color-ink)]" />buffer
          <i className="inline-block size-2.5 rounded-[2px] bg-accent" />target
        </span>}
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Phases">
          {data.parts.map((p, n) => (
            <button key={n} type="button" onClick={() => jumpToEndOf(n)} aria-pressed={nth === n}
                    title={`Jump to the end of ${solveMode ? `target ${phaseName(p.phase)}` : `the ${phaseName(p.phase).toLowerCase()}`}`}
                    className={cn('cursor-pointer rounded-[3px] border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-[.06em] uppercase transition-colors duration-[120ms]',
                      nth === n ? 'border-accent bg-accent-bg text-accent' : 'border-line bg-transparent text-ink-3 hover:text-ink')}>
              {phaseName(p.phase)}
            </button>
          ))}
        </div>

        <div className={cn(ALG, 'gap-y-0.5')} aria-label="The algorithm">
          {data.parts.map(p => p.alg.split(' ').map(m => {
            const i = index++;
            const state = i === pos - 1 ? 'now' : i < pos ? 'played' : 'upcoming';
            return <span key={i} className={tokenClass(ROLE[p.phase as keyof typeof ROLE] ?? 'core', state)}>{m}</span>;
          }))}
        </div>

        <p className="m-0 min-h-[3.4em] text-[13px] leading-[1.6] text-ink-2" aria-live="polite">{caption}</p>

        <div className="flex items-center gap-2">
          <IconButton label="Previous move" title="Previous move" disabled={pos === 0} onClick={() => step(-1)}
                      className="disabled:cursor-default disabled:text-disabled">{IconPrev}</IconButton>
          <IconButton primary label={playing ? 'Pause' : 'Play'} title={playing ? 'Pause' : 'Play the algorithm'} onClick={() => { manual.current = playing; play(); }}>
            {playing ? IconPause : IconPlay}
          </IconButton>
          <IconButton label="Next move" title="Next move" disabled={pos >= total} onClick={() => step(1)}
                      className="disabled:cursor-default disabled:text-disabled">{IconNext}</IconButton>
          <IconButton label="Back to the start" title="Back to the start" disabled={pos === 0} onClick={() => { manual.current = true; pause(); show(0); }}
                      className="disabled:cursor-default disabled:text-disabled">{IconReset}</IconButton>
          <span className="ml-1 font-mono text-[11px] text-ink-3">{pos} / {total}</span>
        </div>
      </div>
    </Box>
  );
}
