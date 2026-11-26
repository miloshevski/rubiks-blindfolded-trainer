import { encodeScramble } from './scrambleCode';

/** The worked example of the tutorial: an 11-target edge memo with an even-position substitution (I executed as S). */
export const EXAMPLE_SCRAMBLE = "D' F2 L2 U' R2 U B2 D U F' R F2 L B F U2 L U2 F R'";

/** A short scramble that leaves a flipped edge (AQ) and a twisted corner (KP): the tutorial's example for flips and twists. */
export const FLIP_SCRAMBLE = "R U R' U' F2 D L2 B'";

/** Link to the Solve page with this scramble loaded (a full page load: it carries a query). */
export const solveHref = (scramble: string) => `/solve?s=${encodeScramble(scramble) ?? ''}`;
