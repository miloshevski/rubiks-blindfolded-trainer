import { useCallback, useState } from 'react';
import { usePairWords } from '../../hooks/usePairWords';
import { typedPairs } from '../../lib/pairs';
import { WordInput } from '../pairs/WordInput';
import { Button } from '../ui/Button';

interface LineProps {
  name: string;
  text: string;
  words: Record<string, string>;
  edit: boolean;
  /** Which item of this line is being edited. */
  editing: number | null;
  onEdit: (index: number) => void;
  onSave: (code: string, text: string) => void;
  onCancel: () => void;
}

function Line({ name, text, words, edit, editing, onEdit, onSave, onCancel }: LineProps) {
  const items = typedPairs(text, words);
  return (
    <div>
      <div className="text-[12px] text-ink-3">{name}</div>
      {items.length ? (
        <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0">
          {items.map((p, i) => (
            <li key={i} className="flex items-baseline gap-1.5 text-[13px]">
              <span className="font-mono text-[11px] font-semibold text-accent">{p.letters}</span>
              {editing === i && p.word != null ? (
                <WordInput code={p.letters} word={p.word} onSave={onSave} onCancel={onCancel} className="w-36 text-[13px]" />
              ) : edit && p.word != null ? (
                <button type="button" onClick={() => onEdit(i)} title={`Edit the word for ${p.letters}`}
                        className="cursor-text border-0 border-b border-dashed border-ink-3 bg-transparent p-0 text-[13px] text-ink">
                  {p.word}
                </button>
              ) : p.word ?? <span className="text-ink-3">no word</span>}
              {p.lone ? <span className="text-[11px] text-ink-3" title="Single letter: first cell of its row">(first)</span> : null}
            </li>
          ))}
        </ul>
      ) : <div className="mt-1 text-[12px] text-ink-3">nothing typed</div>}
    </div>
  );
}

/** The dictionary word for each letter pair typed in the recall check (or the computer's, if none).
 *  "Edit words" lets you change a word right here; it is saved in this browser. */
export default function PairWords({ edges, corners, fallbackEdges, fallbackCorners }: {
  edges: string;
  corners: string;
  /** The computer's memo, shown while both inputs are empty. */
  fallbackEdges: string;
  fallbackCorners: string;
}) {
  const typed = !!(edges.trim() || corners.trim());
  const { words, message, save: saveWord, clearMessage } = usePairWords();
  const [edit, setEdit] = useState(false);
  const [editing, setEditing] = useState<{ line: string; index: number } | null>(null);

  const cancel = useCallback(() => setEditing(null), []);
  const save = useCallback((code: string, text: string) => { setEditing(null); saveWord(code, text); }, [saveWord]);
  const toggle = () => { setEdit(on => !on); setEditing(null); clearMessage(); };

  const line = (name: string, text: string) => (
    <Line name={name} text={text} words={words} edit={edit} editing={editing?.line === name ? editing.index : null}
          onEdit={index => setEditing({ line: name, index })} onSave={save} onCancel={cancel} />
  );

  return (
    <div className="mt-3 flex flex-col gap-3 rounded border border-rule p-3" aria-label="Words for the pairs">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11.5px] text-ink-3">
          {message ? <span role="alert" className="text-bad">{message}</span> : edit ? 'Click a word to edit it. Enter saves, Esc cancels.' : null}
        </span>
        <Button size="sm" variant={edit ? 'active' : 'default'} aria-pressed={edit} onClick={toggle}
                title="Edit the words; changes are saved in this browser">
          Edit words
        </Button>
      </div>
      {line('Edges', typed ? edges : fallbackEdges)}
      {line('Corners', typed ? corners : fallbackCorners)}
      {typed ? null : <div className="text-[11.5px] text-ink-3">From the computer's solution. Type your own letters above to see their words.</div>}
    </div>
  );
}
