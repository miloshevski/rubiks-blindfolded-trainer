import type { MouseEvent, PointerEvent, RefObject } from 'react';
import { cn } from '../../lib/cn';
import { formatSolve, type Penalty, type Solve } from '../../lib/timer';
import type { TimerPhase } from '../../hooks/useTimer';
import { Button, Kbd } from '../ui/Button';
import { IconTrash } from '../ui/icons';

interface Props {
  phase: TimerPhase;
  display: RefObject<HTMLDivElement | null>;
  /** The solve just finished (null otherwise). */
  last: Solve | undefined;
  solves: readonly Solve[];
  /** Finger or mouse goes down on the time / comes up / is cancelled: the same as holding and releasing a key. */
  onPress: () => void;
  onRelease: () => void;
  onCancel: () => void;
  /** Enter on the focused time button. */
  onTap: () => void;
  onNext: () => void;
  onPenalty: (p: Penalty) => void;
  onDiscard: () => void;
}

const STATUS: Record<TimerPhase, string> = {
  idle: 'Hold the time (or Space), release to start',
  armed: 'Release to start',
  running: 'Tap the time or press any key to stop',
  done: 'Solve saved · hold the time for the next',
};

const RECENT = 12;
/** The phone design's slightly smaller action buttons. */
const PHONE_ACTION = 'max-md:h-[38px] max-md:min-w-[60px] max-md:px-3';

/** Middle of the Timer: the recent solves down the left, the clock (tap it to start or stop), and the penalty buttons after a solve. */
export function TimerPanel({ phase, display, last, solves, onPress, onRelease, onCancel, onTap, onNext, onPenalty, onDiscard }: Props) {
  const text = phase === 'done' && last ? formatSolve(last) : '0.00';
  const tone = last?.penalty === 'dnf' ? 'text-bad' : last?.penalty === 'plus2' ? 'text-accent' : phase === 'armed' ? 'text-ok' : phase === 'idle' ? 'text-ink-2' : 'text-ink';
  const solveNo = solves.length + (phase === 'done' ? 0 : 1);
  const recent = solves.slice(-RECENT).reverse();
  // Buttons drop focus after a click so the space bar always means start / stop, never "press that button again".
  const blurAfter = (fn: () => void) => (e: { currentTarget: HTMLElement }) => { e.currentTarget.blur(); fn(); };

  // The time works like the space bar: hold it (it turns green), let go to start, touch it again to stop.
  // The pointer is captured so letting go off the button still counts.
  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.blur();
    onPress();
  };
  // Enter on the focused button (a mouse or finger has detail > 0 and was handled above).
  const click = (e: MouseEvent<HTMLButtonElement>) => { if (e.detail === 0) onTap(); };

  return (
    <section className="relative flex min-h-[220px] min-w-0 flex-col items-center justify-center gap-6 overflow-hidden p-5 [grid-area:timer] max-md:gap-3 max-md:px-3 max-md:py-2.5 max-md:[@media(max-height:700px)]:gap-2 md:[@media(max-height:760px)]:gap-4" aria-label="Timer">
      <ol aria-label="Recent solves"
          className="absolute top-5 bottom-5 left-6 m-0 flex list-none flex-col gap-1 overflow-hidden p-0 font-mono text-[14px] leading-normal font-medium tabular-nums max-md:top-2.5 max-md:bottom-2.5 max-md:left-3 max-md:gap-0.5 max-md:text-[12px]">
        {recent.map((r, i) => (
          <li key={solves.length - i} className={r.penalty === 'dnf' ? 'text-bad' : r.penalty === 'plus2' ? 'text-accent' : 'text-ink'}>{formatSolve(r)}</li>
        ))}
      </ol>
      <span className="font-mono text-[11px] text-ink-3">Solve {solveNo}</span>
      <button type="button" onPointerDown={down} onPointerUp={onRelease} onPointerCancel={onCancel} onContextMenu={e => e.preventDefault()} onClick={click} aria-label={phase === 'running' ? 'Stop timer' : 'Start timer'}
              className="cursor-pointer border-0 bg-transparent p-0 text-inherit touch-none select-none [-webkit-tap-highlight-color:transparent]">
        {/* key: the running clock rewrites this node's text directly, so each phase gets a fresh node */}
        <div key={phase} ref={display} role="timer" aria-live="off"
             className={cn('font-mono text-[clamp(72px,12vw,152px)] leading-none font-medium tracking-[-.03em] whitespace-nowrap tabular-nums max-md:text-[clamp(64px,21vw,100px)] max-md:[@media(max-height:700px)]:text-[clamp(48px,15vw,80px)] md:[@media(max-height:760px)]:text-[clamp(64px,16vh,140px)]', tone)}>
          {text}
        </div>
      </button>
      <div className="h-3.5 text-[12px] leading-[14px] text-ink-3" aria-live="polite">{STATUS[phase]}</div>

      {phase === 'done' && (
        <>
          <div className="flex flex-wrap justify-center gap-2.5 max-md:gap-2">
            <Button size="action" className={PHONE_ACTION} onClick={blurAfter(onDiscard)}>{IconTrash} Discard</Button>
            <Button size="action" className={`min-w-[76px] ${PHONE_ACTION}`} variant={last?.penalty === 'dnf' ? 'active' : 'default'} aria-pressed={last?.penalty === 'dnf'}
                    onClick={blurAfter(() => onPenalty('dnf'))}>DNF</Button>
            <Button size="action" className={`min-w-[76px] ${PHONE_ACTION}`} variant={last?.penalty === 'plus2' ? 'active' : 'default'} aria-pressed={last?.penalty === 'plus2'}
                    onClick={blurAfter(() => onPenalty('plus2'))}>+2 s</Button>
          </div>
          <Button size="lg" variant="primary" className="w-[200px] max-md:h-[42px] max-md:w-[180px]" onClick={blurAfter(onNext)}>
            Next solve <span className="max-md:hidden"><Kbd>Space</Kbd></span>
          </Button>
        </>
      )}
    </section>
  );
}
