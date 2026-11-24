import { Activity, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlgorithmsPanel } from './components/algs/AlgorithmsPanel';
import type { CubeHandle } from './components/cube/Cube3D';
import { DrillPanel } from './components/drill/DrillPanel';
import { Header } from './components/header/Header';
import { PhoneTabs, type PhoneTab } from './components/solve/PhoneTabs';
import { Rail } from './components/solve/Rail';
import { SolutionSheet } from './components/solve/SolutionSheet';
import { StageColumn } from './components/solve/StageColumn';
import type { Speed } from './components/solve/Transport';
import { useAlgs } from './hooks/useAlgs';
import { useDrill } from './hooks/useDrill';
import { useLatest } from './hooks/useLatest';
import { usePlayback } from './hooks/usePlayback';
import { usePractice } from './hooks/usePractice';
import { oneOf, useStoredState } from './hooks/useStoredState';
import { useViewRotation } from './hooks/useViewRotation';
import { fetchCube } from './lib/api';
import { cn } from './lib/cn';
import { SOLVED_FACELETS } from './lib/cube';
import { parseSolution } from './lib/solution';
import type { AppMode, CubeData, CubeView, LetterMode, ParityAlg } from './lib/types';

const MODE_CODEC = oneOf<AppMode>('solve', 'drill', 'algs');
const LETTER_CODEC = oneOf<LetterMode>('off', 'absolute', 'relative');
const SPEED_CODEC = oneOf<Speed>('2', '5', '10');
const DRILL_KEY = /^[a-x]$/i;

// Workbench grid per mode. Phone: one column (in Solve: cube, tabs, then the active section);
// medium: rail beside cube over solution; wide (≥1280px): rail | cube | solution.
// Tablets (touch, 760–1279px): Solve uses the section tabs too, with the cube full width above
// them in portrait, or beside them (each pane scrolling, fit to the screen) in landscape;
// the letter drill stacks under the cube in portrait.
const LAYOUT: Record<AppMode, string> = {
  solve: 'grid-cols-[minmax(0,1fr)] [grid-template-areas:"stage"_"tabs"_"rail"_"sheet"] '
    + 'md:grid-cols-[minmax(280px,330px)_minmax(0,1fr)] md:[grid-template-areas:"rail_stage"_"rail_sheet"] '
    + 'xl:grid-cols-[minmax(300px,340px)_minmax(0,1fr)_minmax(440px,580px)] xl:[grid-template-areas:"rail_stage_sheet"] '
    + 'tablet-portrait:grid-cols-[minmax(0,1fr)] tablet-portrait:[grid-template-areas:"stage"_"tabs"_"rail"_"sheet"] '
    + 'tablet-landscape:grid-cols-[minmax(0,1fr)_minmax(360px,42%)] tablet-landscape:grid-rows-[auto_minmax(0,1fr)] '
    + 'tablet-landscape:[grid-template-areas:"stage_tabs"_"stage_panel"]',
  drill: 'grid-cols-[minmax(0,1fr)] [grid-template-areas:"stage"_"drill"] '
    + 'md:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] md:[grid-template-areas:"stage_drill"] '
    + 'tablet-portrait:grid-cols-[minmax(0,1fr)] tablet-portrait:[grid-template-areas:"stage"_"drill"]',
  algs: 'grid-cols-[minmax(0,1fr)] [grid-template-areas:"algs"]',
};

export function App() {
  const [mode, storeMode] = useStoredState<AppMode>('bld.mode', 'solve', MODE_CODEC);
  const [letterMode, setLetterMode] = useStoredState<LetterMode>('bld.letters', 'off', LETTER_CODEC);
  const [speed, setSpeed] = useStoredState<Speed>('bld.speed', '5', SPEED_CODEC);
  const [parity, setParity] = useState<ParityAlg>('1');
  const [scramble, setScramble] = useState('');
  const [current, setCurrent] = useState<CubeData | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<PhoneTab>('solution');

  const cube = useRef<CubeHandle>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const rotation = useViewRotation();

  const sections = useMemo(() => (current ? parseSolution(current.solution) : []), [current]);
  const refRows = useMemo(() => sections.flatMap(s => s.rows), [sections]);
  const edgeRows = useMemo(() => sections.find(s => s.kind === 'edges')?.rows ?? [], [sections]);
  const hasParity = sections.some(s => s.kind === 'parity');

  const { outcome, practice, check, clear: clearPractice } = usePractice();
  const playback = usePlayback({ current, practice, refRows, speed: Number(speed), cube });
  const letters = current?.absolute_letters ?? null;
  const drill = useDrill(letters, rotation.showFace);
  const algs = useAlgs(mode === 'algs');
  const { pause, setStatus, reset: resetPlayback, leaveMine, switchSource, play, jumpTo } = playback;

  const load = useCallback(async (text: string, parityAlg: ParityAlg) => {
    pause();
    setStatus(null);
    setError('');
    const res = await fetchCube(text, parityAlg);
    if (!res.ok) { setError(res.error); return; }
    setCurrent(res.data);
    setScramble(res.data.scramble);
    clearPractice();
    resetPlayback();
  }, [clearPractice, pause, resetPlayback, setStatus]);

  // First scramble, once per page load (StrictMode runs effects twice in development).
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    load('', '1');
  }, [load]);

  // The drill needs the letters of the solved cube (they come with every scramble).
  const { round, next: drillNext, stop: drillStop } = drill;
  useEffect(() => {
    if (mode === 'drill' && letters && !round) drillNext();
  }, [mode, letters, round, drillNext]);

  const changeMode = (m: AppMode) => {
    storeMode(m);
    if (m !== 'drill') drillStop();
    if (m !== 'solve') pause();
  };
  const random = () => { setScramble(''); load('', parity); };
  const changeParity = (p: ParityAlg) => { setParity(p); if (current) load(current.scramble, p); };
  const runCheck = async (edges: string, corners: string, withParity: boolean) => {
    if (!current) return;
    await check(current.scramble, edges, corners, withParity, parity);
    leaveMine();
  };
  const renderMine = () => { if (!practice) return; switchSource('mine'); play(); };
  const jumpToRow = useCallback((p: number) => jumpTo(p, 'ref'), [jumpTo]);

  // Keyboard: space play/pause, ←/→ step a move, ⇧←/→ step a target, R random scramble;
  // drill: A–X answer, space / ↵ move on after a miss; algorithms: / focuses the filter.
  const onKey = useLatest((e: KeyboardEvent) => {
    const t = e.target instanceof Element ? e.target : null;
    if (e.metaKey || e.ctrlKey || e.altKey || t?.closest('input, textarea, select')) return;
    if (mode === 'drill') {
      if (DRILL_KEY.test(e.key)) { e.preventDefault(); drill.answer(e.key.toUpperCase()); }
      else if ((e.key === ' ' || e.key === 'Enter') && drill.round?.typed != null && !t?.closest('button')) {
        e.preventDefault();
        drill.next();
      }
      return;
    }
    if (mode === 'algs') {
      if (e.key === '/') { e.preventDefault(); filterRef.current?.focus(); }
      return;
    }
    if (e.key === ' ') { if (t?.closest('button')) return; e.preventDefault(); play(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); if (e.shiftKey) playback.stepTarget(1); else playback.step(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (e.shiftKey) playback.stepTarget(-1); else playback.step(-1); }
    else if (e.key === 'r' || e.key === 'R') random();
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey.current(e);
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onKey]);

  const drillView = useMemo<CubeView>(() => ({ facelets: SOLVED_FACELETS, letters }), [letters]);
  const solve = mode === 'solve';

  return (
    <>
      <Header mode={mode} onMode={changeMode} scramble={scramble} onScramble={setScramble}
              moveCount={current ? current.scramble.split(' ').length : null} error={error}
              onApply={() => load(scramble.trim(), parity)} onRandom={random} parity={parity} onParity={changeParity} />
      <main className={cn('grid min-h-0 flex-[1_1_auto]', LAYOUT[mode])}>
        {solve ? <PhoneTabs active={tab} onChange={setTab} /> : null}
        <Activity mode={solve ? 'visible' : 'hidden'}>
          <Rail tab={tab} current={current} edgeRows={edgeRows} hasParity={hasParity} view={playback.view} pos={playback.pos}
                letterMode={letterMode} outcome={outcome} parityAlg={parity} onCheck={runCheck} onRenderMine={renderMine} />
        </Activity>
        {mode === 'algs' ? null : (
          <StageColumn drill={mode === 'drill'} cubeRef={cube} rotation={rotation}
                       view={mode === 'drill' ? drillView : playback.view} letterMode={letterMode} onLetterMode={setLetterMode}
                       absoluteLetters={letters} marks={mode === 'drill' ? drill.marks : null} playback={playback}
                       loaded={!!current} canPlayMine={!!practice} speed={speed} onSpeed={setSpeed} />
        )}
        {solve ? (
          <SolutionSheet tab={tab} sections={sections} parityAlg={parity} moveCount={current ? current.frames.length : null}
                         verified={current ? current.verified : null} solutionText={current?.solution ?? ''}
                         pos={playback.pos} source={playback.source} playing={playback.playing} onJump={jumpToRow} />
        ) : null}
        {mode === 'drill' ? <DrillPanel drill={drill} /> : null}
        <Activity mode={mode === 'algs' ? 'visible' : 'hidden'}>
          <AlgorithmsPanel data={algs.data} error={algs.error} filterRef={filterRef} />
        </Activity>
      </main>
    </>
  );
}
