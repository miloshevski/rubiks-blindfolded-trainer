import { useCallback, useState } from 'react';
import { readStored, writeStored } from '../lib/storage';

export interface Codec<T> {
  parse(raw: string): T | null;
  serialize(value: T): string;
}

/** Codec for a string that must be one of `values`. */
export function oneOf<T extends string>(...values: T[]): Codec<T> {
  return {
    parse: raw => ((values as string[]).includes(raw) ? (raw as T) : null),
    serialize: v => v,
  };
}

/** useState that starts from, and writes back to, localStorage[key]. */
export function useStoredState<T>(key: string, fallback: T, codec: Codec<T>) {
  const [value, setValue] = useState<T>(() => {
    const raw = readStored(key);
    return (raw == null ? null : codec.parse(raw)) ?? fallback;
  });
  const update = useCallback((next: T) => {
    setValue(next);
    writeStored(key, codec.serialize(next));
  }, [key, codec]);
  return [value, update] as const;
}
