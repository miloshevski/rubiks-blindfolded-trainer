import { useSyncExternalStore } from 'react';
import type { AppMode } from './types';

/** One page per mode, addressed by its slug. */
export const MODE_PATH: Record<AppMode, string> = {
  solve: '/solve',
  drill: '/letter-drill',
  algs: '/algorithms',
  pairs: '/pairs',
};

const MODES = Object.keys(MODE_PATH) as AppMode[];

/** Unknown paths (including "/") are Solve. */
function modeOf(pathname: string): AppMode {
  const path = pathname.replace(/\/+$/, '');
  return MODES.find(m => MODE_PATH[m] === path) ?? 'solve';
}

const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
}

/** The current mode, read from the URL path (no router library needed for four pages). */
export function useMode(): AppMode {
  return useSyncExternalStore(subscribe, () => modeOf(location.pathname), () => 'solve');
}

export function navigate(mode: AppMode) {
  if (location.pathname !== MODE_PATH[mode]) history.pushState(null, '', MODE_PATH[mode]);
  emit();
}

/** Makes the address bar match the page that is shown (e.g. "/" → "/solve"). */
export function canonicalizeUrl() {
  const path = MODE_PATH[modeOf(location.pathname)];
  if (location.pathname !== path) history.replaceState(null, '', path + location.search);
}
