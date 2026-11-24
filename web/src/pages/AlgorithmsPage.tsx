import { AlgorithmsPanel } from '../components/algs/AlgorithmsPanel';
import { Workbench } from '../components/layout/Workbench';
import { useAlgs } from '../hooks/useAlgs';
import { useFilterShortcut } from '../hooks/useFilterShortcut';

const LAYOUT = 'grid-cols-[minmax(0,1fr)] [grid-template-areas:"algs"]';

/** Algorithms: the method's algorithm list, filterable with "/". */
export default function AlgorithmsPage() {
  const algs = useAlgs();
  const filterRef = useFilterShortcut();
  return (
    <Workbench layout={LAYOUT}>
      <AlgorithmsPanel data={algs.data} error={algs.error} filterRef={filterRef} />
    </Workbench>
  );
}
