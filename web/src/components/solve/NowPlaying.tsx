import { PHASE_NAME, type Segment } from '../../lib/solution';

const LAB = 'text-[12px] text-ink-3';
const BIG = 'font-mono text-[40px] leading-none font-medium tracking-[-.01em] max-md:text-[26px]';

interface Props {
  segment: Segment | undefined;
  move: string | null;     // move just played, null at the start
  total: number;
}

/** The line under the cube: current phase and target, and the move just played. */
export function NowPlaying({ segment, move, total }: Props) {
  const phase = segment
    ? `${PHASE_NAME[segment.phase]}${segment.phase === 'parity' ? '' : ' · target'}`
    : total ? 'Scrambled · space to play' : 'Nothing to play';
  return (
    <div className="pointer-events-none absolute bottom-[18px] left-1/2 flex -translate-x-1/2 items-baseline gap-3.5 whitespace-nowrap
                    max-md:bottom-2.5 max-md:gap-2.5" aria-live="off">
      <span className={LAB}>{phase}</span>
      <span className={BIG}>{segment && segment.phase !== 'parity' ? segment.letter : ''}</span>
      <span className="font-mono text-[12px] leading-[normal] text-ink-2">{segment?.exec ? `as ${segment.exec}` : ''}</span>
      {move === null ? null : (
        <>
          <span className="h-[22px] w-px self-center bg-edge" />
          <span className={LAB}>move</span>
        </>
      )}
      <span className={BIG}>{move ?? ''}</span>
    </div>
  );
}
