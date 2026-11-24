import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCube } from '../lib/api';
import { useSearch } from '../lib/route';
import { getLocal, updateLocal } from '../lib/local';
import type { CubeData, ParityAlg } from '../lib/types';

export function useCube(onLoaded: () => void) {
  const [parity, setParity] = useState<ParityAlg>('1'),
    [scramble, setScramble] = useState('');
  const [current, setCurrent] = useState<CubeData | null>(null),
    [error, setError] = useState('');
  const search = useSearch(),
    serial = useRef(0),
    requested = useRef<string | null>(null),
    loaded = useRef(onLoaded);
  loaded.current = onLoaded;
  const load = useCallback(async (text: string, p: ParityAlg) => {
    const request = ++serial.current;
    setError('');
    const key = `${text.trim()}|${p}`;
    requested.current = key;
    const result = await fetchCube(text, p);
    if (request !== serial.current) return;
    let cube: CubeData | null = result.ok ? result.data : null;
    if (!result.ok) {
      try {
        const cache = JSON.parse(getLocal().preferences['offline.solutions'] ?? '[]') as {
          key: string;
          cube: CubeData;
        }[];
        cube = cache.find((x) => x.key === key)?.cube ?? null;
      } catch {
        /* no valid cache */
      }
      if (!cube) {
        setError(
          result.error.includes('bad move')
            ? `Invalid scramble: ${result.error}`
            : `${result.error}. Full solving requires the Python server; offline lessons and timer remain available.`,
        );
        return;
      }
      setError('Offline: showing a previously verified cached solution.');
    }
    if (result.ok && cube) {
      updateLocal((d) => {
        let cache: { key: string; cube: CubeData }[] = [];
        try {
          cache = JSON.parse(d.preferences['offline.solutions'] ?? '[]');
        } catch {
          /* replace invalid cache */
        }
        const k = `${cube!.scramble}|${p}`;
        d.preferences['offline.solutions'] = JSON.stringify(
          [{ key: k, cube }, ...cache.filter((x) => x.key !== k)].slice(0, 10),
        );
      });
    }
    requested.current = `${cube!.scramble}|${p}`;
    history.replaceState(
      null,
      '',
      '/solve?' + new URLSearchParams({ scramble: cube!.scramble, parity: p }),
    );
    setCurrent(cube);
    setScramble(cube!.scramble);
    setParity(p);
    loaded.current();
  }, []);
  useEffect(() => {
    const q = new URLSearchParams(search),
      p = q.get('parity') ?? '1',
      text = q.get('scramble') ?? '';
    if (!['1', '2'].includes(p) || text.length > 2000 || (q.has('scramble') && !text.trim())) {
      serial.current++;
      setError('Invalid shared URL: supply a nonempty scramble and parity 1 or 2.');
      return;
    }
    if (requested.current !== `${text}|${p}`) load(text, p as ParityAlg);
  }, [search, load]);
  useEffect(
    () => () => {
      serial.current++;
      requested.current = null;
    },
    [],
  );
  return {
    current,
    scramble,
    setScramble,
    error,
    parity,
    random: () => load('', parity),
    apply: () => load(scramble.trim(), parity),
    changeParity: (p: ParityAlg) => {
      setParity(p);
      if (current) load(current.scramble, p);
    },
  };
}
