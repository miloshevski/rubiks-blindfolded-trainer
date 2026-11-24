import type { Face } from './types';

export interface Rotation {
  x: number;
  y: number;
}

export const ROT0: Rotation = { x: -25, y: -35 };

// Readout only: both angles shown wrapped to −180…179° (the state itself keeps counting so
// turns stay smooth).
const wrapDeg = (v: number) => ((((Math.round(v) + 180) % 360) + 360) % 360) - 180;
export const fmtDeg = (v: number) => {
  const d = wrapDeg(v);
  return `${d < 0 ? '−' : ''}${Math.abs(d)}°`;
};

// The cube transform is rotateX(x) rotateY(y); a face's outward normal points at the viewer
// when its z after both rotations is positive.
const FACE_NORMAL: Record<Face, [number, number, number]> = {
  F: [0, 0, 1], B: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0], U: [0, -1, 0], D: [0, 1, 0],
};
const FACE_YAW: Partial<Record<Face, number>> = { F: 0, R: -90, B: 180, L: 90 };   // y that shows a side face head-on
const rad = (d: number) => (d * Math.PI) / 180;

/** 1 = head-on, ≤ 0 = hidden. */
export function faceFacing(face: Face, { x, y }: Rotation) {
  const [nx, ny, nz] = FACE_NORMAL[face];
  const z1 = -nx * Math.sin(rad(y)) + nz * Math.cos(rad(y));
  return ny * Math.sin(rad(x)) + z1 * Math.cos(rad(x));
}

const nearestTurn = (target: number, from: number) => target + 360 * Math.round((from - target) / 360);

/**
 * The view to turn to so `face` is easy to see, or null when it already is. Turns the shortest
 * way to a 3/4 view: side faces 30° off head-on with the top showing, U / D tilted 50° and
 * swung to the nearest corner-on yaw (−35° + 90°k).
 */
export function viewForFace(face: Face, rot: Rotation): Rotation | null {
  if (faceFacing(face, rot) >= 0.5) return null;
  if (face === 'U' || face === 'D') {
    return {
      x: nearestTurn(face === 'U' ? -50 : 50, rot.x),
      y: ROT0.y + 90 * Math.round((rot.y - ROT0.y) / 90),
    };
  }
  const yaw = FACE_YAW[face]!;
  const a = nearestTurn(yaw - 30, rot.y), b = nearestTurn(yaw + 30, rot.y);
  return { x: nearestTurn(-25, rot.x), y: Math.abs(a - rot.y) <= Math.abs(b - rot.y) ? a : b };
}
