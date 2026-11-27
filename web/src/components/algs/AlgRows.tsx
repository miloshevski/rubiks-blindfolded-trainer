import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import type { AlgRow } from '../../lib/types';
import { tokenClass } from '../ui/text';

const CARD = 'flex min-w-0 flex-col gap-2.5 rounded-md border border-rule bg-raise px-4 py-3.5 transition-colors duration-[120ms] hover:border-edge-2 hover:bg-raise-2';
const MOVES = 'flex flex-wrap gap-y-1 font-mono text-[17px] leading-7 -ml-1';

/** The big letter tile of a card. */
function Tile({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'buffer' | 'accent' }) {
  return (
    <span className={cn('inline-flex size-11 flex-none items-center justify-center rounded border font-mono text-[24px] leading-none font-semibold',
      tone === 'plain' && 'border-line-2 text-ink', tone === 'buffer' && 'border-dashed border-line-dim text-ink-3',
      tone === 'accent' && 'border-accent bg-accent-bg text-accent')}>
      {children}
    </span>
  );
}

/** Setup / swap / undo tokens. Dedicated algorithms (C, I, Q, S, W) show plain, M2 still marked. */
function AlgTokens({ row }: { row: AlgRow }) {
  const parts = [[row.setup, 'setup'], [row.core, 'core'], [row.undo, 'undo']] as const;
  return (
    <span className={MOVES}>
      {parts.flatMap(([part, role]) => (part ? part.split(' ') : []).map((m, i) => (
        <span key={`${role}-${i}`} className={cn(tokenClass(row.special && m !== 'M2' ? 'plain' : role), 'px-[5px]')}>{m}</span>
      )))}
    </span>
  );
}

function Head({ row, tone, children }: { row: AlgRow; tone?: 'plain' | 'buffer'; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Tile tone={tone}>{row.letter}</Tile>
      <div className="flex min-w-0 flex-col">
        <span className="font-mono text-[14px] font-medium text-ink">{row.sticker}</span>
        <span className="text-[11.5px] text-ink-3">{row.buffer ? 'buffer' : row.special ? 'own algorithm' : row.setup ? 'setup + swap + undo' : 'swap only'}</span>
      </div>
      {children}
    </div>
  );
}

/** An edge or corner target: letter, sticker, algorithm (or "buffer"). */
export function PieceRow({ row, bufferNote }: { row: AlgRow; bufferNote: string }) {
  if (row.buffer) {
    return (
      <div className={cn(CARD, 'border-dashed bg-transparent')}>
        <Head row={row} tone="buffer" />
        <p className="m-0 text-[13px] text-ink-3">The {bufferNote}. It is never a target, so it has no algorithm.</p>
      </div>
    );
  }
  return (
    <div className={CARD}>
      <Head row={row} />
      <AlgTokens row={row} />
    </div>
  );
}

/** A special edge, with the opposite letter executed instead on even targets (C ↔ W, I ↔ S). */
export function SpecialRow({ row, oppositeSticker }: { row: AlgRow; oppositeSticker: string | undefined }) {
  return (
    <div className={CARD}>
      <Head row={row}>
        {row.opposite && (
          <span className="ml-auto inline-flex flex-none items-center gap-2"
                title={`On even-numbered edge targets ${row.letter} (${row.sticker}) is executed as ${row.opposite} (${oppositeSticker})`}>
            <span className="text-[11.5px] text-ink-3">even →</span>
            <span className="inline-flex size-8 items-center justify-center rounded border border-accent bg-accent-bg font-mono text-[17px] font-semibold text-accent">{row.opposite}</span>
          </span>
        )}
      </Head>
      <AlgTokens row={row} />
    </div>
  );
}

export function ParityRow({ number, alg, isDefault }: { number: number; alg: string; isDefault: boolean }) {
  return (
    <div className={CARD}>
      <div className="flex items-center gap-3">
        <Tile>{number}</Tile>
        <div className="flex flex-col">
          <span className="text-[14px] font-medium text-ink">Parity algorithm {number}</span>
          <span className="text-[11.5px] text-ink-3">{isDefault ? 'default' : 'alternative'}</span>
        </div>
      </div>
      <span className={MOVES}>{alg.split(' ').map((m, i) => <span key={i} className={cn(tokenClass('plain'), 'px-[5px]')}>{m}</span>)}</span>
    </div>
  );
}
