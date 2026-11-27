import { useState } from 'react';
import { Workbench } from '../components/layout/Workbench';
import { ScramblePanel } from '../components/timer/ScramblePanel';
import { StatsPanel } from '../components/timer/StatsPanel';
import { TimerPanel } from '../components/timer/TimerPanel';
import { FavoritesDialog } from '../components/favorites/FavoritesDialog';
import { useFavorites } from '../hooks/useFavorites';
import { useGlobalKeys, useGlobalKeyUp } from '../hooks/useGlobalKeys';
import { usePointerHold } from '../hooks/usePointerHold';
import { useTimer } from '../hooks/useTimer';

// One column: the scramble on top, the clock filling the middle, statistics and the cube net along the bottom.
// On a phone the page may scroll inside <main> when those do not all fit.
const LAYOUT =
  'grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] [grid-template-areas:"scramble"_"timer"_"bar"] max-md:overflow-auto select-none [-webkit-touch-callout:none]';

/** Keys that never arm the timer. */
const IGNORED = /^(Tab|Escape|F\d+|Shift|Control|Alt|Meta|CapsLock)$/;

/** Timer: the scramble, a stopwatch (tap or hold a key), penalties, running statistics and the cube net. */
export default function TimerPage() {
  const t = useTimer();
  const fav = useFavorites();
  const [favOpen, setFavOpen] = useState(false);

  // Hold any key to arm the timer (it turns green), release it to start, press any key to stop.
  // Keys that mean something else (Tab, Esc, F-keys) never arm it, and Enter on a focused button still presses it.
  useGlobalKeys((e, target) => {
    if (document.querySelector('dialog[open]')) return;   // a dialog (all solves, the enlarged net) has the keyboard
    const space = e.key === ' ';
    if (space) e.preventDefault();   // no page scroll, no button click on release
    if (e.repeat) return;
    if (t.phase !== 'running') {
      if (IGNORED.test(e.key) || (e.key === 'Enter' && target?.closest('button, a, [role=button]'))) return;
      if (target?.closest('button, a, [role=button]') && !space) return;
    }
    if (space) (document.activeElement as HTMLElement | null)?.blur();
    t.keyDown();
  });
  useGlobalKeyUp(e => {
    if (document.querySelector('dialog[open]')) return;
    if (e.key === ' ') e.preventDefault();
    if (IGNORED.test(e.key)) return;
    t.keyUp();
  });

  // Touch anywhere on the page body works like the space bar (the clock also answers the mouse).
  usePointerHold({ onPress: t.keyDown, onRelease: t.keyUp, onCancel: t.disarm });

  return (
    <Workbench layout={LAYOUT}>
      <ScramblePanel key={t.cube?.scramble} cube={t.cube} error={t.error} canRescramble={t.phase === 'idle'} onRescramble={t.nextScramble}
                     saved={fav.has(t.cube?.scramble ?? null)} favoriteCount={fav.favorites.length}
                     onToggleSaved={() => t.cube && fav.toggle(t.cube.scramble)} onOpenFavorites={() => setFavOpen(true)} />
      <TimerPanel phase={t.phase} display={t.display} last={t.last} solves={t.solves} onTap={t.tap}
                  onPenalty={t.setPenalty} onDiscard={t.discard} />
      <StatsPanel solves={t.solves} cube={t.cube} />
      {favOpen ? <FavoritesDialog favorites={fav.favorites} onLoad={t.loadScramble} onRemove={fav.remove} onClose={() => setFavOpen(false)} /> : null}
    </Workbench>
  );
}
