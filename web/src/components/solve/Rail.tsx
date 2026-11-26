import type { ReactNode } from 'react';
import type { PracticeOutcome } from '../../hooks/usePractice';
import { cn } from '../../lib/cn';
import type { SolutionRow } from '../../lib/solution';
import type { CubeData, CubeView, LetterMode, ParityAlg } from '../../lib/types';
import { Net } from '../cube/Net';
import { SectionHead } from '../ui/text';
import { Zoomable } from '../ui/Zoomable';
import { MemoPanel, memoTargets } from './MemoPanel';
import { tabVisibility, type PhoneTab } from './PhoneTabs';
import { RecallCheck } from './RecallCheck';

function RailSection({ tab, active, children }: { tab: PhoneTab; active: PhoneTab; children: ReactNode }) {
  return (
    <section className={cn('border-b border-rule px-5 pt-[18px] pb-5 last:border-b-0 max-md:border-b-0 max-md:px-4', tabVisibility(tab, active))}>
      {children}
    </section>
  );
}

interface Props {
  tab: PhoneTab;
  current: CubeData | null;
  edgeRows: SolutionRow[];
  hasParity: boolean;
  view: CubeView | null;
  pos: number;
  letterMode: LetterMode;
  outcome: PracticeOutcome;
  parityAlg: ParityAlg;
  onCheck: (edges: string, corners: string, parity: boolean) => void;
  onRenderMine: () => void;
}

/** Left column of Solve mode: memo, unfolded cube, recall check. */
export function Rail({ tab, current, edgeRows, hasParity, view, pos, letterMode, outcome, parityAlg, onCheck, onRenderMine }: Props) {
  return (
    <aside className="overflow-auto border-r border-rule [grid-area:rail] max-xl:overflow-visible max-md:border-r-0
                      tablet:border-r-0 tablet-landscape:overflow-auto tablet-landscape:[grid-area:panel]">
      <RailSection tab="memo" active={tab}>
        <SectionHead title="Memo" meta={current ? memoTargets(current.edge_memo, current.corner_memo) : ''} />
        {current ? (
          <Zoomable label="memo" width={340} maxZoom={2.2} className="rounded">
            <MemoPanel edgeMemo={current.edge_memo} cornerMemo={current.corner_memo} edgeCycles={current.edge_cycles} cornerCycles={current.corner_cycles} edgeRows={edgeRows} hasParity={hasParity} />
          </Zoomable>
        ) : null}
      </RailSection>
      <RailSection tab="net" active={tab}>
        <SectionHead title="Net" meta={pos ? `in step · move ${pos}` : 'scrambled'} />
        <Zoomable label="net" className="w-fit rounded">
          <Net view={view} letterMode={letterMode} absoluteLetters={current?.absolute_letters ?? null} />
        </Zoomable>
      </RailSection>
      <RailSection tab="check" active={tab}>
        <SectionHead title="Recall check" meta="letters as executed" tight />
        <RecallCheck outcome={outcome} parityAlg={parityAlg} edgeMemo={current?.edge_memo ?? ''} cornerMemo={current?.corner_memo ?? ''} onCheck={onCheck} onRender={onRenderMine} />
      </RailSection>
    </aside>
  );
}
