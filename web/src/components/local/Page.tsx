import type { ReactNode } from 'react';
import { Header } from '../header/Header';
export function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto flex w-full min-w-0 max-w-[1200px] flex-col gap-5 box-border px-5 py-6">
          <h1 className="m-0 text-[20px] font-medium">{title}</h1>
          {children}
        </div>
      </main>
    </>
  );
}
export const ROW = 'flex flex-wrap items-center gap-2';
export const FIELD = 'rounded border border-edge bg-sunk px-2 py-1.5 text-[13px] text-ink';
