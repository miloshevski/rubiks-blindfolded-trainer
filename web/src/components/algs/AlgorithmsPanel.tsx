import { useDeferredValue, useMemo, useState, type ReactNode, type Ref } from 'react';
import { cn } from '../../lib/cn';
import type { AlgData, AlgRow } from '../../lib/types';
import { INPUT, Meta, tokenClass } from '../ui/text';
import { ParityRow, PieceRow, SpecialRow } from './AlgRows';

const LEGEND_ITEM = 'inline-flex items-center gap-1.5';
const LEGEND = (
  <div className="flex flex-none flex-wrap gap-x-4 gap-y-1.5 border-b border-rule-soft px-5 py-2.5 text-[11.5px] text-ink-3 max-md:px-4">
    <span className={LEGEND_ITEM}><span className="font-mono">R U</span> setup</span>
    <span className={LEGEND_ITEM}><span className={cn('font-mono', tokenClass('core'))}>M2</span> swap / Y-perm</span>
    <span className={LEGEND_ITEM}><span className="font-mono text-ink-2">U' R'</span> undo</span>
    <span className={LEGEND_ITEM}><span className="font-mono text-ink-2">even → W</span> opposite letter, executed instead on even targets</span>
  </div>
);

const EMPTY = 'm-0 px-5 py-4 text-[12.5px] text-ink-3';

function Group({ title, meta, children, empty, className }: {
  title: string; meta: string; children: ReactNode[]; empty?: boolean; className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-baseline justify-between gap-2.5 px-5 pt-3.5 pb-1.5 max-md:px-4">
        <h3 className="m-0 text-[12px] font-semibold">{title}</h3>
        <Meta>{meta}</Meta>
      </div>
      {children}
      {empty ? <p className={EMPTY}>No match.</p> : null}
    </div>
  );
}

// A single character is a letter search; anything longer also matches sticker names and moves.
const matcher = (q: string) => (r: AlgRow) =>
  !q || (q.length === 1 ? r.letter.toLowerCase() === q : [r.letter, r.sticker, r.alg].some(s => s.toLowerCase().includes(q)));
const parityMatches = (q: string, p: { number: number; alg: string }) =>
  !q || (q.length === 1 ? q === 'p' /* "P" is how parity shows in the solution */
    : p.alg.toLowerCase().includes(q) || `parity ${p.number}`.includes(q));

interface Props {
  data: AlgData | null;
  error: string | null;
  filterRef: Ref<HTMLInputElement>;
}

/** Algorithms mode: every target letter, as the solver runs it. */
export function AlgorithmsPanel({ data, error, filterRef }: Props) {
  const [filter, setFilter] = useState('');
  const q = useDeferredValue(filter.trim().toLowerCase());

  return (
    <section className="flex min-h-0 min-w-0 flex-col [grid-area:algs]" aria-label="All algorithms">
      <div className="flex min-h-[53px] flex-none flex-wrap items-center justify-between gap-2.5 border-b border-rule px-5 py-2.5 max-md:px-4">
        <div className="flex items-baseline gap-2.5">
          <h2 className="m-0 text-[12px] font-semibold">Algorithms</h2>
          <Meta>every target letter, as the solver runs it</Meta>
        </div>
        <div className="flex min-w-0 flex-[0_1_320px] items-center gap-2 max-lg:flex-[1_0_100%]">
          <input ref={filterRef} className={INPUT} type="search" placeholder="Filter: letter, sticker or move" autoComplete="off"
                 spellCheck={false} aria-label="Filter algorithms" value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
      </div>
      {LEGEND}
      <div className="grid flex-[1_1_auto] grid-cols-2 content-start overflow-auto pb-5 max-lg:grid-cols-1">
        {data ? <AlgGroups data={data} q={q} />
          : <p className={EMPTY}>{error ? `Could not load the algorithms (${error}).` : 'Loading…'}</p>}
      </div>
    </section>
  );
}

function AlgGroups({ data, q }: { data: AlgData; q: string }) {
  const stickerOf = useMemo(() => new Map(data.edges.map(e => [e.letter, e.sticker])), [data]);
  const pairs = useMemo(
    () => [...new Set(data.edges.filter(r => r.opposite).map(r => [r.letter, r.opposite].sort().join(' ↔ ')))],
    [data],
  );
  const hit = matcher(q);
  const edges = data.edges.filter(r => !r.special && hit(r));
  const special = data.edges.filter(r => r.special && hit(r));
  const corners = data.corners.filter(hit);
  const parity = data.parity.filter(p => parityMatches(q, p));

  return (
    <>
      <div className="min-w-0">
        <Group title="Edges" meta="setup + M2 + undo · buffer DF" empty={!edges.length}>
          {edges.map(r => <PieceRow key={r.letter} row={r} bufferNote="buffer (DF)" />)}
        </Group>
        <Group title="Special edges" meta="own algorithms" empty={!special.length} className="mt-1.5 border-t border-rule-soft">
          {[
            <p key="note" className="mx-5 mt-0 mb-2 max-w-[62ch] text-[12px] leading-normal text-ink-2 max-lg:mx-4">
              On even-numbered edge targets (2nd, 4th, …) execute the opposite letter: {pairs.join(', ')}.
              {' '}Each M2 swaps UF and DB, so after an odd number of targets those stickers sit in each other's place.
            </p>,
            ...special.map(r => <SpecialRow key={r.letter} row={r} oppositeSticker={r.opposite ? stickerOf.get(r.opposite) : undefined} />),
          ]}
        </Group>
      </div>
      <Group title="Corners" meta="Old Pochmann · buffer UBL" empty={!corners.length}
             className="border-l border-rule max-lg:border-t max-lg:border-l-0">
        {corners.map(r => <PieceRow key={r.letter} row={r} bufferNote="buffer (UBL)" />)}
      </Group>
      <Group title="Parity" meta="after an odd number of edge targets" empty={!parity.length}
             className="col-span-full mt-2 border-t border-rule">
        {parity.map(p => <ParityRow key={p.number} number={p.number} alg={p.alg} isDefault={p.number === data.default_parity} />)}
      </Group>
    </>
  );
}
