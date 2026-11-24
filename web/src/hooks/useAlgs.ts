import { useEffect, useState } from 'react';
import { fetchAlgs } from '../lib/api';
import type { AlgData } from '../lib/types';

type AlgState = { data: AlgData | null; error: string | null };

/** The algorithm list, fetched when the page opens. */
export function useAlgs() {
  const [state, setState] = useState<AlgState>({ data: null, error: null });

  useEffect(() => {
    let live = true;
    fetchAlgs().then(res => {
      if (live) setState(res.ok ? { data: res.data, error: null } : { data: null, error: res.error });
    });
    return () => { live = false; };
  }, []);

  return state;
}
