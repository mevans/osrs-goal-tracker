import { useEffect, useRef, useState } from 'react';

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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface-800 border border-surface-border rounded-lg p-5 w-[360px] shadow-xl">
        <h2 className="text-lg font-semibold text-brand-text mb-3">Name folded group</h2>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') onClose();
          }}
          className="w-full bg-surface-700 text-stone-200 text-sm rounded px-3 py-2 border border-surface-border focus:border-amber-500/50 focus:outline-none mb-4"
          aria-label="Group name"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-stone-300 hover:text-white rounded hover:bg-surface-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1.5 text-sm text-white bg-amber-700 hover:bg-amber-600 rounded font-medium"
          >
            Fold
          </button>
        </div>
      </div>
    </div>
  );
}
