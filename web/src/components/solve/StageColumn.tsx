import type { Ref } from 'react';
import type { Playback } from '../../hooks/usePlayback';
import type { ViewRotation } from '../../hooks/useViewRotation';
import { cn } from '../../lib/cn';
import { segmentAt } from '../../lib/solution';
import type { CubeView, FaceStrings, LetterMode } from '../../lib/types';
import type { CubeHandle, DrillMarks } from '../cube/Cube3D';
import { IconButton } from '../ui/IconButton';
import { IconReset } from '../ui/icons';
import { Segmented, type SegOption } from '../ui/Segmented';
import { Bar } from '../ui/text';
import { NowPlaying } from './NowPlaying';
import { Stage } from './Stage';
import { Transport, type Speed } from './Transport';

const LETTER_MODES: readonly SegOption<LetterMode>[] = [
  { value: 'off', label: 'Off' }, { value: 'absolute', label: 'Absolute' }, { value: 'relative', label: 'Relative' },
];

interface Props {
  drill: boolean;                  // Letter drill: no playback, letters hidden
  cubeRef: Ref<CubeHandle>;
  rotation: ViewRotation;
  view: CubeView | null;
  letterMode: LetterMode;
  onLetterMode: (mode: LetterMode) => void;
  absoluteLetters: FaceStrings | null;
  marks: DrillMarks | null;
  playback: Playback;
  loaded: boolean;
  canPlayMine: boolean;
  speed: Speed;
  onSpeed: (speed: Speed) => void;
}

/** Middle column: the cube, and (Solve mode) the playback controls under it. */
export function StageColumn({
  drill, cubeRef, rotation, view, letterMode, onLetterMode, absoluteLetters, marks, playback, loaded, canPlayMine, speed, onSpeed,
}: Props) {
  const modeReadout = drill ? 'letters hidden' : letterMode === 'off' ? 'letters off' : `${letterMode} letters`;
  const { pos, frames, segments } = playback;
  return (
    <section className={cn('flex min-w-0 flex-col border-r border-rule [grid-area:stage] max-xl:border-r-0',
      drill ? 'max-xl:border-b-0 tablet-portrait:border-b' : 'max-xl:border-b',
      'tablet-landscape:min-h-0 tablet-landscape:border-r tablet-landscape:border-b-0')}>
      <Bar title="Cube" meta={<span className="text-[12px] text-ink-3 max-md:hidden">Drag or two-finger swipe to rotate · hidden faces float behind</span>}>
        {drill ? null : (
          <>
            <span id="letters-l" className="text-[12px] text-ink-3">Letters</span>
            <Segmented options={LETTER_MODES} value={letterMode} onChange={onLetterMode} labelledBy="letters-l" />
          </>
        )}
        <IconButton label="Reset view" title="Reset view" onClick={rotation.reset}>{IconReset}</IconButton>
      </Bar>
      <Stage cubeRef={cubeRef} rotation={rotation} view={view} letterMode={drill ? 'off' : letterMode}
             absoluteLetters={absoluteLetters} marks={marks} modeReadout={modeReadout}>
        {drill ? null : <NowPlaying segment={segmentAt(segments, pos)} move={pos ? frames?.[pos - 1]?.move ?? null : null} total={frames?.length ?? 0} />}
      </Stage>
      {drill ? null : <Transport playback={playback} loaded={loaded} canPlayMine={canPlayMine} speed={speed} onSpeed={onSpeed} />}
    </section>
  );
}
