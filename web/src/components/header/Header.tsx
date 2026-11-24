import type { AppMode, ParityAlg } from '../../lib/types';
import { BrandMark } from '../ui/icons';
import { Segmented, type SegOption } from '../ui/Segmented';
import { ScrambleForm } from './ScrambleForm';

const MODES: readonly SegOption<AppMode>[] = [
  { value: 'solve', label: 'Solve' },
  { value: 'drill', label: 'Letter drill' },
  { value: 'algs', label: 'Algorithms' },
];

const PARITY: readonly SegOption<ParityAlg>[] = [
  { value: '1', title: "M2 U' M U2 M U' M' U2 M' U2", label: <><span className="font-mono">1</span> · M2 U' M U2…</> },
  { value: '2', title: "D' L2 D M2 D' L2 D", label: <><span className="font-mono">2</span> · D' L2 D…</> },
];

const brand = (
  <div className="flex items-center gap-2.5">
    {BrandMark}
    <b className="text-[13.5px] font-semibold tracking-[-.005em]">Blindfold Trainer</b>
    <span className="rounded-[3px] border border-line px-1.5 py-px font-mono text-[11px] leading-[normal] text-ink-3">M2 / OP</span>
  </div>
);

interface Props {
  mode: AppMode;
  onMode: (mode: AppMode) => void;
  scramble: string;
  onScramble: (value: string) => void;
  moveCount: number | null;
  error: string;
  onApply: () => void;
  onRandom: () => void;
  parity: ParityAlg;
  onParity: (p: ParityAlg) => void;
}

/** Command bar. The scramble and parity controls only belong to Solve mode. */
export function Header({ mode, onMode, scramble, onScramble, moveCount, error, onApply, onRandom, parity, onParity }: Props) {
  return (
    <header className="flex flex-none flex-wrap items-center gap-x-5 gap-y-2.5 border-b border-rule px-5 py-2.5 max-md:px-4 max-md:py-3">
      {brand}
      <Segmented options={MODES} value={mode} onChange={onMode} label="Mode" />
      {mode === 'solve' ? (
        <>
          <ScrambleForm value={scramble} onChange={onScramble} moveCount={moveCount} invalid={!!error}
                        onApply={onApply} onRandom={onRandom} />
          <div className="flex items-center gap-2">
            <span id="parity-l" className="text-[12px] text-ink-3">Parity</span>
            <Segmented options={PARITY} value={parity} onChange={onParity} labelledBy="parity-l" />
          </div>
          {error ? <p id="msg" role="alert" className="m-0 shrink-0 grow basis-full font-mono text-[11.5px] leading-[normal] text-bad">{error}</p> : null}
        </>
      ) : null}
    </header>
  );
}
