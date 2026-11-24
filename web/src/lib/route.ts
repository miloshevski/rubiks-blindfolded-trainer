import { useSyncExternalStore } from 'react';
import type { AppMode } from './types';

/** One page per mode, addressed by its slug. */
export const MODE_PATH: Record<AppMode, string> = {
  home: '/',
  learn: '/learn',
  practice: '/practice',
  timer: '/timer',
  stats: '/statistics',
  settings: '/settings',
  solve: '/solve',
  drill: '/letter-drill',
  algs: '/algorithms',
  pairs: '/pairs',
};

const MODES = Object.keys(MODE_PATH) as AppMode[];

/** Unknown paths resolve to Home. */
export function modeOf(pathname: string): AppMode {
  const path = pathname.replace(/\/+$/, '');
  return MODES.find((m) => MODE_PATH[m] === path) ?? 'home';
}

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
}

/** The current mode, read from the URL path (no router library needed). */
export function useMode(): AppMode {
  return useSyncExternalStore(
    subscribe,
    () => modeOf(location.pathname),
    () => 'home',
  );
}

export function navigate(mode: AppMode, params?: Record<string, string>) {
  const target = MODE_PATH[mode] + (params ? '?' + new URLSearchParams(params) : '');
  if (location.pathname + location.search !== target) history.pushState(null, '', target);
  emit();
}

/** Makes the address bar match the page that is shown (including trailing slash normalization). */
export function canonicalizeUrl() {
  const path = MODE_PATH[modeOf(location.pathname)];
  if (location.pathname !== path) history.replaceState(null, '', path + location.search);
}

export function useSearch() {
  return useSyncExternalStore(
    subscribe,
    () => location.search,
    () => '',
  );
}
