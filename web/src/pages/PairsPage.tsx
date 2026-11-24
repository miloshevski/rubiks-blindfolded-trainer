import { Workbench } from '../components/layout/Workbench';
import { PairsPanel } from '../components/pairs/PairsPanel';
import { useFilterShortcut } from '../hooks/useFilterShortcut';

const LAYOUT = 'grid-cols-[minmax(0,1fr)] [grid-template-areas:"pairs"]';

/** Pairs: the letter-pair dictionary (576 words), filterable with "/". */
export default function PairsPage() {
  const filterRef = useFilterShortcut();
  return (
    <Workbench layout={LAYOUT}>
      <PairsPanel filterRef={filterRef} />
    </Workbench>
  );
}
