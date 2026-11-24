import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import type { MoveRole } from '../../lib/solution';

/** Small monospace secondary text. */
export function Meta({ children, className, id }: { children?: ReactNode; className?: string; id?: string }) {
  return <span id={id} className={cn('font-mono text-[11px] leading-[1.4] text-ink-3', className)}>{children}</span>;
}

export const HEADING = 'm-0 text-[12px] font-semibold';

/** Text field look without right padding, so a caller can set its own without a class conflict. */
export const FIELD = 'h-9 touch:h-11 w-full rounded border border-line bg-sunk pl-3 font-mono text-[14px] tracking-[.01em] text-ink outline-none '
  + 'transition-colors duration-[120ms] placeholder:text-ink-3 hover:border-line-2 focus:border-ink aria-invalid:border-bad-edge';
/** A plain single-line input. */
export const INPUT = `${FIELD} pr-3 leading-[normal]`;

/** Section title row: heading on the left, meta on the right. */
export function SectionHead({ title, meta, tight, level = 2 }: { title: ReactNode; meta?: ReactNode; tight?: boolean; level?: 2 | 3 }) {
  const H = level === 2 ? 'h2' : 'h3';
  return (
    <div className={cn('flex items-baseline justify-between gap-2.5', tight ? 'mb-1' : 'mb-3.5')}>
      <H className={HEADING}>{title}</H>
      {meta == null ? null : <Meta>{meta}</Meta>}
    </div>
  );
}

/** Pane header bar: title + meta on the left, controls on the right. */
export function Bar({ title, meta, children, className, rightClassName }: {
  title: ReactNode; meta?: ReactNode; children?: ReactNode; className?: string; rightClassName?: string;
}) {
  return (
    <div className={cn('flex min-h-[53px] flex-none flex-wrap items-center justify-between gap-2.5 border-b border-rule px-5 py-2.5 max-md:px-4', className)}>
      <div className="flex items-baseline gap-2.5">
        <h2 className={HEADING}>{title}</h2>
        {meta}
      </div>
      {children == null ? null : <div className={cn('flex items-center gap-2', rightClassName)}>{children}</div>}
    </div>
  );
}

const BADGE_TONE = {
  plain: 'border-line-2',
  done: 'border-line-dim text-ink-3',
  current: 'border-ink bg-ink text-bg',
  buffer: 'border-dashed border-line-dim text-ink-3',
  accent: 'border-accent bg-accent-bg text-accent',
};

/** Letter box used in the solution sheet and the algorithm list. */
export function Badge({ children, tone = 'plain', small }: { children: ReactNode; tone?: keyof typeof BADGE_TONE; small?: boolean }) {
  return (
    <span className={cn('inline-flex h-[22px] w-6 items-center justify-center self-center rounded-[3px] border font-mono leading-[normal] font-semibold',
      small ? 'text-[10px]' : 'text-[13px]', BADGE_TONE[tone])}>
      {children}
    </span>
  );
}

/** Small outlined tag, e.g. "PARITY" or "as W". */
export function Pill({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <span title={title}
          className={cn('self-center rounded-[3px] border border-line-3 px-[5px] font-mono text-[10px] leading-4 font-medium tracking-[.04em] text-ink-2', className)}>
      {children}
    </span>
  );
}

export type TokenState = 'upcoming' | 'played' | 'now';

const ROLE_CLASS: Record<MoveRole, string> = {
  setup: '', plain: '', undo: 'text-ink-2', core: 'rounded-none bg-accent-bg font-medium text-accent',
};

/** Class of one move token: its role in the algorithm, and where playback is. */
export function tokenClass(role: MoveRole, state: TokenState = 'upcoming') {
  if (state === 'now') return 'rounded-[2px] bg-ink px-1 py-px font-semibold text-bg';
  if (state === 'played') {
    return cn('rounded-[2px] px-1 py-px font-normal text-ink-3', role === 'core' && 'rounded-none bg-accent-bg-dim');
  }
  return cn('rounded-[2px] px-1 py-px', ROLE_CLASS[role]);
}

/** Wrapper of a row of move tokens. */
export const ALG = '-ml-1 flex flex-wrap font-mono text-[13px] leading-5';
