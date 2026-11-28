/** One memo item typed by the user: a letter pair, or a lone letter left over at the end. */
export interface TypedPair {
  /** The pair looked up. For a lone letter it is the first cell of that letter's row ("P" → "PA"). */
  letters: string;
  word: string | null;
  /** The user typed only one letter. */
  lone: boolean;
}

/**
 * Splits typed memo letters ("hs ef  bo p") into pairs. Words are separated by one or more
 * spaces; a word longer than two letters is read as consecutive pairs, and an odd last letter
 * is looked up as the first cell of its row in the matrix (letter + "A"). `word` is null when
 * the pair is not in the dictionary.
 */
export function typedPairs(text: string, words: Record<string, string>): TypedPair[] {
  const out: TypedPair[] = [];
  for (const token of text.trim().split(/\s+/)) {
    if (!token) continue;
    for (let i = 0; i < token.length; i += 2) {
      const typed = token.slice(i, i + 2).toUpperCase();
      const lone = typed.length === 1;
      const letters = lone ? typed + 'A' : typed;
      out.push({ letters, word: words[letters] ?? null, lone });
    }
  }
  return out;
}

export const MAX_WORD = 40;

/**
 * The valid, changed words of `raw` (an object of pair → word, e.g. the saved edits or an imported
 * file): only pairs that exist in `defaults`, trimmed, non-empty, at most 40 characters, and
 * different from the default. Anything else is dropped.
 */
export function cleanWords(raw: unknown, defaults: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [code, value] of Object.entries(raw)) {
    if (!(code in defaults) || typeof value !== 'string') continue;
    const word = value.trim().replace(/\s+/g, ' ');
    if (word && word.length <= MAX_WORD && word !== defaults[code]) out[code] = word;
  }
  return out;
}
