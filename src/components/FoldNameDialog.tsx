import { useEffect, useRef, useState } from 'react';
import { Dialog, dialogCancel, dialogPrimary } from './ui/dialog';

interface FoldNameDialogProps {
  defaultName: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

export function FoldNameDialog({ defaultName, onSubmit, onClose }: FoldNameDialogProps) {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  const handleSubmit = () => {
    onSubmit(name.trim() || defaultName);
  };

  return (
    <Dialog
      title="Name folded group"
      onClose={onClose}
      width="sm"
      footer={
        <>
          <button type="button" onClick={onClose} className={dialogCancel}>
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className={dialogPrimary}>
            Fold
          </button>
        </>
      }
    >
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
        }}
        className="w-full rounded border border-surface-border bg-surface-700 px-3 py-2 text-sm text-stone-200 focus:border-amber-500/50 focus:outline-none"
        aria-label="Group name"
      />
    </Dialog>
  );
}
