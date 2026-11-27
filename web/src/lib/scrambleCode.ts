import { isPainted } from './paint';

// A scramble as a short URL value: each move becomes one character.
// Face order U D L R F B, and each face has three turns (plain, prime, double):
// U=0 U'=1 U2=2, D=3 D'=4 D2=5, L=6 ... B2=17. Hex has only 16 digits, so the 18 values
// use 0-9 then a-h.
const DIGITS = '0123456789abcdefgh';
const FACES = 'UDLRFB';
const SUFFIXES = ['', "'", '2'];

// A painted cube ("~" and 54 colours, see lib/paint.ts) is "x" and the same 54 letters in lower case.
const PAINT_CODE = 'x';

/** "R U R'" → "90a", or null when the text holds anything but plain face turns. */
export function encodeScramble(text: string): string | null {
  if (isPainted(text)) return /^~[URFDLB]{54}$/.test(text.trim()) ? PAINT_CODE + text.trim().slice(1).toLowerCase() : null;
  const moves = text.trim().split(/\s+/).filter(Boolean);
  if (!moves.length) return null;
  const codes: string[] = [];
  for (const move of moves) {
    const face = FACES.indexOf(move[0]);
    const turn = SUFFIXES.indexOf(move.slice(1));
    if (face < 0 || turn < 0) return null;
    codes.push(DIGITS[face * 3 + turn]);
  }
  return codes.join('');
}

/** The inverse of `encodeScramble`; null for a malformed value. */
export function decodeScramble(code: string): string | null {
  if (code[0]?.toLowerCase() === PAINT_CODE) return /^[urfdlb]{54}$/i.test(code.slice(1)) ? `~${code.slice(1).toUpperCase()}` : null;
  const moves: string[] = [];
  for (const ch of code.toLowerCase()) {
    const n = DIGITS.indexOf(ch);
    if (n < 0) return null;
    moves.push(FACES[Math.floor(n / 3)] + SUFFIXES[n % 3]);
  }
  return moves.length ? moves.join(' ') : null;
}

/** Name of the address parameter that carries a shared scramble ("/solve?s=90a"). */
export const SCRAMBLE_PARAM = 's';

/** A link to the Solve page with this scramble, or null when it cannot be written as a code. */
export function shareUrl(scramble: string): string | null {
  const code = encodeScramble(scramble);
  return code ? `${location.origin}/solve?${SCRAMBLE_PARAM}=${code}` : null;
}
