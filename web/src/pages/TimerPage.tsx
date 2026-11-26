import { Workbench } from '../components/layout/Workbench';
import { ScramblePanel } from '../components/timer/ScramblePanel';
import { StatsPanel } from '../components/timer/StatsPanel';
import { TimerPanel } from '../components/timer/TimerPanel';
import { useGlobalKeys, useGlobalKeyUp } from '../hooks/useGlobalKeys';
import { useTimer } from '../hooks/useTimer';

// One column: the scramble on top, the clock filling the middle, statistics and the cube net along the bottom.
// On a phone the page may scroll inside <main> when those do not all fit.
const LAYOUT =
  'grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] [grid-template-areas:"scramble"_"timer"_"bar"] max-md:overflow-auto';

/** Keys that never arm the timer. */
const IGNORED = /^(Tab|Escape|F\d+|Shift|Control|Alt|Meta|CapsLock)$/;

/** Timer: the scramble, a stopwatch (tap or hold a key), penalties, running statistics and the cube net. */
export default function TimerPage() {
  const t = useTimer();

  // Hold any key to arm the timer (it turns green), release it to start, press any key to stop.
  // Keys that mean something else (Tab, Esc, F-keys) never arm it, and Enter on a focused button still presses it.
  useGlobalKeys((e, target) => {
    const space = e.key === ' ';
    if (space) e.preventDefault();   // no page scroll, no button click on release
    if (e.repeat) return;
    if (t.phase !== 'running') {
      if (IGNORED.test(e.key) || (e.key === 'Enter' && target?.closest('button'))) return;
      if (target?.closest('button') && !space) return;
    }
    if (space) (document.activeElement as HTMLElement | null)?.blur();
    t.keyDown();
  });
  useGlobalKeyUp(e => {
    if (e.key === ' ') e.preventDefault();
    if (IGNORED.test(e.key)) return;
    t.keyUp();
  });

  return (
    <Workbench layout={LAYOUT}>
      <ScramblePanel key={t.cube?.scramble} cube={t.cube} error={t.error} canRescramble={t.phase === 'idle'} onRescramble={t.nextScramble} />
      <TimerPanel phase={t.phase} display={t.display} last={t.last} solves={t.solves} onTap={t.tap} onNext={t.nextSolve}
                  onPenalty={t.setPenalty} onDiscard={t.discard} />
      <StatsPanel solves={t.solves} cube={t.cube} />
    </Workbench>
  );
}
