import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export const SEG_GROUP = 'inline-flex gap-0.5 rounded-[5px] border border-line bg-sunk p-0.5';
/** A segment button without horizontal padding (callers add their own, see SEG_BUTTON). */
export const SEG_BUTTON_BASE = 'h-[26px] touch:h-9 cursor-pointer rounded-[3px] bg-transparent text-[12.5px] whitespace-nowrap text-ink-2 '
  + 'transition-colors duration-[120ms] enabled:hover:text-ink aria-pressed:bg-pressed aria-pressed:text-ink '
  + 'disabled:cursor-default disabled:text-disabled';
export const SEG_BUTTON = `${SEG_BUTTON_BASE} px-2.5`;

export interface SegOption<T extends string> {
  value: T;
  label: ReactNode;
  title?: string;
  disabled?: boolean;
  className?: string;
}

interface Props<T extends string> {
  options: readonly SegOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  labelledBy?: string;
  disabled?: boolean;
  className?: string;
}

/** Single-choice segmented control. Clicking the pressed option does nothing. */
export function Segmented<T extends string>({ options, value, onChange, label, labelledBy, disabled, className }: Props<T>) {
  return (
    <div className={cn(SEG_GROUP, className)} role="group" aria-label={label} aria-labelledby={labelledBy}>
      {options.map(o => (
        <button key={o.value} type="button" className={cn(SEG_BUTTON, o.className)} title={o.title}
                aria-pressed={o.value === value} disabled={disabled || o.disabled}
                onClick={() => { if (o.value !== value) onChange(o.value); }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
