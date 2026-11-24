import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCube } from '../lib/api';
import type { CubeData, ParityAlg } from '../lib/types';

/** The scramble being worked on and the solution the server computed for it. */
export function useCube(onLoaded: () => void) {
  const [parity, setParity] = useState<ParityAlg>('1');
  const [scramble, setScramble] = useState('');
  const [current, setCurrent] = useState<CubeData | null>(null);
  const [error, setError] = useState('');
  const loaded = useRef(onLoaded);
  loaded.current = onLoaded;

  /** Loads `text` (empty: a random scramble) and tells the page once it has arrived. */
  const load = useCallback(async (text: string, parityAlg: ParityAlg) => {
    setError('');
    const res = await fetchCube(text, parityAlg);
    if (!res.ok) { setError(res.error); return; }
    setCurrent(res.data);
    setScramble(res.data.scramble);
    loaded.current();
  }, []);

  // First scramble, once per mount (StrictMode runs effects twice in development).
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    load('', '1');
  }, [load]);

  const random = () => { setScramble(''); load('', parity); };
  const apply = () => load(scramble.trim(), parity);
  const changeParity = (p: ParityAlg) => { setParity(p); if (current) load(current.scramble, p); };

  return { current, scramble, setScramble, error, parity, changeParity, random, apply };
}
