import { cn } from '../../lib/cn';
import type { AlgRow } from '../../lib/types';
import { ALG, Badge, Meta, tokenClass } from '../ui/text';

const ROW = 'grid items-baseline gap-x-3 px-5 py-[5px] hover:bg-row-hover max-lg:gap-x-2.5 max-lg:px-4';
const STICKER = 'font-mono text-[11px] leading-[normal] text-ink-3';

/** Setup / swap / undo tokens. Dedicated algorithms (C, I, Q, S, W) show plain, M2 still marked. */
function AlgTokens({ row }: { row: AlgRow }) {
  const parts = [[row.setup, 'setup'], [row.core, 'core'], [row.undo, 'undo']] as const;
  return (
    <span className={ALG}>
      {parts.flatMap(([part, role]) => (part ? part.split(' ') : []).map((m, i) => (
        <span key={`${role}-${i}`} className={tokenClass(row.special && m !== 'M2' ? 'plain' : role)}>{m}</span>
      )))}
    </span>
  );
}

/** An edge or corner target: letter, sticker, algorithm (or "buffer"). */
export function PieceRow({ row, bufferNote }: { row: AlgRow; bufferNote: string }) {
  return (
    <div className={cn(ROW, 'grid-cols-[24px_38px_minmax(0,1fr)_auto]')}>
      <Badge tone={row.buffer ? 'buffer' : 'plain'}>{row.letter}</Badge>
      <span className={STICKER}>{row.sticker}</span>
      {row.buffer ? <span className="-ml-1 flex flex-wrap font-sans text-[12px] leading-5 text-ink-3">{bufferNote}</span> : <AlgTokens row={row} />}
      <span className="font-mono text-[11px] leading-[normal] whitespace-nowrap text-ink-2">{row.opposite ? `→ ${row.opposite}` : ''}</span>
    </div>
  );
}

/** A special edge, with the opposite letter executed instead on even targets (C ↔ W, I ↔ S). */
export function SpecialRow({ row, oppositeSticker }: { row: AlgRow; oppositeSticker: string | undefined }) {
  return (
    <div className={cn(ROW, 'grid-cols-[24px_38px_minmax(0,1fr)_82px]')}>
      <Badge>{row.letter}</Badge>
      <span className={STICKER}>{row.sticker}</span>
      <AlgTokens row={row} />
      {row.opposite ? (
        <span className="inline-flex items-center justify-end gap-1.5 self-center"
              title={`On even-numbered edge targets ${row.letter} (${row.sticker}) is executed as ${row.opposite} (${oppositeSticker})`}>
          <Meta>even →</Meta><Badge tone="accent">{row.opposite}</Badge>
        </span>
      ) : (
        <span className="inline-flex items-center justify-end gap-1.5 self-center"><Meta>—</Meta></span>
      )}
    </div>
  );
}

export function ParityRow({ number, alg, isDefault }: { number: number; alg: string; isDefault: boolean }) {
  return (
    <div className={cn(ROW, 'grid-cols-[24px_minmax(0,1fr)_auto]')}>
      <Badge small>{number}</Badge>
      <span className={ALG}>{alg.split(' ').map((m, i) => <span key={i} className={tokenClass('plain')}>{m}</span>)}</span>
      <span className="font-mono text-[11px] leading-[normal] whitespace-nowrap text-ink-2">{isDefault ? 'default' : ''}</span>
    </div>
  );
}
