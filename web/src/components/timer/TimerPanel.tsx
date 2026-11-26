import { useState, type KeyboardEvent, type MouseEvent, type RefObject } from 'react';
import { cn } from '../../lib/cn';
import { formatSolve, type Penalty, type Solve } from '../../lib/timer';
import type { TimerPhase } from '../../hooks/useTimer';
import { Button } from '../ui/Button';
import { IconTrash } from '../ui/icons';
import { SolvesDialog } from './SolvesDialog';

interface Props {
  phase: TimerPhase;
  display: RefObject<HTMLDivElement | null>;
  /** The solve just finished (null otherwise). */
  last: Solve | undefined;
  solves: readonly Solve[];
  /** Enter on the focused time button. */
  onTap: () => void;
  onPenalty: (p: Penalty) => void;
  onDiscard: () => void;
}

const STATUS: Record<TimerPhase, string> = {
  idle: 'Hold anywhere (or Space), release to start',
  armed: 'Release to start',
  running: 'Tap anywhere or press any key to stop',
  done: 'Solve saved · hold anywhere for the next',
};

const RECENT = 12;
/** The phone design's slightly smaller action buttons. */
const PHONE_ACTION = 'max-md:h-[38px] max-md:min-w-[60px] max-md:px-3';

/** Middle of the Timer: the recent solves down the left, the clock (tap it to start or stop), and the penalty buttons after a solve. */
export function TimerPanel({ phase, display, last, solves, onTap, onPenalty, onDiscard }: Props) {
  const text = phase === 'done' && last ? formatSolve(last) : '0.00';
  const tone = last?.penalty === 'dnf' ? 'text-bad' : last?.penalty === 'plus2' ? 'text-accent' : phase === 'armed' ? 'text-ok' : phase === 'idle' ? 'text-ink-2' : 'text-ink';
  const solveNo = solves.length + (phase === 'done' ? 0 : 1);
  const recent = solves.slice(-RECENT).reverse();
  const [allOpen, setAllOpen] = useState(false);
  const listKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); setAllOpen(true); }
  };
  // Buttons drop focus after a click so the space bar always means start / stop, never "press that button again".
  const blurAfter = (fn: () => void) => (e: { currentTarget: HTMLElement }) => { e.currentTarget.blur(); fn(); };

  // Holding and releasing (finger anywhere, or the mouse on the clock) is handled page-wide by usePointerHold;
  // this is only Enter on the focused button (a mouse or finger click has detail > 0).
  const click = (e: MouseEvent<HTMLButtonElement>) => { if (e.detail === 0) onTap(); };

  return (
    <section className="relative flex min-h-[220px] min-w-0 flex-col items-center justify-center gap-6 overflow-hidden p-5 [grid-area:timer] max-md:gap-3 max-md:px-3 max-md:py-2.5 max-md:[@media(max-height:700px)]:gap-2 md:[@media(max-height:760px)]:gap-4" aria-label="Timer">
      {recent.length ? (
        <div role="button" tabIndex={0} aria-label="Show all solves" title="Show all solves" onClick={() => setAllOpen(true)} onKeyDown={listKey}
             className="absolute top-5 bottom-5 left-6 cursor-pointer rounded-sm outline-offset-4 focus-visible:outline-2 focus-visible:outline-accent max-md:top-2.5 max-md:bottom-2.5 max-md:left-3">
          <ol aria-label="Recent solves"
              className="m-0 flex h-full list-none flex-col gap-1 overflow-hidden p-0 font-mono text-[14px] leading-normal font-medium tabular-nums max-md:gap-0.5 max-md:text-[12px]">
            {recent.map((r, i) => (
              <li key={solves.length - i} className={r.penalty === 'dnf' ? 'text-bad' : r.penalty === 'plus2' ? 'text-accent' : 'text-ink'}>{formatSolve(r)}</li>
            ))}
          </ol>
        </div>
      ) : null}
      {allOpen ? <SolvesDialog solves={solves} onClose={() => setAllOpen(false)} /> : null}
      <span className="font-mono text-[11px] text-ink-3">Solve {solveNo}</span>
      <button type="button" data-hold onClick={click} aria-label={phase === 'running' ? 'Stop timer' : 'Start timer'}
              className="cursor-pointer border-0 bg-transparent p-0 text-inherit touch-none select-none [-webkit-tap-highlight-color:transparent]">
        {/* key: the running clock rewrites this node's text directly, so each phase gets a fresh node */}
        <div key={phase} ref={display} role="timer" aria-live="off"
             className={cn('font-mono text-[clamp(72px,12vw,152px)] leading-none font-medium tracking-[-.03em] whitespace-nowrap tabular-nums max-md:text-[clamp(64px,21vw,100px)] max-md:[@media(max-height:700px)]:text-[clamp(48px,15vw,80px)] md:[@media(max-height:760px)]:text-[clamp(64px,16vh,140px)]', tone)}>
          {text}
        </div>
      </button>
      <div className="h-3.5 text-[12px] leading-[14px] text-ink-3" aria-live="polite">{STATUS[phase]}</div>

      {phase === 'done' && (
        <div className="flex flex-wrap justify-center gap-2.5 max-md:gap-2">
          <Button size="action" className={PHONE_ACTION} onClick={blurAfter(onDiscard)}>{IconTrash} Discard</Button>
          <Button size="action" className={`min-w-[76px] ${PHONE_ACTION}`} variant={last?.penalty === 'dnf' ? 'active' : 'default'} aria-pressed={last?.penalty === 'dnf'}
                  onClick={blurAfter(() => onPenalty('dnf'))}>DNF</Button>
          <Button size="action" className={`min-w-[76px] ${PHONE_ACTION}`} variant={last?.penalty === 'plus2' ? 'active' : 'default'} aria-pressed={last?.penalty === 'plus2'}
                  onClick={blurAfter(() => onPenalty('plus2'))}>+2 s</Button>
        </div>
      )}
    </section>
  );
}
