import { useEffect, useRef, useState } from 'react';
import { Page, FIELD, ROW } from '../components/local/Page';
import { Button } from '../components/ui/Button';
import { Net } from '../components/cube/Net';
import { ABC, dictionary, entries, PAIRS, translate, updateLocal, useLocal } from '../lib/local';
import { nextReview, recordAttempt, type Rating } from '../lib/review';
import { navigate } from '../lib/route';
import { simulate } from '../lib/simulation';
import { ABSOLUTE_LETTERS } from '../lib/cube';
import lessons from '../data/fixtures.json';
import cases from '../data/practice-fixtures.json';
import algorithms from '../data/algorithms.json';
import type { CubeData } from '../lib/types';

const fixtures = [...lessons, ...cases];
const MODES = [
  'pair-word',
  'word-pair',
  'reverse-letter',
  'trace',
  'algorithm',
  'substitutions',
  'cycle-breaks',
  'orientation',
  'parity',
  'memo-recall',
  'guided',
] as const;
type Mode = (typeof MODES)[number];
const MODE_NAMES: Record<Mode, string> = {
  'pair-word': 'Pair → word',
  'word-pair': 'Word → pair',
  'reverse-letter': 'Find the sticker',
  trace: 'Memo tracing',
  algorithm: 'Algorithm recall',
  substitutions: 'M2 substitutions',
  'cycle-breaks': 'Cycle breaks',
  orientation: 'Flipped edges / twisted corners',
  parity: 'Parity',
  'memo-recall': 'Memo sequence recall',
  guided: 'Guided full solve',
};
const normalize = (s: string) => s.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
export default function PracticePage() {
  const { data } = useLocal();
  const query = new URLSearchParams(location.search);
  const supplied = query.get('mode');
  const validLink =
    !query.has('v') ||
    (query.get('v') === '1' &&
      MODES.includes(supplied as Mode) &&
      fixtures.some((f) => f.id === query.get('fixture')) &&
      (!query.has('kind') || ['edges', 'corners'].includes(query.get('kind')!)));
  const [mode, setMode] = useState<Mode>(
    MODES.includes(supplied as Mode) ? (supplied as Mode) : 'pair-word',
  );
  const [difficulty, setDifficulty] = useState('beginner'),
    [length, setLength] = useState(10),
    [timed, setTimed] = useState(false);
  const [item, setItem] = useState('AA'),
    [input, setInput] = useState(''),
    [revealed, setRevealed] = useState(false),
    [verdict, setVerdict] = useState<string | null>(null);
  const [count, setCount] = useState(0),
    [correct, setCorrect] = useState(0),
    [step, setStep] = useState(0),
    [hint, setHint] = useState(0);
  const [fixtureId, setFixtureId] = useState(query.get('fixture') ?? 'special');
  const [kind, setKind] = useState<'edges' | 'corners'>(
    query.get('kind') === 'corners' ? 'corners' : 'edges',
  );
  const [share, setShare] = useState('');
  const [validationError, setValidationError] = useState('');
  const shown = useRef(performance.now());
  const words = entries(data),
    pair = words[item] ?? words.AA;
  const fixture = (fixtures.find((f) => f.id === fixtureId) ?? fixtures[5]) as CubeData;
  const phases = mode === 'guided' ? fixture.steps : fixture.steps.filter((s) => s.phase === kind),
    target = phases[Math.min(step, phases.length - 1)];
  const targetKind = target?.phase === 'corners' ? 'corners' : 'edges';
  const sessionLength = mode === 'guided' ? phases.length : length;
  const table = algorithms[kind].filter((r) => !r.buffer),
    alg = table.find((r) => r.letter === item) ?? table[0];
  const sequence = data.sequence;
  const reviewMode =
    mode.includes('pair') || mode === 'pair-word'
      ? `${mode}:${dictionary(data).id}`
      : `${mode}:${kind}`;
  function next() {
    setValidationError('');
    setInput('');
    setRevealed(false);
    setVerdict(null);
    setHint(0);
    shown.current = performance.now();
    const pool =
      mode === 'algorithm'
        ? table.map((r) => r.letter)
        : mode === 'reverse-letter'
          ? [...ABC]
          : PAIRS.filter((p) => difficulty !== 'beginner' || !/[QUX]/.test(p));
    const selected = nextReview(reviewMode, pool, item);
    setItem(selected);
    if (mode === 'memo-recall')
      updateLocal((d) => {
        d.sequence = {
          text: Array.from(
            { length: difficulty === 'beginner' ? 4 : difficulty === 'intermediate' ? 8 : 16 },
            () => ABC[Math.floor(Math.random() * 24)],
          ).join(''),
          hidden: false,
          answer: '',
        };
      });
  }
  useEffect(() => {
    setCount(0);
    setCorrect(0);
    setStep(0);
    if (mode !== 'memo-recall' || !data.sequence) next();
    if (query.get('mode') !== mode || !validLink)
      setFixtureId(
        mode === 'cycle-breaks'
          ? difficulty === 'beginner'
            ? 'cycles'
            : difficulty === 'intermediate'
              ? 'cycle-bjbflf'
              : 'cycle-bjblal'
          : mode === 'orientation'
            ? kind === 'corners'
              ? 'twisted-corners-1'
              : 'orientation'
            : mode === 'parity'
              ? 'parity'
              : 'special',
      );
  }, [mode, kind, difficulty]); // a round starts only when exercise settings change
  useEffect(() => {
    document.documentElement.dataset.activeTask = count < sessionLength ? 'true' : 'false';
    return () => {
      delete document.documentElement.dataset.activeTask;
    };
  }, [count, sessionLength]);
  const locked = verdict !== null || revealed;
  function result(ok: boolean, expected: string) {
    if (locked || count >= sessionLength) return;
    recordAttempt(
      reviewMode,
      ['trace', 'guided', 'orientation', 'cycle-breaks', 'parity'].includes(mode)
        ? `${fixtureId}:${step}`
        : mode === 'memo-recall'
          ? (sequence?.text ?? item)
          : mode === 'substitutions'
            ? `position-${step % 8}`
            : item,
      ok,
      performance.now() - shown.current,
    );
    setCount((n) => n + 1);
    if (ok) setCorrect((n) => n + 1);
    setVerdict(ok ? 'Correct.' : `Answer: ${expected}`);
  }
  function check() {
    try {
      if (mode === 'pair-word')
        result(
          pair.words.some((w) => normalize(w) === normalize(input)),
          pair.words.join(' / '),
        );
      else if (mode === 'word-pair') result(input.trim().toUpperCase() === item, item);
      else if (mode === 'algorithm')
        result(simulate(input).identity === simulate(alg.alg).identity, alg.alg);
      else if (mode === 'memo-recall')
        result(
          (sequence?.answer ?? '').replace(/\s/g, '').toUpperCase() === sequence?.text,
          sequence?.text ?? '',
        );
      else if (mode === 'parity')
        result(
          normalize(input) === (fixture.steps.some((s) => s.phase === 'parity') ? 'yes' : 'no'),
          fixture.steps.some((s) => s.phase === 'parity') ? 'yes' : 'no',
        );
      else if (mode === 'substitutions') {
        const even = step % 2 === 1;
        const letter = 'CIWS'[Math.floor(step / 2) % 4];
        const expected = even ? { C: 'W', I: 'S', W: 'C', S: 'I' }[letter]! : letter;
        result(
          input.trim().toUpperCase() === translate(expected, 'edges'),
          translate(expected, 'edges'),
        );
      } else if (target) {
        const expected =
          target.phase === 'parity' ? 'PARITY' : translate(target.memo_target!, targetKind);
        result(input.trim().toUpperCase() === expected, expected);
      }
    } catch (e) {
      setValidationError(String(e));
    }
  }
  const fixtureMode = ['trace', 'guided', 'cycle-breaks', 'orientation', 'parity'].includes(mode);
  return (
    <Page title="Practice">
      <div className={ROW}>
        <Button onClick={() => navigate('drill')}>Sticker recognition</Button>
        <select
          aria-label="Practice mode"
          className={FIELD}
          value={mode}
          onChange={(e) => setMode(e.target.value as Mode)}
        >
          {MODES.map((m) => (
            <option key={m} value={m}>
              {MODE_NAMES[m]}
            </option>
          ))}
        </select>
        <select
          aria-label="Difficulty"
          className={FIELD}
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          {['beginner', 'intermediate', 'advanced'].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <label>
          Length{' '}
          <input
            className={`${FIELD} w-16`}
            type="number"
            min={1}
            max={100}
            value={length}
            onChange={(e) => setLength(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
          />
        </label>
        <label>
          <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />{' '}
          Show response time
        </label>
        <select
          aria-label="Piece type"
          className={FIELD}
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
        >
          <option value="edges">Edges</option>
          <option value="corners">Corners</option>
        </select>
      </div>
      {!validLink && (
        <p role="alert" className="text-bad">
          Invalid exercise link. Choose a practice mode above.
        </p>
      )}
      <p className="m-0 text-ink-3">
        {count}/{sessionLength} answers · {count ? Math.round((correct / count) * 100) : 0}%
        accuracy · Due items appear before new items.{' '}
        {data.activeScheme !== 'speffz' ? 'Your custom lettering is active.' : ''}
      </p>
      {count >= sessionLength ? (
        <div className={ROW}>
          <b>Exercise complete</b>
          <Button
            onClick={() => {
              setCount(0);
              setCorrect(0);
              setStep(0);
              next();
            }}
          >
            New session
          </Button>
        </div>
      ) : (
        <>
          {fixtureMode && (
            <>
              <label>
                Example{' '}
                <select
                  className={FIELD}
                  value={fixtureId}
                  onChange={(e) => {
                    setFixtureId(e.target.value);
                    setStep(0);
                    setVerdict(null);
                    setHint(0);
                  }}
                >
                  {fixtures.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.id}
                    </option>
                  ))}
                </select>
              </label>
              <Net
                view={target?.start ? (fixture.frames[target.start - 1] ?? fixture) : fixture}
                letterMode="absolute"
                absoluteLetters={fixture.absolute_letters}
              />
              {!target && mode !== 'parity' && (
                <p className="text-ok">
                  This example has no {kind} targets. Choose another example or piece type.
                </p>
              )}
              <p>
                {mode === 'parity'
                  ? 'Does this scramble need parity? Type yes or no.'
                  : target?.phase === 'parity'
                    ? 'Type PARITY to perform the required correction before corners.'
                    : `Next original ${targetKind} memo target (${Math.min(step + 1, phases.length)}/${phases.length}).${mode === 'cycle-breaks' && target?.cycle_break ? ' This opens a disconnected cycle.' : ''}`}
              </p>
              <div className={ROW}>
                <Button onClick={() => setHint((h) => Math.min(3, h + 1))}>Progressive hint</Button>
                <Button onClick={() => navigate('solve', { scramble: fixture.scramble })}>
                  Explore after practice
                </Button>
              </div>
              {hint > 0 && target && (
                <p className="font-mono text-accent">
                  {target.memo_target ? translate(target.memo_target, targetKind) : 'PARITY'}
                  {hint > 1
                    ? ` → ${target.execution_target ? translate(target.execution_target, targetKind) : 'PARITY'} · setup ${target.setup || '(dedicated algorithm)'}`
                    : ''}
                  {hint > 2 ? `: ${target.algorithm}` : ''}
                </p>
              )}
            </>
          )}
          {mode === 'reverse-letter' && (
            <>
              <p>
                Choose the {kind === 'edges' ? 'edge' : 'corner'} sticker{' '}
                <b className="font-mono text-accent">{translate(item, kind)}</b>.
              </p>
              <Net
                view={simulate('')}
                letterMode="off"
                absoluteLetters={ABSOLUTE_LETTERS}
                onSticker={(_f, i) => {
                  const actual = ABSOLUTE_LETTERS[_f][i];
                  result(
                    (i % 2 ? 'edges' : 'corners') === kind && actual === item,
                    translate(item, kind),
                  );
                }}
              />
            </>
          )}
          {mode === 'pair-word' && <p className="font-mono text-[36px] text-accent">{item}</p>}
          {mode === 'word-pair' && <p className="text-[28px]">{pair.words[0]}</p>}
          {mode === 'algorithm' && (
            <p>
              Enter the full {kind} algorithm for{' '}
              <b className="font-mono text-accent">{translate(alg.letter, kind)}</b>. Equivalent
              move sequences are accepted.
            </p>
          )}
          {mode === 'substitutions' && (
            <p>
              Edge target {step + 1}: memo{' '}
              <b>{translate('CIWS'[Math.floor(step / 2) % 4], 'edges')}</b>. Which letter’s
              algorithm executes?
            </p>
          )}
          {mode === 'memo-recall' && (
            <>
              <p className="font-mono text-[28px] tracking-widest">
                {sequence?.hidden ? '••••••••' : sequence?.text}
              </p>
              <Button
                disabled={sequence?.hidden}
                onClick={() =>
                  updateLocal((d) => {
                    if (d.sequence) d.sequence.hidden = true;
                  })
                }
              >
                Hide sequence
              </Button>
            </>
          )}
          {mode !== 'reverse-letter' && (
            <form
              className={ROW}
              onSubmit={(e) => {
                e.preventDefault();
                check();
              }}
            >
              <input
                className={`${FIELD} min-w-64`}
                aria-label="Practice answer"
                autoComplete="off"
                spellCheck={false}
                value={mode === 'memo-recall' ? (sequence?.answer ?? '') : input}
                disabled={locked || (mode === 'memo-recall' && !sequence?.hidden)}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (mode === 'memo-recall')
                    updateLocal((d) => {
                      if (d.sequence) d.sequence.answer = e.target.value;
                    });
                }}
              />
              <Button type="submit" disabled={locked}>
                Check
              </Button>
            </form>
          )}
          {['pair-word', 'word-pair', 'algorithm'].includes(mode) && !locked && (
            <Button onClick={() => setRevealed(true)}>Reveal flashcard answer</Button>
          )}
          {revealed && (
            <>
              <p className="font-mono">
                {mode === 'algorithm' ? alg.alg : `${item} · ${pair.words.join(' / ')}`}
              </p>
              <div className={ROW}>
                {(['Again', 'Hard', 'Good', 'Easy'] as Rating[]).map((r) => (
                  <Button
                    key={r}
                    onClick={() => {
                      recordAttempt(
                        reviewMode,
                        item,
                        r !== 'Again',
                        performance.now() - shown.current,
                        r,
                      );
                      setCount((n) => n + 1);
                      if (r !== 'Again') setCorrect((n) => n + 1);
                      next();
                    }}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </>
          )}
          {validationError && (
            <p role="alert" className="text-bad">
              {validationError}
            </p>
          )}
          {verdict && (
            <p role="status" className="font-mono text-accent">
              {verdict}
              {timed ? ` · ${((performance.now() - shown.current) / 1000).toFixed(1)}s` : ''}
            </p>
          )}
          {verdict && (
            <Button
              onClick={() => {
                setStep((n) => (fixtureMode ? (n + 1) % Math.max(1, phases.length) : n + 1));
                next();
              }}
            >
              Next
            </Button>
          )}
        </>
      )}
      <div className={ROW}>
        <Button
          onClick={async () => {
            const url = new URL('/practice', location.origin);
            url.search = new URLSearchParams({ v: '1', mode, kind, fixture: fixtureId }).toString();
            try {
              await navigator.clipboard.writeText(url.toString());
              setShare('Link copied');
            } catch {
              setShare(url.toString());
            }
          }}
        >
          Share exercise
        </Button>
        <span role="status">{share}</span>
      </div>
    </Page>
  );
}
