import { Page, ROW } from '../components/local/Page';
import { Button } from '../components/ui/Button';
import { Demo } from '../components/local/Demo';
import { updateLocal, useLocal } from '../lib/local';
import { navigate } from '../lib/route';
import fixtures from '../data/fixtures.json';
import type { CubeData } from '../lib/types';
export default function HomePage() {
  const { data } = useLocal();
  const day = Math.floor(Date.now() / 86400000),
    fixture = fixtures[day % fixtures.length];
  return (
    <Page title="Blindfold cubing, one target at a time">
      <p className="m-0 max-w-2xl text-ink-2">
        Memorize the cube with your eyes open, then execute a sequence of targets without looking.
        Learn M2 edges and Old Pochmann corners with verified solutions, personal memory words, and
        focused practice.
      </p>
      <div className={ROW}>
        {[
          ['beginner', 'Complete beginner', 'learn'],
          ['developing', 'Learning BLD', 'practice'],
          ['experienced', 'Experienced cuber', 'timer'],
        ].map(([key, label, mode]) => (
          <Button
            key={key}
            onClick={() => {
              updateLocal((d) => {
                d.onboarding = key;
              });
              navigate(mode as 'learn' | 'practice' | 'timer');
            }}
          >
            {label}
          </Button>
        ))}
        <Button onClick={() => navigate('solve')}>Skip to Solver</Button>
      </div>
      <p className="m-0 text-ink-3">
        {data.lessons.length}/10 lessons complete · {data.attempts.length} practice answers ·{' '}
        {data.solves.length} recorded solves. Everything is stored in this browser.
      </p>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h2 className="text-[15px] font-medium">Try the cube</h2>
          <Demo cube={fixtures[2] as CubeData} />
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-[15px] font-medium">Recommended next step</h2>
          <p className="m-0 text-ink-2">
            {data.lessons.length < 10
              ? 'Continue your learning path, then try the matching practice drill.'
              : 'Review weak targets or record a timed solve.'}
          </p>
          <div className={ROW}>
            <Button onClick={() => navigate(data.lessons.length < 10 ? 'learn' : 'practice')}>
              Continue
            </Button>
            <Button onClick={() => navigate('pairs')}>Personalize memory words</Button>
          </div>
          <h2 className="text-[15px] font-medium">
            Daily challenge · {new Date(day * 86400000).toISOString().slice(0, 10)} UTC
          </h2>
          <p className="m-0 font-mono text-[12px] text-ink-2">{fixture.scramble}</p>
          <Button onClick={() => navigate('solve', { scramble: fixture.scramble, parity: '1' })}>
            Open today’s scramble
          </Button>
          <p className="text-ink-3">
            No account, uploads, or leaderboard. Share a scramble from Solver to practice together.
          </p>
        </div>
      </div>
    </Page>
  );
}
