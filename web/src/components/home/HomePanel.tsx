import { useInstall } from '../../hooks/useInstall';
import { oneOf, useStoredState } from '../../hooks/useStoredState';
import { cn } from '../../lib/cn';
import type { AppMode } from '../../lib/types';
import { Button } from '../ui/Button';
import { Segmented, type SegOption } from '../ui/Segmented';
import { Meta } from '../ui/text';
import { PageLink } from './PageLink';

interface Feature {
  to: AppMode;
  title: string;
  text: string;
  /** What you can do there, shown as small tags. */
  tags: string[];
}

const FEATURES: readonly Feature[] = [
  {
    to: 'tutorial', title: 'Tutorial',
    text: 'Ten short lessons that teach the whole method: the lettering, tracing a memo, M2 edges, Old Pochmann corners and parity. Every example is live from the same engine as the Solve page.',
    tags: ['10 lessons', 'live examples', 'from zero'],
  },
  {
    to: 'solve', title: 'Solve',
    text: 'Paste a scramble or draw a random one. You get the memo letters, the full solution as one algorithm per target, and a 3D cube that plays it back move by move.',
    tags: ['memo', 'solution', '3D playback', 'recall check', 'share link', 'favorites'],
  },
  {
    to: 'drill', title: 'Letter drill',
    text: 'A sticker blinks on the solved cube and you type its Speffz letter. Pick which faces and which pieces (edges, corners) to practise.',
    tags: ['Speffz letters', 'edges / corners', 'per face'],
  },
  {
    to: 'algs', title: 'Algorithms',
    text: 'Every algorithm of the method in one filterable list: setup, core and undo for each edge and corner target, plus the parity algorithms.',
    tags: ['M2 edges', 'Old Pochmann corners', 'parity'],
  },
  {
    to: 'pairs', title: 'Pairs',
    text: 'The 24 × 24 letter-pair dictionary. Each pair has a word you can edit to make it your own, and edits are saved to the dictionary file.',
    tags: ['576 words', 'filter', 'editable'],
  },
  {
    to: 'timer', title: 'Timer',
    text: 'A stopwatch for your solves with scramble, penalties, averages and a cube net. Hold anywhere on a phone, or hold Space, then let go to start.',
    tags: ['hold & release', 'DNF / +2', 'Ao5 – Ao100', 'all solves'],
  },
];

const STEPS: readonly { to: AppMode; title: string; text: string }[] = [
  { to: 'tutorial', title: 'Take the tutorial', text: 'Ten short lessons teach the method from zero. Start here; the steps after it are your practice plan.' },
  { to: 'drill', title: 'Learn the lettering', text: 'Every sticker has a letter, A to X, four per face. Run the Letter drill until you can name any sticker at once.' },
  { to: 'pairs', title: 'Make your pair words', text: 'You memorise letters two at a time. Give each of the 576 pairs a word or image that sticks.' },
  { to: 'algs', title: 'Know the algorithms', text: 'Edges use M2 with a setup move, corners use the Y-permutation. Browse them all once.' },
  { to: 'solve', title: 'Practise on a scramble', text: 'Memorise the letters, type them from memory in the recall check, then watch the solution play out.' },
  { to: 'timer', title: 'Time yourself', text: 'Solve with the timer running and keep track of your averages.' },
];

type Level = 'new' | 'pro';
const LEVEL_CODEC = oneOf<Level>('new', 'pro');
const LEVELS: readonly SegOption<Level>[] = [
  { value: 'new', label: "I'm new to blindfold" },
  { value: 'pro', label: 'I already solve blind' },
];

/** For someone who knows the method: straight to practice. */
const PRACTICE: readonly { to: AppMode; tag: string; title: string; text: string }[] = [
  { to: 'solve', tag: 'Solve', title: 'Practise on a scramble', text: 'Memorise the letters, type them from memory in the recall check, then replay the solution to see where you slipped.' },
  { to: 'timer', tag: 'Timer', title: 'Timed attempts', text: 'Hold and release to start. Penalties, Ao5 to Ao100 and every solve are kept in this browser.' },
  { to: 'drill', tag: 'Letter drill', title: 'Sharpen your letters', text: 'Drill only the faces or pieces that still make you hesitate.' },
  { to: 'solve', tag: 'Favorites', title: 'Retry a saved scramble', text: 'Star a scramble on Solve or Timer, then load it again from Favorites to beat your last attempt.' },
  { to: 'pairs', tag: 'Pairs', title: 'Tune your pair words', text: 'Change any of the 576 words to match the images you actually use.' },
  { to: 'tutorial', tag: 'Tutorial', title: 'Refresh the method', text: 'Skim the lessons on tracing, M2, Old Pochmann and parity whenever something slips.' },
  { to: 'algs', tag: 'Algorithms', title: 'Check an algorithm', text: 'Setup, core and undo for every target, plus the parity algorithms. Press / to filter.' },
];

const CARD = 'group flex flex-col gap-2.5 rounded-md border border-rule bg-raise p-4 text-ink no-underline transition-colors duration-[120ms] '
  + 'hover:border-edge-2 hover:bg-raise-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

/** The landing page: what the trainer is, a first-session path, and every page with what it does. */
export function HomePanel() {
  const [level, setLevel] = useStoredState<Level>('bld.level', 'new', LEVEL_CODEC);
  const pro = level === 'pro';
  const { canInstall, iphoneHint, install } = useInstall();
  return (
    <section className="min-h-0 min-w-0 overflow-auto [grid-area:home]" aria-label="Home">
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-12 px-6 pt-12 pb-16 max-md:gap-9 max-md:px-4 max-md:pt-8 max-md:pb-12">
        <header className="flex flex-col items-start gap-4">
          <Meta className="tracking-[.08em] uppercase">3×3 blindfolded · M2 + Old Pochmann · Speffz</Meta>
          <h1 className="m-0 max-w-[720px] text-[clamp(30px,5vw,48px)] leading-[1.1] font-semibold tracking-[-.02em]">
            Learn to solve the cube <span className="text-accent">without looking</span>.
          </h1>
          <p className="m-0 max-w-[620px] text-[15px] leading-[1.6] text-ink-2">
            Blindfold Trainer takes a scramble and shows you exactly what to memorise and what to execute: the memo letters,
            one algorithm per target, and a cube that plays it all back. Then it drills the parts you need to know by heart.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <PageLink to={pro ? 'solve' : 'tutorial'} className="inline-flex h-11 items-center justify-center rounded border border-ink bg-ink px-6 text-[14px] font-medium text-bg no-underline transition-[background-color,border-color] duration-[120ms] hover:border-white hover:bg-white">
              {pro ? 'Practise a scramble' : 'Start the tutorial'}
            </PageLink>
            <PageLink to={pro ? 'timer' : 'solve'} className="inline-flex h-11 items-center justify-center rounded border border-edge bg-raise px-6 text-[14px] font-medium text-ink no-underline transition-[background-color,border-color] duration-[120ms] hover:border-edge-2 hover:bg-raise-2">
              {pro ? 'Start the timer' : 'Try a scramble first'}
            </PageLink>
          </div>
          <div className="flex flex-col items-start gap-1.5 pt-2">
            <Segmented options={LEVELS} value={level} onChange={setLevel} label="Your experience" />
            <Meta>{pro ? 'Skips the walkthrough and puts practice first.' : 'Not sure? Stay here and start with the tutorial.'}</Meta>
          </div>
          {canInstall ? (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button onClick={install}>Install the app</Button>
              <Meta>Opens full screen from your home screen; the tutorial and algorithms work offline.</Meta>
            </div>
          ) : iphoneHint ? (
            <Meta className="pt-1">Install it: tap Share in Safari, then Add to Home Screen.</Meta>
          ) : null}
        </header>

        {pro ? (
          <div>
            <h2 className="m-0 mb-1 text-[15px] font-semibold">Jump back in</h2>
            <p className="m-0 mb-4 text-[12.5px] text-ink-3">Everything you need to keep practising. You can switch to the walkthrough above at any time.</p>
            <ul className="m-0 grid list-none gap-3 p-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
              {PRACTICE.map(p => (
                <li key={p.title} className="flex">
                  <PageLink to={p.to} className={cn(CARD, 'w-full')}>
                    <span className="font-mono text-[11px] font-semibold tracking-[.08em] text-accent uppercase">{p.tag}</span>
                    <span className="text-[14px] font-semibold">{p.title}</span>
                    <span className="text-[12.5px] leading-[1.55] text-ink-2">{p.text}</span>
                  </PageLink>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <h2 className="m-0 mb-1 text-[15px] font-semibold">Your first sessions</h2>
            <p className="m-0 mb-4 text-[12.5px] text-ink-3">New to blindfolded solving? Work through these in order. Each step opens the page you need.</p>
            <ol className="m-0 grid list-none gap-3 p-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr))]">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex">
                  <PageLink to={s.to} className={cn(CARD, 'w-full')}>
                    <span className="flex size-6 items-center justify-center rounded-full border border-accent bg-accent-bg font-mono text-[12px] font-semibold text-accent">{i + 1}</span>
                    <span className="text-[13.5px] font-semibold">{s.title}</span>
                    <span className="text-[12.5px] leading-[1.55] text-ink-2">{s.text}</span>
                  </PageLink>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div>
          <h2 className="m-0 mb-1 text-[15px] font-semibold">Everything in the trainer</h2>
          <p className="m-0 mb-4 text-[12.5px] text-ink-3">The same pages are in the bar at the top of every screen. The logo brings you back here.</p>
          <ul className="m-0 grid list-none gap-3 p-0 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
            {FEATURES.map(f => (
              <li key={f.to} className="flex">
                <PageLink to={f.to} className={cn(CARD, 'w-full')}>
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[15px] font-semibold">{f.title}</span>
                    <span aria-hidden className="text-ink-3 transition-transform duration-[120ms] group-hover:translate-x-0.5 group-hover:text-accent">→</span>
                  </span>
                  <span className="text-[13px] leading-[1.6] text-ink-2">{f.text}</span>
                  <span className="mt-auto flex flex-wrap gap-1.5 pt-1">
                    {f.tags.map(t => <span key={t} className="rounded-[3px] border border-line px-1.5 py-px font-mono text-[11px] leading-[normal] text-ink-3">{t}</span>)}
                  </span>
                </PageLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-x-10 gap-y-5 border-t border-rule pt-8 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
          <div>
            <h2 className="m-0 mb-2 text-[13px] font-semibold">Good to know</h2>
            <ul className="m-0 flex list-disc flex-col gap-1.5 pl-4 text-[12.5px] leading-[1.55] text-ink-2">
              <li>Letters are Speffz: A–D on top, then left, front, right, back and down.</li>
              <li>Your solves, saved scrambles and settings stay in this browser.</li>
              <li>Share a scramble with the Share button on Solve: the link opens the same scramble.</li>
            </ul>
          </div>
          <div>
            <h2 className="m-0 mb-2 text-[13px] font-semibold">Keys</h2>
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[12.5px] text-ink-2">
              <dt className="font-mono text-ink">Space</dt><dd className="m-0">Play / pause the solution; hold and release to start the timer</dd>
              <dt className="font-mono text-ink">← →</dt><dd className="m-0">Step one move (with Shift: one target)</dd>
              <dt className="font-mono text-ink">R</dt><dd className="m-0">New random scramble on Solve</dd>
              <dt className="font-mono text-ink">/</dt><dd className="m-0">Jump to the filter on Algorithms and Pairs</dd>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
