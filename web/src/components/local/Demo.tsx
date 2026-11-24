import { useEffect, useRef, useState } from 'react';
import type { CubeData, LetterMode } from '../../lib/types';
import type { CubeHandle } from '../cube/Cube3D';
import { StageColumn } from '../solve/StageColumn';
import { usePlayback } from '../../hooks/usePlayback';
import { useViewRotation } from '../../hooks/useViewRotation';
import { useGlobalKeys } from '../../hooks/useGlobalKeys';
import type { Speed } from '../solve/Transport';
import { parseSolution } from '../../lib/solution';
export function Demo({ cube }: { cube: CubeData }) {
  const [speed, setSpeed] = useState<Speed>('5');
  const ref = useRef<CubeHandle>(null);
  const rotation = useViewRotation();
  const [mode, setMode] = useState<LetterMode>('absolute');
  const playback = usePlayback({
    current: cube,
    practice: null,
    refRows: parseSolution(cube.solution).flatMap((s) => s.rows),
    speed: Number(speed),
    cube: ref,
  });
  useEffect(() => () => playback.pause(), [playback.pause]);
  useGlobalKeys((e, target) => {
    if (e.key === ' ' && !target?.closest('button')) {
      e.preventDefault();
      playback.play();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      playback.step(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      playback.step(-1);
    }
  });
  return (
    <div className="lesson-demo grid [grid-template-areas:'stage'] min-h-[460px] grid-cols-1 overflow-hidden rounded border border-rule">
      <StageColumn
        drill={false}
        cubeRef={ref}
        rotation={rotation}
        view={playback.view}
        letterMode={mode}
        onLetterMode={setMode}
        absoluteLetters={cube.absolute_letters}
        marks={null}
        playback={playback}
        loaded
        canPlayMine={false}
        speed={speed}
        onSpeed={setSpeed}
      />
    </div>
  );
}
