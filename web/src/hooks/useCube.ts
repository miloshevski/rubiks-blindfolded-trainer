import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCube } from '../lib/api';
import { decodeScramble, encodeScramble } from '../lib/scrambleCode';
import type { CubeData, ParityAlg } from '../lib/types';

const PARAM = 's';

// Kept for the whole visit (and across a refresh, via sessionStorage), so leaving the page and
// coming back shows the same scramble.
const STORE = 'bld.solve';
function restore(): { scramble: string; parity: ParityAlg } {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORE) ?? '');
    if (typeof saved.scramble === 'string' && (saved.parity === '1' || saved.parity === '2')) return saved;
  } catch { /* nothing saved, or storage unavailable */ }
  return { scramble: '', parity: '1' };
}
const remembered = restore();

/** The optional shared scramble in the address ("?s=9-0-10"), or '' when absent or malformed. */
function scrambleFromUrl() {
  const code = new URLSearchParams(location.search).get(PARAM);
  return code ? decodeScramble(code) ?? '' : '';
}

/** Puts the scramble in the address (for sharing) or removes it. */
function setUrlScramble(text: string | null) {
  const params = new URLSearchParams(location.search);
  const code = text ? encodeScramble(text) : null;
  if (code) params.set(PARAM, code); else params.delete(PARAM);
  const query = params.toString();
  history.replaceState(null, '', location.pathname + (query ? `?${query}` : ''));
}

/** The scramble being worked on and the solution the server computed for it. */
export function useCube(onLoaded: () => void) {
  const [parity, setParity] = useState<ParityAlg>(remembered.parity);
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
    remembered.scramble = res.data.scramble;
    remembered.parity = parityAlg;
    try { sessionStorage.setItem(STORE, JSON.stringify(remembered)); } catch { /* storage unavailable */ }
    setCurrent(res.data);
    setScramble(res.data.scramble);
    loaded.current();
  }, []);

  // First scramble, once per mount (StrictMode runs effects twice in development).
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    load(scrambleFromUrl() || remembered.scramble, remembered.parity);
  }, [load]);

  const random = () => { setScramble(''); setUrlScramble(null); load('', parity); };
  const apply = () => { const text = scramble.trim(); setUrlScramble(text); load(text, parity); };
  const changeParity = (p: ParityAlg) => { setParity(p); if (current) load(current.scramble, p); };

  return { current, scramble, setScramble, error, parity, changeParity, random, apply };
}
