import { translate, useLocal } from '../lib/local';
import { Button } from '../components/ui/Button';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CubeHandle } from '../components/cube/Cube3D';
import { SolveControls } from '../components/header/SolveControls';
import { Workbench } from '../components/layout/Workbench';
import { PhoneTabs, type PhoneTab } from '../components/solve/PhoneTabs';
import { Rail } from '../components/solve/Rail';
import { SolutionSheet } from '../components/solve/SolutionSheet';
import { StageColumn } from '../components/solve/StageColumn';
import type { Speed } from '../components/solve/Transport';
import { useCube } from '../hooks/useCube';
import { useGlobalKeys } from '../hooks/useGlobalKeys';
import { usePlayback } from '../hooks/usePlayback';
import { usePractice } from '../hooks/usePractice';
import { oneOf, useStoredState } from '../hooks/useStoredState';
import { useViewRotation } from '../hooks/useViewRotation';
import { parseSolution, displaySolution } from '../lib/solution';
import type { LetterMode } from '../lib/types';

const LETTER_CODEC = oneOf<LetterMode>('off', 'absolute', 'relative');
const SPEED_CODEC = oneOf<Speed>('2', '5', '10');

// Phone: one column (cube, tabs, then the active section); medium: rail beside cube over
// solution; wide (≥1280px): rail | cube | solution. Tablets (touch, 760–1279px) use the section
// tabs too, with the cube full width above them in portrait, or beside them in landscape.
const LAYOUT =
  'grid-cols-[minmax(0,1fr)] [grid-template-areas:"stage"_"tabs"_"rail"_"sheet"] '
  + 'md:grid-cols-[minmax(280px,330px)_minmax(0,1fr)] md:[grid-template-areas:"rail_stage"_"rail_sheet"] '
  + 'xl:grid-cols-[minmax(300px,340px)_minmax(0,1fr)_minmax(440px,580px)] xl:[grid-template-areas:"rail_stage_sheet"] '
  + 'tablet-portrait:grid-cols-[minmax(0,1fr)] tablet-portrait:[grid-template-areas:"stage"_"tabs"_"rail"_"sheet"] '
  + 'tablet-landscape:grid-cols-[minmax(0,1fr)_minmax(360px,42%)] tablet-landscape:grid-rows-[auto_minmax(0,1fr)] '
  + 'tablet-landscape:[grid-template-areas:"stage_tabs"_"stage_panel"]';

/** Solve: a scramble, its memo and solution, playback on the 3D cube, and a recall check. */
export default function SolvePage() {
  const { data: local } = useLocal();
  const [hideMemo, setHideMemo] = useState(false), [hideAlgs, setHideAlgs] = useState(false), [hint, setHint] = useState(0), [copied, setCopied] = useState('');
  const [letterMode, setLetterMode] = useStoredState<LetterMode>('bld.letters', 'off', LETTER_CODEC);
  const [speed, setSpeed] = useStoredState<Speed>('bld.speed', '5', SPEED_CODEC);
  const [tab, setTab] = useState<PhoneTab>('solution');

  const cubeHandle = useRef<CubeHandle>(null);
  const rotation = useViewRotation();
  const { outcome, practice, check, clear: clearPractice } = usePractice();

  // The cube and the playback need each other: a new scramble resets playback, and playback
  // reads the cube. `onLoaded` goes through a stable callback so the order does not matter.
  const resetRef = useRef<() => void>(() => {});
  const onLoaded = useCallback(() => { clearPractice(); resetRef.current(); }, [clearPractice]);
  const { current, scramble, setScramble, error, parity, changeParity, random, apply } = useCube(onLoaded);

  const sections = useMemo(() => (current ? parseSolution(current.solution) : []), [current, local.activeScheme]);
  const refRows = useMemo(() => sections.flatMap(s => s.rows), [sections]);
  const edgeRows = useMemo(() => sections.find(s => s.kind === 'edges')?.rows ?? [], [sections]);
  const hasParity = sections.some(s => s.kind === 'parity');

  const playback = usePlayback({ current, practice, refRows, speed: Number(speed), cube: cubeHandle });
  const { pause, reset: resetPlayback, leaveMine, switchSource, play, jumpTo } = playback;
  useEffect(() => { resetRef.current = () => { pause(); resetPlayback(); }; }, [pause, resetPlayback]);
  useEffect(() => pause, [pause]);   // leaving the page stops a running playback

  const runCheck = async (edges: string, corners: string, withParity: boolean) => {
    if (!current) return;
    await check(current.scramble, edges, corners, withParity, parity);
    leaveMine();
  };
  const renderMine = () => { if (!practice) return; switchSource('mine'); play(); };
  const jumpToRow = useCallback((p: number) => jumpTo(p, 'ref'), [jumpTo]);

  // Space play/pause, ←/→ step a move, ⇧←/→ step a target, R random scramble.
  useGlobalKeys((e, t) => {
    if (e.key === ' ') { if (t?.closest('button')) return; e.preventDefault(); play(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); if (e.shiftKey) playback.stepTarget(1); else playback.step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (e.shiftKey) playback.stepTarget(-1); else playback.step(-1); }
    else if (e.key === 'r' || e.key === 'R') random();
  });

  useEffect(() => { setHint(0); }, [current?.scramble, playback.pos]);
  const active = [...(current?.steps ?? [])].reverse().find(s => s.start <= playback.pos) ?? current?.steps?.at(-1);
  const marks = active?.target_sticker ? { key: active.target_sticker, mark: 'target' as const, reveal: null, others: { ...(active.buffer_sticker ? { [active.buffer_sticker]: 'ok' as const } : {}), ...Object.fromEntries((practice?.wrong_stickers ?? []).map(k => [k, 'bad' as const])) } } : null;
  const controls = (
    <><SolveControls scramble={scramble} onScramble={setScramble} error={error} onApply={apply} onRandom={random}
                   moveCount={current ? current.scramble.split(' ').length : null} parity={parity} onParity={changeParity} />
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setHideMemo(v => !v)}>{hideMemo ? 'Reveal memo' : 'Hide memo'}</Button>
        <Button onClick={() => setHideAlgs(v => !v)}>{hideAlgs ? 'Reveal algorithms' : 'Hide algorithms'}</Button>
        <Button onClick={() => setHint(n => (n+1)%4)}>Hint {hint}/3</Button>
        <Button onClick={() => { pause(); resetPlayback(); clearPractice(); setHint(0); }}>Retry</Button>
        <Button onClick={async () => { try { await navigator.clipboard.writeText(location.href); setCopied('Link copied'); } catch { setCopied(location.href); } }}>Share</Button>
        <details><summary className="cursor-pointer text-ink-3">Keys / help</summary><p>Space play/pause · ←/→ move · Shift+←/→ target · R random. Amber marks the target, green marks the buffer; red marks remaining mistakes. Recall letters are executed exactly as typed.</p></details>
        <span role="status">{copied}</span>
        {hint > 0 && active && <span className="font-mono text-accent">{active.phase}: {active.memo_target ? translate(active.memo_target, active.phase === 'corners' ? 'corners' : 'edges') : 'parity'}{hint > 1 && active.execution_target ? ` → ${translate(active.execution_target, active.phase === 'corners' ? 'corners' : 'edges')}` : ''}{hint > 1 ? ` · setup ${active.setup || '(dedicated algorithm)'}` : ''}{hint > 2 ? ` ${active.algorithm}` : ''}</span>}
      </div></>
  );

  return (
    <Workbench layout={LAYOUT} controls={controls}>
      <PhoneTabs active={tab} onChange={setTab} />
      <Rail hideMemo={hideMemo} tab={tab} current={current} edgeRows={edgeRows} hasParity={hasParity} view={playback.view} pos={playback.pos}
            letterMode={letterMode} outcome={outcome} parityAlg={parity} onCheck={runCheck} onRenderMine={renderMine} />
      <StageColumn drill={false} cubeRef={cubeHandle} rotation={rotation} view={playback.view}
                   letterMode={letterMode} onLetterMode={setLetterMode} absoluteLetters={current?.absolute_letters ?? null}
                   marks={marks} playback={playback} loaded={!!current} canPlayMine={!!practice} speed={speed} onSpeed={setSpeed} />
      <SolutionSheet tab={tab} sections={hideAlgs ? [] : sections} parityAlg={parity} moveCount={current ? current.frames.length : null}
                     verified={current ? current.verified : null} solutionText={hideAlgs ? '' : displaySolution(current?.solution ?? '')}
                     pos={playback.pos} source={playback.source} playing={playback.playing} onJump={jumpToRow} />
    </Workbench>
  );
}
