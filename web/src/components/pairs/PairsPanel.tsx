import { memo, useCallback, useMemo, useRef, useState, type MouseEvent, type PointerEvent, type Ref } from 'react';
import { usePairWords } from '../../hooks/usePairWords';
import { cn } from '../../lib/cn';
import { FACE_COLOR, SPEFFZ_LETTERS as LETTERS } from '../../lib/cube';
import type { Face } from '../../lib/types';
import { Button } from '../ui/Button';
import { Bar, INPUT, Meta } from '../ui/text';
import { WordInput } from './WordInput';

// Speffz puts four letters on each face: A–D on U, E–H on L, I–L on F, M–P on R, Q–T on B, U–X on D.
const FACE_OF: readonly Face[] = ['U', 'L', 'F', 'R', 'B', 'D'];
const faceColor = (i: number) => FACE_COLOR[FACE_OF[Math.floor(i / 4)]];
// A heavier rule after every fourth letter (the end of a face) keeps your place in a 24-wide grid.
const edgeRight = (i: number) => (i % 4 === 3 && i < 23 ? 'border-r-line-3' : 'border-r-rule-soft');
const edgeBottom = (i: number) => (i % 4 === 3 && i < 23 ? 'border-b-line-3' : 'border-b-rule-soft');

/** Letter that heads a row or column, underlined in the colour of the face it sits on. */
function Head({ i, scope, hot }: { i: number; scope: 'row' | 'col'; hot: boolean }) {
  return (
    <th scope={scope}
        className={cn(
          'sticky border-b border-r bg-bg p-0 text-center font-mono text-[13px] font-semibold',
          scope === 'col' ? 'top-0 z-20 h-9 border-b-rule' : 'left-0 z-10 w-11 min-w-11',
          scope === 'col' ? edgeRight(i) : edgeBottom(i), scope === 'row' && 'border-r-rule',
          hot ? 'text-ink' : 'text-ink-2',
        )}>
      <span className="inline-block border-b-2 px-0.5 pb-px leading-none" style={{ borderColor: faceColor(i) }}>
        {LETTERS[i]}
      </span>
    </th>
  );
}

interface CellProps {
  r: number;
  c: number;
  word: string;
  /** Not matching the filter. */
  dim: boolean;
  /** In the hovered cell's row or column. */
  cross: boolean;
  /** The hovered cell itself. */
  focus: boolean;
  /** Matching a non-empty filter: highlighted like the hovered cell. */
  hit: boolean;
  /** The filter is exactly this pair's letters (e.g. "fe"): filled solid, apart from the other matches. */
  exact: boolean;
  /** The word is being edited: the cell holds an input. */
  editing: boolean;
  /** Edit mode is on: the cursor says the cell can be clicked to edit. */
  editable: boolean;
  onSave: (code: string, text: string) => void;
  onCancel: () => void;
}

// Memoized on primitives: moving the pointer only re-renders the cells whose state changed.
const Cell = memo(function Cell({ r, c, word, dim, cross, focus, hit, exact, editing, editable, onSave, onCancel }: CellProps) {
  const code = LETTERS[r] + LETTERS[c];
  return (
    <td data-r={r} data-c={c} title={`${code} · ${word}`}
        className={cn(
          'relative h-12 border-b border-r px-1.5 pt-1 align-top transition-opacity duration-[120ms]',
          editable ? 'cursor-text' : 'pairs-cursor', edgeRight(c), edgeBottom(r),
          exact ? 'bg-accent' : focus || hit ? 'bg-accent-bg' : cross ? 'bg-raise' : 'bg-transparent',
          hit && 'z-[1] ring-inset ring-accent', exact ? 'ring-2' : hit && 'ring-1',
          dim && 'opacity-20',
        )}>
      <div className={cn('font-mono leading-none', hit ? 'text-[10px] font-semibold' : 'text-[9px]', exact ? 'text-bg' : focus || hit ? 'text-accent' : 'text-ink-3')}>{code}</div>
      {editing ? <WordInput code={code} word={word} onSave={onSave} onCancel={onCancel} className="mt-0.5 w-full" /> : (
        <div className={cn('mt-0.5 line-clamp-2 break-words', exact ? 'text-bg' : 'text-ink', hit ? 'text-[13px] leading-[1.15] font-medium' : 'text-[11px] leading-[1.2]')}>{word}</div>
      )}
      {/* The hovered cell pops out like a small card above the table, so the grid never reflows.
          Cells on the first/last rows and columns anchor to their edge so the scroll area does not clip it. */}
      {focus && !editing ? (
        <div aria-hidden
             className={cn(
               'pointer-events-none absolute z-[5] w-max min-w-[140px] max-w-[240px] animate-[pop_120ms_ease-out] rounded-md bg-bg px-4 py-3 shadow-[0_8px_28px_rgba(0,0,0,.45)] ring-1 ring-accent',
               r === 0 ? 'top-0' : r === 23 ? 'bottom-0' : 'top-1/2 -translate-y-1/2',
               c < 2 ? 'left-0' : c > 21 ? 'right-0' : 'left-1/2 -translate-x-1/2',
             )}>
          <div className="font-mono text-[13px] leading-none font-semibold text-accent">{code}</div>
          <div className="mt-1.5 text-[24px] leading-[1.15] font-medium break-words text-ink">{word}</div>
        </div>
      ) : null}
    </td>
  );
});

const matches = (code: string, word: string, q: string) =>
  !q || word.toLowerCase().includes(q) || code.toLowerCase() === q;

interface Props {
  filterRef: Ref<HTMLInputElement>;
}

/** Letter-pair dictionary: all 576 pairs AA–XX, first letter down the side, second across the top. */
export function PairsPanel({ filterRef }: Props) {
  const [filter, setFilter] = useState('');
  const [at, setAt] = useState<[number, number] | null>(null);
  const { words, edited, message, save: saveWord, reset, exportFile, importFile, clearMessage } = usePairWords();
  const fileInput = useRef<HTMLInputElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [editing, setEditing] = useState<[number, number] | null>(null);
  const q = filter.trim().toLowerCase();

  const cancel = useCallback(() => setEditing(null), []);
  const save = useCallback((code: string, text: string) => { setEditing(null); saveWord(code, text); }, [saveWord]);
  const toggleEdit = () => { setEditMode(on => !on); setEditing(null); clearMessage(); };
  const startEdit = (e: MouseEvent<HTMLTableElement>) => {
    if (!editMode) return;
    const td = (e.target as Element).closest<HTMLElement>('td[data-r]');
    if (td && (e.target as Element).tagName !== 'INPUT') setEditing([Number(td.dataset.r), Number(td.dataset.c)]);
  };

  const found = useMemo(() => {
    if (!q) return null;
    let n = 0;
    for (const a of LETTERS) for (const b of LETTERS) if (matches(a + b, words[a + b], q)) n++;
    return n;
  }, [q, words]);

  // One delegated listener instead of 576: the cell under the pointer is read from its data attributes.
  const track = (e: PointerEvent<HTMLTableElement>) => {
    const td = (e.target as Element).closest<HTMLElement>('td[data-r]');
    const next: [number, number] | null = td ? [Number(td.dataset.r), Number(td.dataset.c)] : null;
    setAt(prev => (prev?.[0] === next?.[0] && prev?.[1] === next?.[1] ? prev : next));
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-col [grid-area:pairs]" aria-label="Letter pairs">
      <Bar title="Letter pairs" rightClassName="min-w-0 flex-[0_1_320px] max-lg:flex-[1_0_100%]"
           meta={<Meta>
             <span aria-live="polite">{found == null ? '576 pairs' : `${found} match${found === 1 ? '' : 'es'}`}</span>
             {edited > 0 ? <span> · {edited} edited</span> : null}
             <span className="max-md:hidden"> · first letter down, second across</span>
             {editMode ? <span> · click a word to edit, Enter saves, Esc cancels</span> : null}
             {message ? <span role="alert" className="text-bad"> · {message}</span> : null}
           </Meta>}>
        <Button size="sm" variant={editMode ? 'active' : 'default'} aria-pressed={editMode} onClick={toggleEdit}
                title="Edit the words; changes are saved in this browser">
          Edit words
        </Button>
        <Button size="sm" onClick={exportFile} title="Download all the words as a file you can keep">Export</Button>
        <Button size="sm" onClick={() => fileInput.current?.click()} title="Load words from an exported file">Import</Button>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden aria-label="Import pair words"
               onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) importFile(f); }} />
        {edited > 0 && <Button size="sm" onClick={() => { if (confirm(`Put all ${edited} edited words back to the defaults?`)) reset(); }}
                               title="Forget your edits and use the default words">Reset</Button>}
        <input ref={filterRef} className={INPUT} type="search" placeholder="Filter: word or pair, e.g. mo" autoComplete="off"
               spellCheck={false} aria-label="Filter letter pairs" value={filter} onChange={e => setFilter(e.target.value)} />
      </Bar>
      <div className="flex-[1_1_auto] overflow-auto">
        {/* 44px for the row letters + 24 columns of at least 88px: scrolls sideways on narrower screens */}
        <table className="w-full min-w-[2156px] table-fixed border-separate border-spacing-0"
               onPointerMove={track} onClick={startEdit} onPointerLeave={() => setAt(null)}>
          <thead>
            <tr>
              <th scope="col" className="sticky top-0 left-0 z-30 h-9 w-11 min-w-11 border-r border-b border-rule bg-bg p-0 text-center font-mono text-[9px] leading-[1.15] font-normal text-ink-3">
                1st ↓<br />2nd →
              </th>
              {LETTERS.map((l, c) => <Head key={l} i={c} scope="col" hot={at?.[1] === c} />)}
            </tr>
          </thead>
          <tbody>
            {LETTERS.map((a, r) => (
              <tr key={a}>
                <Head i={r} scope="row" hot={at?.[0] === r} />
                {LETTERS.map((b, c) => (
                  <Cell key={b} r={r} c={c} word={words[a + b]} dim={!matches(a + b, words[a + b], q)} hit={!!q && matches(a + b, words[a + b], q)}
                        editing={editing?.[0] === r && editing[1] === c} editable={editMode} onSave={save} onCancel={cancel}
                        exact={!!q && (a + b).toLowerCase() === q}
                        cross={!!at && (at[0] === r || at[1] === c)} focus={at?.[0] === r && at?.[1] === c} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
