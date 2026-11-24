import { Workbench } from '../components/layout/Workbench';
import { ScramblePanel } from '../components/timer/ScramblePanel';
import { StatsPanel } from '../components/timer/StatsPanel';
import { TimerPanel } from '../components/timer/TimerPanel';
import { useGlobalKeys, useGlobalKeyUp } from '../hooks/useGlobalKeys';
import { useTimer } from '../hooks/useTimer';

// Phone: scramble, timer, stats stacked. From `md`: scramble and stats share a column beside the timer.
// From `xl`: three columns that fit the window.
const LAYOUT =
  'grid-cols-[minmax(0,1fr)] [grid-template-areas:"timer"_"scramble"_"stats"] max-md:grid-rows-[repeat(3,max-content)] max-md:overflow-auto '
  + 'md:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] md:[grid-template-areas:"timer_scramble"_"timer_stats"] '
  + 'md:[&>section+section]:border-l md:[&>section+section]:border-rule '
  + 'xl:grid-cols-[minmax(320px,1fr)_minmax(0,2fr)_minmax(280px,1fr)] xl:[grid-template-areas:"scramble_timer_stats"] '
  + 'xl:grid-rows-[minmax(0,1fr)]';

/** Keys that never arm the timer. */
const IGNORED = /^(Tab|Escape|F\d+|Shift|Control|Alt|Meta|CapsLock)$/;

/** Timer: a scramble with its unfolded cube, a stopwatch, penalties, and running statistics. */
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
      <TimerPanel phase={t.phase} display={t.display} last={t.last} solveNo={t.solves.length + (t.phase === 'done' ? 0 : 1)}
                  onPenalty={t.setPenalty} onDiscard={t.discard} />
      <ScramblePanel key={t.cube?.scramble} cube={t.cube} error={t.error} canRescramble={t.phase === 'idle'} onRescramble={t.nextScramble} />
      <StatsPanel solves={t.solves} />
    </Workbench>
  );
}
