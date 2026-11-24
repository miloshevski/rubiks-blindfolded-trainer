import { useLocal } from '../../lib/local';
export function LocalStatus() {
  const { error } = useLocal();
  return error ? (
    <div role="alert" className="border-b border-bad-edge px-5 py-2 text-bad">
      {error}
    </div>
  ) : null;
}
