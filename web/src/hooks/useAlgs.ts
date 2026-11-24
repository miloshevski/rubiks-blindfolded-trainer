import { useEffect, useState } from 'react';
import { translate, useLocal } from '../lib/local';
import fallback from '../data/algorithms.json';
import { fetchAlgs } from '../lib/api';
import type { AlgData } from '../lib/types';

type AlgState = { data: AlgData | null; error: string | null };

/** The algorithm list, fetched when the page opens. */
export function useAlgs() {
  const { data: local } = useLocal();
  const [state, setState] = useState<AlgState>({ data: null, error: null });

  useEffect(() => {
    let live = true;
    fetchAlgs().then(res => {
      if (live) setState(res.ok ? { data: res.data, error: null } : { data: fallback as AlgData, error: null });
    });
    return () => { live = false; };
  }, []);

  void local;
  return { ...state, data: state.data ? { ...state.data, edges: state.data.edges.map(r => ({ ...r, letter: translate(r.letter, 'edges'), opposite: r.opposite ? translate(r.opposite, 'edges') : null })), corners: state.data.corners.map(r => ({ ...r, letter: translate(r.letter, 'corners') })) } : null };
}
