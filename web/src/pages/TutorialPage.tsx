import { Workbench } from '../components/layout/Workbench';
import { TutorialPanel } from '../components/tutorial/TutorialPanel';

const LAYOUT = 'grid-cols-[minmax(0,1fr)] [grid-template-areas:"tutorial"]';

/** Tutorial (/tutorial): the method, taught lesson by lesson with live examples. */
export default function TutorialPage() {
  return (
    <Workbench layout={LAYOUT}>
      <TutorialPanel />
    </Workbench>
  );
}
