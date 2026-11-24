import { useEffect, useState } from 'react';
import { applyUpdate } from '../../lib/offline';
import { Button } from '../ui/Button';
export function UpdateNotice() {
  const [waiting, setWaiting] = useState(false),
    [message, setMessage] = useState('');
  useEffect(() => {
    const show = () => setWaiting(true);
    window.addEventListener('bld-update', show);
    return () => window.removeEventListener('bld-update', show);
  }, []);
  return waiting ? (
    <div className="flex items-center gap-3 border-b border-rule px-5 py-2">
      <span>Update ready. Finish your current exercise before reloading.</span>
      <Button
        onClick={() => {
          if (!applyUpdate()) setMessage('Finish this active attempt before updating.');
        }}
      >
        Update
      </Button>
      <span role="status">{message}</span>
    </div>
  ) : null;
}
