import { useEffect, useMemo, useRef } from 'react';
import type { CubeHandle } from '../components/cube/Cube3D';
import { DrillPanel } from '../components/drill/DrillPanel';
import { Workbench } from '../components/layout/Workbench';
import { StageColumn } from '../components/solve/StageColumn';
import { useDrill } from '../hooks/useDrill';
import { useGlobalKeys } from '../hooks/useGlobalKeys';
import { usePlayback } from '../hooks/usePlayback';
import { useSolvedLetters } from '../hooks/useSolvedLetters';
import { useViewRotation } from '../hooks/useViewRotation';
import { SOLVED_FACELETS } from '../lib/cube';
import type { CubeView } from '../lib/types';

const DRILL_KEY = /^[a-x]$/i;

// Stacks under the cube on phones and in tablet portrait; beside it from `md`.
const LAYOUT =
  'grid-cols-[minmax(0,1fr)] [grid-template-areas:"stage"_"drill"] '
  + 'md:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] md:[grid-template-areas:"stage_drill"] '
  + 'tablet-portrait:grid-cols-[minmax(0,1fr)] tablet-portrait:[grid-template-areas:"stage"_"drill"]';

const NO_OP = () => {};

/** Letter drill: a sticker of the solved cube blinks and the user types its letter. */
export default function DrillPage() {
  const cubeHandle = useRef<CubeHandle>(null);
  const rotation = useViewRotation();
  const letters = useSolvedLetters();
  const drill = useDrill(letters, rotation.showFace);
  const playback = usePlayback({ current: null, practice: null, refRows: [], speed: 5, cube: cubeHandle });

  // The drill needs the letters of the solved cube before the first round.
  const { round, next } = drill;
  useEffect(() => {
    if (letters && !round) next();
  }, [letters, round, next]);

  // A–X answer; space / ↵ move on after a miss.
  useGlobalKeys((e, t) => {
    if (DRILL_KEY.test(e.key)) { e.preventDefault(); drill.answer(e.key.toUpperCase()); }
    else if ((e.key === ' ' || e.key === 'Enter') && drill.round?.typed != null && !t?.closest('button')) {
      e.preventDefault();
      drill.next();
    }
  });

  const view = useMemo<CubeView>(() => ({ facelets: SOLVED_FACELETS, letters }), [letters]);

  return (
    <Workbench layout={LAYOUT}>
      <StageColumn drill cubeRef={cubeHandle} rotation={rotation} view={view} letterMode="off" onLetterMode={NO_OP}
                   absoluteLetters={letters} marks={drill.marks} playback={playback}
                   loaded canPlayMine={false} speed="5" onSpeed={NO_OP} />
      <DrillPanel drill={drill} />
    </Workbench>
  );
}
