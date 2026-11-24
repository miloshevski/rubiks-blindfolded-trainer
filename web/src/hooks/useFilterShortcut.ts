import { useRef } from 'react';
import { useGlobalKeys } from './useGlobalKeys';

/** A filter input that "/" focuses (Algorithms and Pairs). */
export function useFilterShortcut() {
  const filterRef = useRef<HTMLInputElement>(null);
  useGlobalKeys(e => {
    if (e.key === '/') { e.preventDefault(); filterRef.current?.focus(); }
  });
  return filterRef;
}
