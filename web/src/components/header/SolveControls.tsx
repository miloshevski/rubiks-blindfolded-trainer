import type { ParityAlg } from '../../lib/types';
import { Segmented } from '../ui/Segmented';
import { PARITY } from './Header';
import { ScrambleForm } from './ScrambleForm';

interface Props {
  scramble: string;
  onScramble: (value: string) => void;
  moveCount: number | null;
  error: string;
  onApply: () => void;
  onRandom: () => void;
  loaded: string | null;
  parity: ParityAlg;
  onParity: (p: ParityAlg) => void;
}

/** The scramble and parity controls, which only belong in the Solve page's header. */
export function SolveControls({ scramble, onScramble, moveCount, error, onApply, onRandom, loaded, parity, onParity }: Props) {
  return (
    <>
      <ScrambleForm value={scramble} onChange={onScramble} moveCount={moveCount} invalid={!!error}
                    onApply={onApply} onRandom={onRandom} loaded={loaded} />
      <div className="flex items-center gap-2">
        <span id="parity-l" className="text-[12px] text-ink-3">Parity</span>
        <Segmented options={PARITY} value={parity} onChange={onParity} labelledBy="parity-l" />
      </div>
      {error ? <p id="msg" role="alert" className="m-0 shrink-0 grow basis-full font-mono text-[11.5px] leading-[normal] text-bad touch:order-last">{error}</p> : null}
    </>
  );
}
