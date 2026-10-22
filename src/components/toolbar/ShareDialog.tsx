import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useGraphStore } from '../../store/graph-store';
import { buildShareUrl } from '../../engine/serialization';
import { analytics } from '../../analytics';
import { DeviceSyncSection } from './DeviceSyncDialog';
import { Dialog, dialogCancel } from '../ui/dialog';

interface ShareDialogProps {
  onClose: () => void;
}

export function ShareDialog({ onClose }: ShareDialogProps) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const notes = useGraphStore((s) => s.notes);
  const [url, setUrl] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    buildShareUrl({ nodes, edges, notes }).then((result) => {
      if (!cancelled) setUrl(result);
    });
    return () => {
      cancelled = true;
    };
  }, [nodes, edges, notes]);

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      analytics.shareGenerated();
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link — check clipboard permissions');
    }
  };

  return (
    <Dialog
      title="Sync"
      description="Keep this graph up to date on your other phones and computers."
      onClose={onClose}
      width="lg"
      footer={
        <button type="button" onClick={onClose} className={dialogCancel}>
          Close
        </button>
      }
    >
      <section className="mb-5">
        <DeviceSyncSection />
      </section>

      <div className="h-px bg-surface-border mb-5" />

      <section>
        <h3 className="text-sm font-medium text-stone-200 mb-1">Read-only link</h3>
        <p className="text-sm text-stone-400 mb-3">
          Anyone with this link can view a copy. They cannot edit it.
        </p>

        {url ? (
          <div className="flex gap-2">
            <input
              readOnly
              value={url}
              className="flex-1 bg-surface-700 text-stone-200 text-sm rounded px-2 py-1.5 border border-surface-border truncate"
            />
            <button
              onClick={() => void handleCopy()}
              className="px-3 py-1.5 text-sm text-stone-200 bg-surface-600 hover:bg-surface-500 rounded shrink-0"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ) : (
          <div className="text-sm text-stone-500">Generating link...</div>
        )}
      </section>
    </Dialog>
  );
}
