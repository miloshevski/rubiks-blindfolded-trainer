import { useEffect, useMemo } from 'react';
import { useStoredState, type Codec } from '../../hooks/useStoredState';
import { useTutorialData } from '../../hooks/useTutorialData';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { FIELD } from '../ui/text';
import { LESSONS } from './lessons';

const IDS = LESSONS.map(l => l.id);
const LESSON_CODEC: Codec<string> = { parse: raw => (IDS.includes(raw) ? raw : null), serialize: v => v };

/** The tutorial: a list of lessons, one lesson at a time, with live examples from the server. */
export function TutorialPanel() {
  const data = useTutorialData();
  const [id, setId] = useStoredState<string>('bld.lesson', IDS[0], LESSON_CODEC);
  const index = Math.max(0, IDS.indexOf(id));
  const lesson = LESSONS[index];
  const body = useMemo(() => lesson.body(data), [lesson, data]);
  const go = (i: number) => { setId(IDS[i]); document.getElementById('lesson-scroll')?.scrollTo({ top: 0 }); };

  // Phone: the header folds away while reading down and comes back when you scroll up.
  useEffect(() => {
    const scroller = document.getElementById('lesson-scroll');
    if (!scroller) return;
    const root = document.documentElement;
    let last = 0;
    const onScroll = () => {
      const top = scroller.scrollTop;
      if (top < 80 || top < last - 6) delete root.dataset.chrome;
      else if (top > last + 6) root.dataset.chrome = 'hidden';
      last = top;
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => { scroller.removeEventListener('scroll', onScroll); delete root.dataset.chrome; };
  }, []);

  return (
    <section className="flex min-h-0 min-w-0 flex-col [grid-area:tutorial] md:flex-row" aria-label="Tutorial">
      <nav aria-label="Lessons" className="hidden flex-none md:block md:w-[260px] md:overflow-auto md:border-r">
        <ol className="m-0 list-none p-0 py-2">
          {LESSONS.map((l, i) => (
            <li key={l.id}>
              <button type="button" onClick={() => go(i)} aria-current={i === index ? 'step' : undefined}
                      className={cn('flex w-full cursor-pointer items-start gap-3 border-0 border-l-2 bg-transparent px-5 py-2.5 text-left text-ink transition-colors duration-[120ms] hover:bg-row-hover',
                        i === index ? 'border-accent bg-row-current' : 'border-transparent')}>
                <span className={cn('mt-px font-mono text-[11px]', i === index ? 'text-accent' : 'text-ink-3')}>{String(i + 1).padStart(2, '0')}</span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-medium">{l.title}</span>
                  <span className="text-[11.5px] text-ink-3">{l.summary}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div id="lesson-scroll" className="min-h-0 min-w-0 flex-[1_1_auto] overflow-auto">
        <article className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-6 pt-8 pb-12 max-md:px-4 max-md:pt-5 max-md:pb-10">
          {/* Phone: a picker at the top of the lesson, so it scrolls away with it. From md the list is on the left. */}
          <select aria-label="Lesson" className={cn(FIELD, 'pr-3 md:hidden')} value={id} onChange={e => go(IDS.indexOf(e.target.value))}>
            {LESSONS.map((l, i) => <option key={l.id} value={l.id}>{i + 1}. {l.title}</option>)}
          </select>
          <header className="flex flex-col gap-1">
            <span className="font-mono text-[11px] tracking-[.08em] text-ink-3 uppercase">Lesson {index + 1} of {LESSONS.length}</span>
            <h1 className="m-0 text-[clamp(22px,3.4vw,30px)] leading-[1.2] font-semibold tracking-[-.01em]">{lesson.title}</h1>
          </header>
          {body}
          <footer className="mt-4 flex items-center justify-between gap-3 border-t border-rule pt-5">
            <Button disabled={index === 0} onClick={() => go(index - 1)}>← Previous</Button>
            <span className="font-mono text-[11px] text-ink-3">{index + 1} / {LESSONS.length}</span>
            <Button variant="primary" disabled={index === LESSONS.length - 1} onClick={() => go(index + 1)}>Next →</Button>
          </footer>
        </article>
      </div>
    </section>
  );
}
