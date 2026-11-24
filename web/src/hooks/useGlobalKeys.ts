import { useEffect } from 'react';
import { useLatest } from './useLatest';

/**
 * Page-wide keyboard shortcuts. The handler sees every keydown except those with a modifier or
 * aimed at a text field, together with the element they were aimed at.
 */
export function useGlobalKeys(handler: (e: KeyboardEvent, target: Element | null) => void) {
  const latest = useLatest(handler);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (e.metaKey || e.ctrlKey || e.altKey || t?.closest('input, textarea, select')) return;
      latest.current(e, t);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [latest]);
}

/** Like useGlobalKeys, for key releases (no modifier filter: letting go of Ctrl must not strand a held timer). */
export function useGlobalKeyUp(handler: (e: KeyboardEvent) => void) {
  const latest = useLatest(handler);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea, select')) return;
      latest.current(e);
    };
    document.addEventListener('keyup', onKey);
    return () => document.removeEventListener('keyup', onKey);
  }, [latest]);
}
