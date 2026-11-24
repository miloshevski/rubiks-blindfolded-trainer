import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const BASE = 'inline-flex items-center justify-center gap-2 rounded border font-medium whitespace-nowrap cursor-pointer '
  + 'transition-[background-color,border-color] duration-[120ms] disabled:cursor-default';
const VARIANT = {
  default: 'border-edge bg-raise text-ink enabled:hover:border-edge-2 enabled:hover:bg-raise-2 enabled:active:bg-press '
    + 'disabled:border-rule disabled:text-ink-3',
  primary: 'border-ink bg-ink text-bg enabled:hover:border-white enabled:hover:bg-white',
};
const SIZE = { md: 'h-8 px-3 text-[13px] touch:h-10', sm: 'h-7 px-2.5 text-[12px] touch:h-9' };

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANT;
  size?: keyof typeof SIZE;
}

export function Button({ variant = 'default', size = 'md', className, type = 'button', ...rest }: Props) {
  return <button type={type} className={cn(BASE, VARIANT[variant], SIZE[size], className)} {...rest} />;
}

/** Keyboard hint inside a button, e.g. "R" or "↵". */
export function Kbd({ children }: { children: string }) {
  return <span className="rounded-[3px] border border-current px-1 font-mono text-[10.5px] leading-[14px] font-normal opacity-55">{children}</span>;
}
