import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useGraphStore } from '../../store/graph-store';
import { buildShareUrl } from '../../engine/serialization';
import { analytics } from '../../analytics';

interface ShareDialogProps {
  onClose: () => void;
}

export function ShareDialog({ onClose }: ShareDialogProps) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const [url, setUrl] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    buildShareUrl({ nodes, edges }).then((result) => {
      if (!cancelled) setUrl(result);
    });
    return () => {
      cancelled = true;
    };
  }, [nodes, edges]);

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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface-800 border border-surface-border rounded-lg p-5 w-[480px] shadow-xl">
        <h2 className="text-lg font-semibold text-brand-text mb-3">Share Graph</h2>
        <p className="text-sm text-stone-400 mb-3">
          Anyone with this link can view a read-only copy of your graph.
        </p>

        {url ? (
          <div className="flex gap-2">
            <input
              readOnly
              value={url}
              className="flex-1 bg-surface-700 text-stone-200 text-sm rounded px-2 py-1.5 border border-surface-border truncate"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-sm text-white bg-brand hover:bg-brand-bright rounded shrink-0"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ) : (
          <div className="text-sm text-stone-500">Generating link...</div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-stone-300 hover:text-white bg-surface-700 hover:bg-surface-600 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
