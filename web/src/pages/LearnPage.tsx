import { useState } from 'react';
import { Page, FIELD, ROW } from '../components/local/Page';
import { Demo } from '../components/local/Demo';
import { Button } from '../components/ui/Button';
import { LESSONS, GLOSSARY } from '../data/lessons';
import fixtures from '../data/fixtures.json';
import { updateLocal, useLocal } from '../lib/local';
import { navigate } from '../lib/route';
import type { CubeData } from '../lib/types';
export default function LearnPage() {
  const { data } = useLocal();
  const [selected, setSelected] = useState(
    () => LESSONS.find((l) => !data.lessons.includes(l.id))?.id ?? 'intro',
  );
  const [answer, setAnswer] = useState<number | null>(null),
    [hint, setHint] = useState(false);
  const lesson = LESSONS.find((l) => l.id === selected)!;
  const fixture = fixtures.find((f) => f.id === lesson.id)!;
  return (
    <Page title="Learn M2 / Old Pochmann">
      <label>
        Lesson{' '}
        <select
          className={FIELD}
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            setAnswer(null);
            setHint(false);
          }}
        >
          {LESSONS.map((l, i) => (
            <option key={l.id} value={l.id}>
              {i + 1}. {l.title}
              {data.lessons.includes(l.id) ? ' ✓' : ''}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="m-0 text-[17px]">{lesson.title}</h2>
          <p className="m-0 leading-7 text-ink-2">{lesson.explanation}</p>
          <p className="m-0">{lesson.exercise}</p>
          <div className={ROW}>
            <Button onClick={() => navigate('solve', { scramble: fixture.scramble, parity: '1' })}>
              Explore this example
            </Button>
            <Button
              onClick={() => {
                if (lesson.id === 'speffz') {
                  navigate('drill');
                  return;
                }
                const modes: Record<string, string> = {
                  intro: 'pair-word',
                  buffers: 'trace',
                  corners: 'algorithm',
                  m2: 'algorithm',
                  special: 'substitutions',
                  cycles: 'cycle-breaks',
                  orientation: 'orientation',
                  parity: 'parity',
                  full: 'guided',
                };
                navigate('practice', {
                  v: '1',
                  mode: modes[lesson.id],
                  fixture: lesson.id,
                  kind: lesson.id === 'corners' ? 'corners' : 'edges',
                });
              }}
            >
              Practice
            </Button>
            <Button onClick={() => setHint(!hint)}>Hint</Button>
          </div>
          {hint && <p className="text-accent">{lesson.hint}</p>}
          <fieldset className="flex flex-col gap-2 border border-rule p-3">
            <legend>Knowledge check</legend>
            <p>{lesson.question}</p>
            {lesson.answers.map((a, i) => (
              <label key={a}>
                <input
                  type="radio"
                  name="knowledge"
                  checked={answer === i}
                  onChange={() => setAnswer(i)}
                />{' '}
                {a}
              </label>
            ))}
            <p aria-live="polite">
              {answer === null
                ? 'Choose an answer.'
                : answer === lesson.correct
                  ? 'Correct.'
                  : 'Try again, or reveal the hint.'}
            </p>
            <Button
              disabled={answer !== lesson.correct}
              onClick={() =>
                updateLocal((d) => {
                  if (!d.lessons.includes(lesson.id)) d.lessons.push(lesson.id);
                })
              }
            >
              {data.lessons.includes(lesson.id) ? 'Completed ✓' : 'Mark complete'}
            </Button>
          </fieldset>
          <dl className="m-0">
            {lesson.glossary.map((term) => (
              <div key={term} className="mb-2">
                <dt className="font-medium">{term}</dt>
                <dd className="m-0 text-ink-3">{GLOSSARY[term]}</dd>
              </div>
            ))}
          </dl>
          <a className="text-accent" href={lesson.source} target="_blank" rel="noreferrer">
            Method reference
          </a>
        </div>
        <Demo key={lesson.id} cube={fixture as CubeData} />
      </div>
    </Page>
  );
}
