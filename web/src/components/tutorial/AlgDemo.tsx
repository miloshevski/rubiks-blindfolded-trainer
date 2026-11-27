import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useViewRotation } from '../../hooks/useViewRotation';
import { fetchDemo } from '../../lib/api';
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

interface Props {
  kind: 'edge' | 'corner';
  letter: string;
  /** Replaces the default one-line caption of the finished algorithm. */
  finished?: string;
}

/**
 * A target's algorithm played on a 3D solved cube, split into setup, swap and undo. The buffer's
 * stickers have a white ring and the target blinks; the frames come from the server, so the
 * animation is exactly what the solver would execute.
 */
export function AlgDemo({ kind, letter, finished }: Props) {
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
    fetchDemo(kind, letter).then(res => {
      if (!live) return;
      if (res.ok) setData(res.data); else setFailed(true);
    });
    return () => { live = false; };
  }, [kind, letter]);
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
    while (posRef.current < total) {
      await cube.current?.turn(data.frames[posRef.current].move, TURN_MS);
      if (mine !== token.current) { cube.current?.settle(); return; }
      show(posRef.current + 1);
      await sleep(GAP_MS);
      if (mine !== token.current) return;
    }
    setPlaying(false);
  }, [data, pause, playing, show, total]);

  const step = useCallback(async (d: 1 | -1) => {
    if (!data) return;
    pause();
    if (d > 0 && posRef.current < total && !busy.current) {
      busy.current = true;
      await cube.current?.turn(data.frames[posRef.current].move, 200);
      busy.current = false;
      show(posRef.current + 1);
    } else if (d < 0) show(posRef.current - 1);
  }, [data, pause, show, total]);

  const jumpToEndOf = (phase: DemoData['parts'][number]['phase']) => {
    if (!data) return;
    pause();
    show(data.frames.findLastIndex(f => f.label === phase) + 1);
  };

  const view: CubeView | null = data ? (pos === 0 ? data.start : data.frames[pos - 1]) : null;
  const tags = useMemo(() => new Map<string, StickerMark>(
    (data?.marks ?? []).map(m => [stickerKey(m.face, m.index), m.role === 'target' ? 'target' : 'buffer']),
  ), [data]);

  if (failed) return <Box className="px-4 py-3 text-[12.5px] text-bad">The animation could not be loaded. Is the server up to date?</Box>;
  if (!data || !view) return <Loading />;

  const phase = pos > 0 ? data.frames[pos - 1].label as keyof typeof ROLE : null;
  const swapName = kind === 'edge' ? 'M2' : 'the Y-permutation';
  const caption = pos === 0
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
          Watch {kind} <span className="font-mono text-accent">{data.letter}</span>
          <span className="ml-2 font-mono text-[11px] text-ink-3">{data.sticker}</span>
        </span>
        <span className="flex items-center gap-2 text-[11.5px] text-ink-3">Letters
          <Segmented options={LETTERS} value={letters} onChange={setLetters} label="Letters on the cube" />
        </span>
      </div>

      <div ref={rotation.stageRef}
           className={cn('relative flex h-[340px] cursor-grab touch-pan-y items-center justify-center overflow-hidden bg-sunk select-none',
             'perspective-[1100px] [--c:46px] active:cursor-grabbing max-md:h-[290px] max-md:perspective-[700px] max-md:[--c:33px]')}
           aria-label={`3D cube playing the algorithm for ${kind} ${data.letter}. Drag to turn it.`}>
        <Cube3D ref={cube} elementRef={rotation.cubeRef} view={view} letterMode={letters}
                absoluteLetters={data.absolute_letters} marks={null} tags={tags} />
        <span className="pointer-events-none absolute right-3 bottom-2 text-[10.5px] text-ink-3">drag to turn</span>
        <span className="pointer-events-none absolute bottom-2 left-3 flex items-center gap-3 text-[10.5px] text-ink-3">
          <i className="inline-block size-2.5 rounded-[2px] shadow-[inset_0_0_0_2px_var(--color-ink)]" />buffer
          <i className="inline-block size-2.5 rounded-[2px] bg-accent" />target
        </span>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Phases">
          {data.parts.map(p => (
            <button key={p.phase} type="button" onClick={() => jumpToEndOf(p.phase)} aria-pressed={phase === p.phase}
                    title={`Jump to the end of the ${PHASE_NAME[p.phase].toLowerCase()}`}
                    className={cn('cursor-pointer rounded-[3px] border px-2 py-0.5 font-mono text-[11px] font-semibold tracking-[.06em] uppercase transition-colors duration-[120ms]',
                      phase === p.phase ? 'border-accent bg-accent-bg text-accent' : 'border-line bg-transparent text-ink-3 hover:text-ink')}>
              {PHASE_NAME[p.phase]}
            </button>
          ))}
        </div>

        <div className={cn(ALG, 'gap-y-0.5')} aria-label="The algorithm">
          {data.parts.map(p => p.alg.split(' ').map(m => {
            const i = index++;
            const state = i === pos - 1 ? 'now' : i < pos ? 'played' : 'upcoming';
            return <span key={i} className={tokenClass(ROLE[p.phase], state)}>{m}</span>;
          }))}
        </div>

        <p className="m-0 min-h-[3.4em] text-[13px] leading-[1.6] text-ink-2" aria-live="polite">{caption}</p>

        <div className="flex items-center gap-2">
          <IconButton label="Previous move" title="Previous move" disabled={pos === 0} onClick={() => step(-1)}
                      className="disabled:cursor-default disabled:text-disabled">{IconPrev}</IconButton>
          <IconButton primary label={playing ? 'Pause' : 'Play'} title={playing ? 'Pause' : 'Play the algorithm'} onClick={play}>
            {playing ? IconPause : IconPlay}
          </IconButton>
          <IconButton label="Next move" title="Next move" disabled={pos >= total} onClick={() => step(1)}
                      className="disabled:cursor-default disabled:text-disabled">{IconNext}</IconButton>
          <IconButton label="Back to the start" title="Back to the start" disabled={pos === 0} onClick={() => { pause(); show(0); }}
                      className="disabled:cursor-default disabled:text-disabled">{IconReset}</IconButton>
          <span className="ml-1 font-mono text-[11px] text-ink-3">{pos} / {total}</span>
        </div>
      </div>
    </Box>
  );
}
