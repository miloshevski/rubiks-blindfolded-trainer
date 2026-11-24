import type { Playback, Source } from '../../hooks/usePlayback';
import { cn } from '../../lib/cn';
import { segmentAt } from '../../lib/solution';
import { IconButton } from '../ui/IconButton';
import { IconNext, IconPause, IconPlay, IconPrev } from '../ui/icons';
import { Segmented, type SegOption } from '../ui/Segmented';
import { Meta } from '../ui/text';
import { Timeline } from './Timeline';

export type Speed = '2' | '5' | '10';
const SPEEDS: readonly SegOption<Speed>[] = (['2', '5', '10'] as const).map(v => ({ value: v, label: v, className: 'font-mono' }));

interface Props {
  playback: Playback;
  loaded: boolean;
  canPlayMine: boolean;
  speed: Speed;
  onSpeed: (speed: Speed) => void;
}

/** Playback controls and the solve timeline under the cube. */
export function Transport({ playback, loaded, canPlayMine, speed, onSpeed }: Props) {
  const { pos, playing, status, segments, frames, source } = playback;
  const total = frames?.length ?? 0;
  const sources: readonly SegOption<Source>[] = [
    { value: 'ref', label: 'Reference' },
    { value: 'mine', label: 'My solution', disabled: !canPlayMine, title: canPlayMine ? undefined : 'Check a solution first' },
  ];

  return (
    <div className="flex flex-col gap-3.5 border-t border-rule px-5 pt-3.5 pb-[18px] max-md:px-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
        <div className="flex gap-1.5">
          <IconButton label="Previous move (←)" title="Previous move (←, ⇧← previous target)" onClick={() => playback.step(-1)}>{IconPrev}</IconButton>
          <IconButton primary label={playing ? 'Pause (space)' : 'Play (space)'} title="Play / pause (space)" onClick={playback.play}>
            {playing ? IconPause : IconPlay}
          </IconButton>
          <IconButton label="Next move (→)" title="Next move (→, ⇧→ next target)" onClick={() => playback.step(1)}>{IconNext}</IconButton>
        </div>
        <div className="font-mono text-[13px] leading-[normal]">
          {loaded ? <>{pos}<span className="text-ink-3"> / {total}</span></> : null}
        </div>
        <span aria-live="polite"
              className={cn('font-mono text-[11.5px] leading-[normal]', status?.tone === 'ok' ? 'text-ok' : status?.tone === 'bad' ? 'text-bad' : 'text-ink-2')}>
          {status?.text ?? ''}
        </span>
        <div className="flex-[1_1_auto]" />
        <Segmented options={sources} value={source} onChange={playback.switchSource} label="Playback source" />
        <Segmented options={SPEEDS} value={speed} onChange={onSpeed} label="Speed, turns per second" />
        <Meta>tps</Meta>
      </div>
      <Timeline segments={segments} pos={pos} total={total} current={segmentAt(segments, pos)}
                onScrub={loaded ? playback.jumpTo : null} />
    </div>
  );
}
