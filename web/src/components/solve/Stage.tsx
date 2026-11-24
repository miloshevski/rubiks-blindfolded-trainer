import type { ReactNode, Ref } from 'react';
import type { ViewRotation } from '../../hooks/useViewRotation';
import type { CubeView, FaceStrings, LetterMode } from '../../lib/types';
import { Cube3D, type CubeHandle, type DrillMarks } from '../cube/Cube3D';

const READOUT = 'pointer-events-none absolute top-3.5 font-mono text-[10.5px] leading-[1.7] text-ink-3 max-md:hidden';

interface Props {
  cubeRef: Ref<CubeHandle>;
  rotation: ViewRotation;
  view: CubeView | null;
  letterMode: LetterMode;
  absoluteLetters: FaceStrings | null;
  marks: DrillMarks | null;
  modeReadout: string;
  /** Overlay under the cube (the "now playing" line in Solve mode). */
  children?: ReactNode;
}

/** The 3D cube on its stage: drag or two-finger swipe to rotate. */
export function Stage({ cubeRef, rotation, view, letterMode, absoluteLetters, marks, modeReadout, children }: Props) {
  return (
    <div ref={rotation.stageRef}
         className="relative flex min-h-[520px] flex-[1_1_auto] cursor-grab touch-none items-center justify-center overflow-hidden
                    perspective-[1100px] select-none active:cursor-grabbing max-md:min-h-[330px] max-md:perspective-[700px]
                    tablet-portrait:min-h-[400px] tablet-landscape:min-h-0">
      <div ref={rotation.readoutRef} className={`${READOUT} left-5`} />
      <div className={`${READOUT} right-5 text-right`}>{modeReadout}<br />exploded 2.4×</div>
      <Cube3D ref={cubeRef} elementRef={rotation.cubeRef} view={view} letterMode={letterMode}
              absoluteLetters={absoluteLetters} marks={marks} />
      {children}
    </div>
  );
}
