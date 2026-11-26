import { useEffect } from 'react';
import { useLatest } from './useLatest';

interface Handlers {
  onPress: () => void;
  onRelease: () => void;
  onCancel: () => void;
}

const CONTROLS = 'button, a, input, select, textarea, dialog, [role=button], [data-no-hold]';

/**
 * Hold-and-release with a finger anywhere on the page body (inside <main>), like holding the space bar.
 * Buttons, links and anything marked `data-no-hold` keep their own taps; an element marked `data-hold`
 * (the clock) always counts, with the mouse too. A mouse elsewhere does nothing.
 */
export function usePointerHold(handlers: Handlers) {
  const latest = useLatest(handlers);
  useEffect(() => {
    let active: number | null = null;   // the pointer that is currently down

    const counts = (e: PointerEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (!t?.closest('main')) return false;
      if (t.closest('[data-hold]')) return true;
      return e.pointerType !== 'mouse' && !t.closest(CONTROLS);
    };
    const down = (e: PointerEvent) => {
      if (active !== null || (e.pointerType === 'mouse' && e.button !== 0) || !counts(e)) return;
      active = e.pointerId;
      (document.activeElement as HTMLElement | null)?.blur();
      latest.current.onPress();
    };
    const end = (call: 'onRelease' | 'onCancel') => (e: PointerEvent) => {
      if (e.pointerId !== active) return;
      active = null;
      latest.current[call]();
    };
    const up = end('onRelease');
    const cancel = end('onCancel');
    // A long press must not open the phone's context menu.
    const menu = (e: Event) => { if (active !== null) e.preventDefault(); };

    document.addEventListener('pointerdown', down);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', cancel);
    document.addEventListener('contextmenu', menu);
    return () => {
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', cancel);
      document.removeEventListener('contextmenu', menu);
    };
  }, [latest]);
}
