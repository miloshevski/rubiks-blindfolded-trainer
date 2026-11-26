import type { MouseEvent, ReactNode } from 'react';
import { MODE_PATH, navigate } from '../../lib/route';
import type { AppMode } from '../../lib/types';

/** A real link to a page (middle-click and "open in new tab" work) that switches pages without a reload. */
export function PageLink({ to, className, children }: { to: AppMode; className?: string; children: ReactNode }) {
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return <a href={MODE_PATH[to]} onClick={go} className={className}>{children}</a>;
}
