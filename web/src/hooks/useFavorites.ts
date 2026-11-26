import { useCallback } from 'react';
import { useStoredState, type Codec } from './useStoredState';

const MAX = 200;

const codec: Codec<string[]> = {
  parse(raw) {
    try {
      const data: unknown = JSON.parse(raw);
      return Array.isArray(data) ? data.filter((s): s is string => typeof s === 'string' && !!s.trim()).slice(0, MAX) : null;
    } catch {
      return null;
    }
  },
  serialize: v => JSON.stringify(v.slice(0, MAX)),
};

/** Saved scrambles, newest first, kept in this browser (localStorage). */
export function useFavorites() {
  const [favorites, setFavorites] = useStoredState<string[]>('bld.favorites', [], codec);

  /** Saves the scramble, or takes it out again when it is already saved. */
  const toggle = useCallback((scramble: string) => {
    const text = scramble.trim();
    if (!text) return;
    setFavorites(favorites.includes(text) ? favorites.filter(f => f !== text) : [text, ...favorites]);
  }, [favorites, setFavorites]);

  const remove = useCallback((scramble: string) => setFavorites(favorites.filter(f => f !== scramble)), [favorites, setFavorites]);

  return { favorites, has: (scramble: string | null) => !!scramble && favorites.includes(scramble.trim()), toggle, remove };
}

export type Favorites = ReturnType<typeof useFavorites>;
