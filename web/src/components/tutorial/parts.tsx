import { useMemo, type ReactNode } from 'react';
import { SOLVED_FACELETS } from '../../lib/cube';
import { parseSolution } from '../../lib/solution';
import type { AlgData, AlgRow, CubeData, CubeView, FaceStrings } from '../../lib/types';
import { cn } from '../../lib/cn';
import { PieceRow, ParityRow } from '../algs/AlgRows';
import { Net } from '../cube/Net';
import { MemoPanel } from '../solve/MemoPanel';

/** Body text. */
export const P = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cn('m-0 text-[14px] leading-[1.7] text-ink-2', className)}>{children}</p>
);

export const H = ({ children }: { children: ReactNode }) => <h3 className="m-0 mt-2 text-[13px] font-semibold text-ink">{children}</h3>;

export const UL = ({ children }: { children: ReactNode }) => (
  <ul className="m-0 flex list-disc flex-col gap-1.5 pl-5 text-[14px] leading-[1.65] text-ink-2">{children}</ul>
);
export const OL = ({ children }: { children: ReactNode }) => (
  <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-[14px] leading-[1.65] text-ink-2 marker:font-mono marker:text-ink-3">{children}</ol>
);

/** An inline letter or move. */
export const L = ({ children }: { children: ReactNode }) => (
  <code className="rounded-[3px] border border-line bg-sunk px-1 font-mono text-[12.5px] leading-[normal] text-accent">{children}</code>
);

/** A highlighted aside. */
export function Note({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="flex flex-col gap-1 rounded-md border border-accent/40 bg-accent-bg px-4 py-3">
      <b className="text-[12px] font-semibold tracking-[.06em] text-accent uppercase">{title}</b>
      <div className="text-[13.5px] leading-[1.65] text-ink-2">{children}</div>
    </aside>
  );
}

/** A question with its answer hidden until asked for. */
export function Try({ question, children }: { question: ReactNode; children: ReactNode }) {
  return (
    <details className="group rounded-md border border-rule bg-raise px-4 py-3 open:border-edge">
      <summary className="cursor-pointer list-none text-[13.5px] font-medium text-ink marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="mr-2 font-mono text-[11px] font-semibold tracking-[.08em] text-accent uppercase">Try it</span>
        {question}
        <span className="ml-2 text-[12px] text-ink-3 group-open:hidden">show answer</span>
      </summary>
      <div className="mt-2 text-[13.5px] leading-[1.65] text-ink-2">{children}</div>
    </details>
  );
}

/** A bordered block for live data. */
export const Box = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('rounded-md border border-rule bg-raise', className)}>{children}</div>
);

export const Loading = () => <Box className="px-4 py-3 text-[12.5px] text-ink-3">Loading the example…</Box>;

/** The solved cube's net with its Speffz letters. */
export function LetterNet({ letters }: { letters: FaceStrings | null }) {
  const view = useMemo<CubeView>(() => ({ facelets: SOLVED_FACELETS, letters }), [letters]);
  return (
    <Box className="w-fit max-w-full overflow-auto px-4 py-3">
      <Net view={view} letterMode="absolute" absoluteLetters={letters} />
    </Box>
  );
}

/** The memo of an example scramble, exactly as the Solve page shows it (cycles underlined, executed-as marked). */
export function ExampleMemo({ cube }: { cube: CubeData | null }) {
  const sections = useMemo(() => (cube ? parseSolution(cube.solution) : []), [cube]);
  if (!cube) return <Loading />;
  const edgeRows = sections.find(s => s.kind === 'edges')?.rows ?? [];
  return (
    <Box className="flex flex-col gap-3 px-4 py-4">
      <code className="font-mono text-[12px] leading-[1.6] break-words text-ink-3">{cube.scramble}</code>
      <MemoPanel edgeMemo={cube.edge_memo} cornerMemo={cube.corner_memo} edgeCycles={cube.edge_cycles} cornerCycles={cube.corner_cycles}
                 edgeRows={edgeRows} hasParity={sections.some(s => s.kind === 'parity')} />
    </Box>
  );
}

export const algRow = (rows: AlgRow[] | undefined, letter: string) => rows?.find(r => r.letter === letter);

/** Algorithm rows straight from the server's table (so they can never disagree with the solver). */
export function AlgTable({ rows, letters, note }: { rows: AlgRow[] | undefined; letters: string[]; note: string }) {
  const found = letters.map(l => algRow(rows, l)).filter((r): r is AlgRow => !!r);
  if (!found.length) return <Loading />;
  return (
    <Box className="-mx-0 overflow-hidden py-1">
      {found.map(r => <PieceRow key={r.letter} row={r} bufferNote={note} />)}
    </Box>
  );
}

export function ParityTable({ algs }: { algs: AlgData | null }) {
  if (!algs) return <Loading />;
  return (
    <Box className="py-1">
      {algs.parity.map(p => <ParityRow key={p.number} number={p.number} alg={p.alg} isDefault={p.number === algs.default_parity} />)}
    </Box>
  );
}
