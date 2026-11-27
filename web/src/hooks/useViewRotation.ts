import { useCallback, useRef } from 'react';
import { fmtDeg, ROT0, viewForFace, type Rotation } from '../lib/rotation';
import type { Face } from '../lib/types';

// Eased transition used only while turning to a drill target; a drag or swipe cancels it.
const AUTO_TURN = ['transition-transform', 'duration-500', 'ease-[cubic-bezier(.3,.7,.2,1)]'];

/**
 * The cube's view angle. It changes on every pointer move, so it lives in a ref and is written
 * straight to the DOM (cube transform + readout) instead of going through React state.
 */
export function useViewRotation({ wheel: wheelTurns = true }: { wheel?: boolean } = {}) {
  const rot = useRef<Rotation>({ ...ROT0 });
  const cube = useRef<HTMLDivElement | null>(null);
  const readout = useRef<HTMLDivElement | null>(null);
  const turnTimer = useRef(0);

  const apply = useCallback(() => {
    const { x, y } = rot.current;
    if (cube.current) cube.current.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;
    if (readout.current) readout.current.innerText = `rx ${fmtDeg(x)}\nry ${fmtDeg(y)}`;
  }, []);

  const stopAutoTurn = useCallback(() => {
    clearTimeout(turnTimer.current);
    cube.current?.classList.remove(...AUTO_TURN);
  }, []);

  // Callback refs: the stage can unmount (Algorithms mode) and come back with the same view.
  const cubeRef = useCallback((el: HTMLDivElement | null) => { cube.current = el; apply(); }, [apply]);
  const readoutRef = useCallback((el: HTMLDivElement | null) => { readout.current = el; apply(); }, [apply]);

  const stageRef = useCallback((stage: HTMLDivElement | null) => {
    if (!stage) return;
    let drag: [number, number] | null = null;
    const down = (e: PointerEvent) => {
      stopAutoTurn();
      drag = [e.clientX, e.clientY];
      stage.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      rot.current.y += (e.clientX - drag[0]) * 0.6;
      rot.current.x -= (e.clientY - drag[1]) * 0.6;
      drag = [e.clientX, e.clientY];
      apply();
    };
    const end = () => { drag = null; };
    // Laptop trackpad: a two-finger swipe arrives as a wheel event. Fingers moving right
    // (deltaX < 0 with natural scrolling) turn the cube like a drag to the right would.
    // ctrlKey marks a pinch, which is left to the browser. Not passive: it must preventDefault.
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      stopAutoTurn();
      const k = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;   // lines / pages → px
      rot.current.y -= e.deltaX * k * 0.2;
      rot.current.x += e.deltaY * k * 0.2;
      apply();
    };
    stage.addEventListener('pointerdown', down);
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    // Inside a scrolling page (the tutorial) the wheel must keep scrolling it.
    if (wheelTurns) stage.addEventListener('wheel', wheel, { passive: false });
    return () => {
      stage.removeEventListener('pointerdown', down);
      stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerup', end);
      stage.removeEventListener('pointercancel', end);
      stage.removeEventListener('wheel', wheel);
    };
  }, [apply, stopAutoTurn, wheelTurns]);

  const reset = useCallback(() => { rot.current = { ...ROT0 }; apply(); }, [apply]);

  /** Turns the cube (eased) so `face` is in view; leaves it alone if it already is. */
  const showFace = useCallback((face: Face) => {
    const target = viewForFace(face, rot.current);
    if (!target) return;
    stopAutoTurn();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && cube.current) {
      cube.current.classList.add(...AUTO_TURN);
      turnTimer.current = window.setTimeout(stopAutoTurn, 600);
    }
    rot.current = target;
    apply();
  }, [apply, stopAutoTurn]);

  return { cubeRef, readoutRef, stageRef, reset, showFace };
}

export type ViewRotation = ReturnType<typeof useViewRotation>;
