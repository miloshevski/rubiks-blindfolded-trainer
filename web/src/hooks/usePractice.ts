import { useCallback, useEffect, useRef, useState } from 'react';
import { translate } from '../lib/local';
import { checkSolution } from '../lib/api';
import type { CheckResult, ParityAlg } from '../lib/types';

/** Outcome of the last recall check: the server's verdict, or why it could not run. */
export type PracticeOutcome =
  { ok: true; result: CheckResult } | { ok: false; error: string } | null;

/** Recall check: the user's letters (as executed) are run on the scramble by the server. */
export function usePractice() {
  const request = useRef(0);
  useEffect(
    () => () => {
      request.current++;
    },
    [],
  );
  const [outcome, setOutcome] = useState<PracticeOutcome>(null);

  const clear = useCallback(() => {
    request.current++;
    setOutcome(null);
  }, []);

  const check = useCallback(
    async (
      scramble: string,
      edges: string,
      corners: string,
      parity: boolean,
      parityAlg: ParityAlg,
    ) => {
      const serial = ++request.current;
      const res = await checkSolution(
        scramble,
        translate(edges, 'edges', true),
        translate(corners, 'corners', true),
        parity,
        parityAlg,
      );
      if (serial !== request.current) return;
      setOutcome(res.ok ? { ok: true, result: res.data } : { ok: false, error: res.error });
    },
    [],
  );

  const practice = outcome?.ok ? outcome.result : null;
  return { outcome, practice, check, clear };
}
