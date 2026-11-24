import { lazy, Suspense, useState, type FormEvent } from 'react';
import type { PracticeOutcome } from '../../hooks/usePractice';
import type { CheckResult, ParityAlg } from '../../lib/types';
import { Button } from '../ui/Button';
import { IconBad, IconOk } from '../ui/icons';
import { INPUT, Meta } from '../ui/text';

// The dictionary is only fetched the first time the pairs are shown.
const PairWords = lazy(() => import('./PairWords'));

interface Props {
  hideMemo?: boolean;
  outcome: PracticeOutcome;
  parityAlg: ParityAlg;
  /** The computer's memo letters, used by the Pairs box while nothing is typed. */
  edgeMemo: string;
  cornerMemo: string;
  onCheck: (edges: string, corners: string, parity: boolean) => void;
  onRender: () => void;
}

/** Type the solution as executed; the server runs it on the scramble and says what is wrong. */
export function RecallCheck({ outcome, parityAlg, edgeMemo, cornerMemo, onCheck, onRender, hideMemo }: Props) {
  const [edges, setEdges] = useState('');
  const [corners, setCorners] = useState('');
  const [parity, setParity] = useState(false);
  const [showPairs, setShowPairs] = useState(false);
  const result = outcome?.ok ? outcome.result : null;

  const submit = (e: FormEvent) => { e.preventDefault(); onCheck(edges, corners, parity); };

  return (
    <>
      <form className="mt-3 flex flex-col gap-3" autoComplete="off" onSubmit={submit}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="p-edges" className="text-[12px] text-ink-2">Edges</label>
          <input id="p-edges" className={INPUT} type="text" placeholder="e.g. hs ef bo sa gn p" spellCheck={false}
                 value={edges} onChange={e => setEdges(e.target.value)} aria-invalid={result && !result.edges_correct ? true : undefined} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="p-corners" className="text-[12px] text-ink-2">Corners</label>
          <input id="p-corners" className={INPUT} type="text" placeholder="e.g. bn cs wj dg" spellCheck={false}
                 value={corners} onChange={e => setCorners(e.target.value)} aria-invalid={result && !result.corners_correct ? true : undefined} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px]" title="Uses the parity algorithm selected in the bar">
            <input type="checkbox" checked={parity} onChange={e => setParity(e.target.checked)}
                   className="m-0 inline-grid size-4 touch:size-5 cursor-pointer appearance-none place-content-center rounded-[3px] border border-edge-2 bg-sunk
                              checked:border-ink checked:bg-ink checked:after:h-1 checked:after:w-2 checked:after:-translate-y-px
                              checked:after:-rotate-45 checked:after:border-b-2 checked:after:border-l-2 checked:after:border-bg checked:after:content-['']" />
            Parity <Meta>alg {parityAlg}</Meta>
          </label>
          <div className="flex gap-2">
            <Button aria-pressed={showPairs} onClick={() => setShowPairs(v => !v)}
                    className={showPairs ? 'border-accent text-accent' : undefined}>Pairs</Button>
            <Button disabled={!result} onClick={onRender}>Render mine</Button>
            <Button type="submit" variant="primary">Check</Button>
          </div>
        </div>
      </form>
      {showPairs ? <Suspense fallback={null}><PairWords edges={edges} corners={corners} fallbackEdges={hideMemo ? '' : edgeMemo} fallbackCorners={hideMemo ? '' : cornerMemo} /></Suspense> : null}
      {outcome ? (
        <div className="mt-4 border-t border-rule pt-3.5" aria-live="polite">
          {outcome.ok ? <Verdict result={outcome.result} /> : <div className={VERDICT_BAD}>{IconBad}{outcome.error}</div>}
        </div>
      ) : <div aria-live="polite" />}
    </>
  );
}

const VERDICT = 'flex items-center gap-2 text-[13px] font-semibold';
const VERDICT_BAD = `${VERDICT} text-bad`;

function Verdict({ result }: { result: CheckResult }) {
  const line = (name: string, ok: boolean, wrong?: string[]) => [
    <dt key={`${name}-t`} className="text-ink-3">{name}</dt>,
    <dd key={`${name}-d`} className={ok ? 'm-0 text-ok' : 'm-0 text-bad'}>
      {ok ? 'correct' : wrong?.length ? `wrong ${wrong.join(' ')}` : 'wrong'}
    </dd>,
  ];
  return (
    <>
      <div className={result.correct ? `${VERDICT} text-ok` : VERDICT_BAD}>
        {result.correct ? IconOk : IconBad}{result.correct ? 'Correct: the cube is solved' : 'Not solved'}
      </div>
      <dl className="mt-2.5 grid grid-cols-[64px_minmax(0,1fr)] gap-y-1.5 font-mono text-[12.5px] leading-[normal]">
        {line('edges', result.edges_correct, result.wrong_edges)}
        {line('corners', result.corners_correct, result.wrong_corners)}
        {result.centers_correct === undefined ? null : line('centers', result.centers_correct !== false)}
      </dl>
      {result.note ? <p className="mt-2.5 text-[12px] text-ink-2">{result.note}</p> : null}
    </>
  );
}
