import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Header } from '../header/Header';
import { Button } from './Button';

const ISSUES = 'https://github.com/miloshevski/rubiks-blindfolded-trainer/issues/new/choose';

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Catches a crash in the page below it, so the visitor sees what happened (and a way out) instead of
 * a blank screen. The page is remounted when `key` changes, so switching pages clears it.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    // A page file that cannot be fetched usually means the app was updated while this tab was open.
    const stale = /dynamically imported module|Importing a module script failed|Loading chunk/i.test(error.message);
    return (
      <>
        <Header />
        <div role="alert" className="mx-auto flex w-full max-w-[560px] flex-col items-start gap-3 px-5 py-10">
          <h2 className="m-0 text-[17px] font-semibold">{stale ? 'The app was updated' : 'Something went wrong'}</h2>
          <p className="m-0 text-[13.5px] leading-[1.6] text-ink-2">
            {stale ? 'Reload the page to get the new version.' : 'This page crashed. Reloading usually fixes it; the other pages in the bar above should still work.'}
          </p>
          {stale ? null : (
            <pre className="m-0 max-h-40 w-full overflow-auto rounded border border-rule bg-sunk p-3 font-mono text-[11.5px] leading-[1.5] break-words whitespace-pre-wrap text-ink-3">
              {error.message || String(error)}
            </pre>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={() => location.reload()}>Reload</Button>
            {stale ? null : (
              <a href={ISSUES} target="_blank" rel="noopener noreferrer" className="text-[13px] text-accent underline underline-offset-2 hover:text-ink">
                Report it on GitHub
              </a>
            )}
          </div>
        </div>
      </>
    );
  }
}
