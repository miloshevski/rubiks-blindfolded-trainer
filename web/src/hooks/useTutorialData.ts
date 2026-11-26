import { useEffect, useState } from 'react';
import { fetchAlgs, fetchCube } from '../lib/api';
import { EXAMPLE_SCRAMBLE, FLIP_SCRAMBLE } from '../lib/tutorial';
import type { AlgData, CubeData, FaceStrings } from '../lib/types';

export interface TutorialData {
  algs: AlgData | null;
  /** Speffz letters of the solved cube. */
  letters: FaceStrings | null;
  example: CubeData | null;
  flips: CubeData | null;
}

/** Everything the lessons show live: the algorithm tables and two worked examples, all computed by the server. */
export function useTutorialData(): TutorialData {
  const [data, setData] = useState<TutorialData>({ algs: null, letters: null, example: null, flips: null });
  useEffect(() => {
    let live = true;
    Promise.all([fetchAlgs(), fetchCube(EXAMPLE_SCRAMBLE, '1'), fetchCube(FLIP_SCRAMBLE, '1')]).then(([algs, example, flips]) => {
      if (!live) return;
      setData({
        algs: algs.ok ? algs.data : null,
        letters: example.ok ? example.data.absolute_letters : null,
        example: example.ok ? example.data : null,
        flips: flips.ok ? flips.data : null,
      });
    });
    return () => { live = false; };
  }, []);
  return data;
}
