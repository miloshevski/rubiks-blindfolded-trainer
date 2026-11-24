import { getLocal, id, updateLocal, type Review } from './local';
export type Rating = 'Again' | 'Hard' | 'Good' | 'Easy';
const DAYS = [1, 3, 7, 14, 30];
export function schedule(previous: Review | undefined, rating: Rating, now: number): Review {
  const stage =
    rating === 'Again'
      ? 0
      : Math.min(
          4,
          (previous?.stage ?? -1) +
            (rating === 'Easy' ? 2 : rating === 'Good' ? 1 : previous ? 0 : 1),
        );
  return {
    stage,
    due: now + DAYS[stage] * 86400000,
    attempts: (previous?.attempts ?? 0) + 1,
    correct: (previous?.correct ?? 0) + (rating === 'Again' ? 0 : 1),
  };
}
export function recordAttempt(
  mode: string,
  item: string,
  ok: boolean,
  ms: number,
  rating?: Rating,
) {
  updateLocal((d) => {
    const key = `${d.activeScheme}:${mode}:${item}`;
    d.attempts.push({ id: id(), at: Date.now(), mode, item, ok, ms });
    d.reviews[key] = schedule(d.reviews[key], rating ?? (ok ? 'Good' : 'Again'), Date.now());
  });
}
export function nextReview(mode: string, items: string[], previous?: string, now = Date.now()) {
  const d = getLocal(),
    reviews = d.reviews;
  const pool = items.filter((x) => x !== previous);
  const choices = pool.length ? pool : items;
  const due = choices
    .filter((x) => reviews[`${d.activeScheme}:${mode}:${x}`]?.due <= now)
    .sort(
      (a, b) =>
        reviews[`${d.activeScheme}:${mode}:${a}`].due -
        reviews[`${d.activeScheme}:${mode}:${b}`].due,
    );
  return (
    due[0] ??
    choices.find((x) => !reviews[`${d.activeScheme}:${mode}:${x}`]) ??
    [...choices].sort(
      (a, b) =>
        reviews[`${d.activeScheme}:${mode}:${a}`].due -
        reviews[`${d.activeScheme}:${mode}:${b}`].due,
    )[0]
  );
}
