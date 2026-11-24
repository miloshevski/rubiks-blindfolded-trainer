import { useEffect, useState } from 'react';
import { fetchAlgs } from '../lib/api';
import type { AlgData } from '../lib/types';

type AlgState = { data: AlgData | null; error: string | null };

/** The algorithm list, fetched the first time it is needed and kept after that. */
export function useAlgs(enabled: boolean) {
  const [state, setState] = useState<AlgState>({ data: null, error: null });
  const needed = enabled && !state.data;

  useEffect(() => {
    if (!needed) return;
    let live = true;
    fetchAlgs().then(res => {
      if (live) setState(res.ok ? { data: res.data, error: null } : { data: null, error: res.error });
    });
    return () => { live = false; };
  }, [needed]);

  return state;
}
