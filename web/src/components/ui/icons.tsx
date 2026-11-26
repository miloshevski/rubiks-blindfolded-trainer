// Inline icons. Static JSX hoisted to module level (created once).

export const IconOk = (
  <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true" className="inline">
    <path d="M2.5 7.4l3 3 6-6.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconBad = (
  <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true" className="inline">
    <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const IconReset = (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 7a4.5 4.5 0 1 0 1.4-3.3" /><path d="M2.5 2v2.5H5" />
  </svg>
);

export const IconPrev = (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M2.5 2v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M10 2.2v7.6L4.4 6z" fill="currentColor" />
  </svg>
);

export const IconNext = (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M9.5 2v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /><path d="M2 2.2v7.6L7.6 6z" fill="currentColor" />
  </svg>
);

export const IconPlay = (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4L10 6z" fill="currentColor" /></svg>
);

export const IconPause = (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 2h2.4v8H2.5zM7.1 2h2.4v8H7.1z" fill="currentColor" /></svg>
);

export const BrandMark = (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.2">
      <rect x="1" y="1" width="4.4" height="4.4" rx=".8" /><rect x="6.8" y="1" width="4.4" height="4.4" rx=".8" />
      <rect x="12.6" y="1" width="4.4" height="4.4" rx=".8" /><rect x="1" y="6.8" width="4.4" height="4.4" rx=".8" />
      <rect x="12.6" y="6.8" width="4.4" height="4.4" rx=".8" /><rect x="1" y="12.6" width="4.4" height="4.4" rx=".8" />
      <rect x="6.8" y="12.6" width="4.4" height="4.4" rx=".8" /><rect x="12.6" y="12.6" width="4.4" height="4.4" rx=".8" />
    </g>
    <rect x="6.8" y="6.8" width="4.4" height="4.4" rx=".8" fill="var(--color-accent)" />
  </svg>
);

export const IconHint = (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5.5 11.5c0-1-1.7-1.9-1.7-4.2a4.2 4.2 0 0 1 8.4 0c0 2.3-1.7 3.2-1.7 4.2zM6 14h4" />
  </svg>
);

export const IconTrash = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 4.5h11M6 4.5V3h4v1.5M4 4.5l.6 8.5h6.8l.6-8.5M6.7 7v3.5M9.3 7v3.5" />
  </svg>
);

/** A star: outline, or filled when `filled` (a saved scramble). */
export const iconStar = (filled: boolean) => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 1.8l1.9 4 4.3.5-3.2 2.9.9 4.3L8 11.3 4.1 13.5l.9-4.3L1.8 6.3l4.3-.5z" />
  </svg>
);
