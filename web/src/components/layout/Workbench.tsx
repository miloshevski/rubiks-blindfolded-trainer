import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Header } from '../header/Header';

interface Props {
  /** Grid classes of this page's layout. */
  layout: string;
  /** Page-specific header controls. */
  controls?: ReactNode;
  children: ReactNode;
}

/** The frame every page shares: the header over a grid that fills the rest of the screen. */
export function Workbench({ layout, controls, children }: Props) {
  return (
    <>
      <Header>{controls}</Header>
      <main className={cn('grid min-h-0 flex-[1_1_auto]', layout)}>{children}</main>
    </>
  );
}
