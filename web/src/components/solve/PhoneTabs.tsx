export type PhoneTab = 'memo' | 'solution' | 'net' | 'check';

const TABS: readonly [PhoneTab, string][] = [['memo', 'Memo'], ['solution', 'Solution'], ['net', 'Net'], ['check', 'Check']];

/** Phones only: one section at a time under the cube. */
export function PhoneTabs({ active, onChange }: { active: PhoneTab; onChange: (tab: PhoneTab) => void }) {
  return (
    <nav className="hidden border-b border-rule px-2 [grid-area:tabs] max-md:flex" role="tablist" aria-label="Sections">
      {TABS.map(([tab, label]) => (
        <button key={tab} type="button" role="tab" aria-selected={tab === active} onClick={() => onChange(tab)}
                className="h-11 flex-[1_1_0] cursor-pointer border-0 border-b-2 border-transparent bg-transparent text-[13px] text-ink-2
                           aria-selected:border-ink aria-selected:font-medium aria-selected:text-ink">
          {label}
        </button>
      ))}
    </nav>
  );
}

/** Classes that hide a section on phones unless its tab is active. */
export const tabVisibility = (tab: PhoneTab, active: PhoneTab, display: 'block' | 'flex' = 'block') =>
  tab === active ? (display === 'flex' ? 'max-md:flex' : 'max-md:block') : 'max-md:hidden';
