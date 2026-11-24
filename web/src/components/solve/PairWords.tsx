import { dictionary, updateLocal, useLocal, words, translate } from '../../lib/local';
import { Button } from '../ui/Button';
import { typedPairs } from '../../lib/pairs';



function Line({ name, text }: { name: string; text: string }) {
  const { data } = useLocal();
  const items = typedPairs(text, words(data));
  return (
    <div>
      <div className="text-[12px] text-ink-3">{name}</div>
      {items.length ? (
        <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0">
          {items.map((p, i) => (
            <li key={i} className="flex items-baseline gap-1.5 text-[13px]">
              <span className="font-mono text-[11px] font-semibold text-accent">{p.letters}</span>
              {p.word ?? <span className="text-ink-3">no word</span>}
              {p.lone ? <span className="text-[11px] text-ink-3" title="Single letter: first cell of its row">(first)</span> : null}
            </li>
          ))}
        </ul>
      ) : <div className="mt-1 text-[12px] text-ink-3">nothing typed</div>}
    </div>
  );
}

/** The dictionary word for each letter pair typed in the recall check (or the computer's, if none). */
export default function PairWords({ edges, corners, fallbackEdges, fallbackCorners }: {
  edges: string;
  corners: string;
  /** The computer's memo, shown while both inputs are empty. */
  fallbackEdges: string;
  fallbackCorners: string;
}) {
  const { data } = useLocal();
  const key = `${new URLSearchParams(location.search).get('scramble') ?? 'current'}:${dictionary(data).id}`;
  const typed = !!(edges.trim() || corners.trim());
  return (
    <div className="mt-3 flex flex-col gap-3 rounded border border-rule p-3" aria-label="Words for the pairs">
      <Line name="Edges" text={typed ? edges : translate(fallbackEdges, 'edges')} />
      <Line name="Corners" text={typed ? corners : translate(fallbackCorners, 'corners')} />
      <Button disabled={!(edges || corners || fallbackEdges || fallbackCorners)} onClick={() => {
        const text = (typed ? [edges, corners] : [translate(fallbackEdges, 'edges'), translate(fallbackCorners, 'corners')]).map((letters, i) => `${i ? 'Corners' : 'Edges'}: ${typedPairs(letters, words(data)).map(p => p.word ?? p.letters).join(' → ')}`).join('\n');
        updateLocal(d => { d.stories[key] = text; });
      }}>Start story from these words</Button>
      <label className="flex flex-col gap-1 text-ink-3">Your memo story<textarea className="rounded border border-edge bg-sunk p-2 text-ink" value={data.stories[key] ?? ''} onChange={e => updateLocal(d => { d.stories[key] = e.target.value; })} /></label>
      {typed ? <div className="text-[11.5px] text-ink-3">Words for your typed execution letters. The original memo and its words stay unchanged.</div> : <div className="text-[11.5px] text-ink-3">From the computer's solution. Type your own letters above to see their words.</div>}
    </div>
  );
}
