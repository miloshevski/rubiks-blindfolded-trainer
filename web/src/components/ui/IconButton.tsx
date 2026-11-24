import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  primary?: boolean;
  label: string;
}

/** Square icon-only button (larger touch target on phones). */
export function IconButton({ primary, label, className, children, ...rest }: Props) {
  return (
    <button type="button" aria-label={label}
            className={cn(
              'inline-flex h-8 items-center justify-center rounded border p-0 cursor-pointer transition-[background-color,border-color] duration-[120ms] max-md:h-11',
              primary
                ? 'w-11 border-ink bg-ink text-bg hover:bg-white max-md:w-[52px]'
                : 'w-8 border-edge bg-raise text-ink hover:border-edge-2 hover:bg-raise-2 max-md:w-11',
              className,
            )}
            {...rest}>
      {children}
    </button>
  );
}
