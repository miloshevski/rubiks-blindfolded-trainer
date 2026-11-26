import { Workbench } from '../components/layout/Workbench';
import { HomePanel } from '../components/home/HomePanel';

const LAYOUT = 'grid-cols-[minmax(0,1fr)] [grid-template-areas:"home"]';

/** Home (/): what the trainer is, how to start, and every page. */
export default function HomePage() {
  return (
    <Workbench layout={LAYOUT}>
      <HomePanel />
    </Workbench>
  );
}
