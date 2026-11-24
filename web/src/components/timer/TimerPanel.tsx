import type { RefObject } from 'react';
import { cn } from '../../lib/cn';
import { formatSolve, type Penalty, type Solve } from '../../lib/timer';
import type { TimerPhase } from '../../hooks/useTimer';
import { Button } from '../ui/Button';
import { IconTrash } from '../ui/icons';
import { Bar, Meta } from '../ui/text';

interface Props {
  phase: TimerPhase;
  display: RefObject<HTMLDivElement | null>;
  /** The solve just finished (null otherwise). */
  last: Solve | undefined;
  solveNo: number;
  onPenalty: (p: Penalty) => void;
  onDiscard: () => void;
}

const STATUS: Record<TimerPhase, string> = {
  idle: 'Hold Space, release to start',
  armed: 'Release to start',
  running: 'Press any key to stop',
  done: 'Solve saved · hold Space for the next',
};

/** Middle pane of the Timer: the clock, start/stop, and the penalty buttons after a solve. */
export function TimerPanel({ phase, display, last, solveNo, onPenalty, onDiscard }: Props) {
  const text = phase === 'done' && last ? formatSolve(last) : '0.00';
  const tone = last?.penalty === 'dnf' ? 'text-bad' : last?.penalty === 'plus2' ? 'text-accent' : phase === 'armed' ? 'text-ok' : phase === 'idle' ? 'text-ink-2' : 'text-ink';
  // Buttons drop focus after a click so the space bar always means start / stop, never "press that button again".
  const blurAfter = (fn: () => void) => (e: { currentTarget: HTMLElement }) => { e.currentTarget.blur(); fn(); };

  return (
    <section className="flex min-h-0 min-w-0 flex-col [grid-area:timer]">
      <Bar title="Timer" meta={<Meta>solve {solveNo}</Meta>} />
      <div className="flex min-h-[320px] flex-[1_1_auto] flex-col items-center justify-center gap-7 px-5 py-10 max-md:min-h-[280px] max-md:px-4 max-md:py-8">
        {/* key: the running clock rewrites this node's text directly, so each phase gets a fresh node */}
        <div key={phase} ref={display} role="timer" aria-live="off"
             className={cn('font-mono text-[clamp(72px,12vw,152px)] leading-none font-medium tracking-[-.03em] tabular-nums', tone)}>
          {text}
        </div>
        <div className="h-3.5 text-[12px] leading-[14px] text-ink-3" aria-live="polite">{STATUS[phase]}</div>

        {phase === 'done' && (
          <div className="flex flex-wrap justify-center gap-2.5">
            <Button onClick={blurAfter(onDiscard)}>{IconTrash} Discard</Button>
            <Button variant={last?.penalty === 'dnf' ? 'active' : 'default'} aria-pressed={last?.penalty === 'dnf'}
                    onClick={blurAfter(() => onPenalty('dnf'))}>DNF</Button>
            <Button variant={last?.penalty === 'plus2' ? 'active' : 'default'} aria-pressed={last?.penalty === 'plus2'}
                    onClick={blurAfter(() => onPenalty('plus2'))}>+2 s</Button>
          </div>
        )}
      </div>
    </section>
  );
}
