import { useEffect, useState } from 'react';
import { useGraphStore } from '../../store/graph-store';
import { buildShareUrl } from '../../engine/serialization';

interface ShareDialogProps {
  onClose: () => void;
}

export function ShareDialog({ onClose }: ShareDialogProps) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const [url, setUrl] = useState<string | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    buildShareUrl({ nodes, edges }).then(setUrl);
  }, [nodes, edges]);

  const handleCopy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 w-[480px] shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-3">Share Graph</h2>
        <p className="text-sm text-gray-400 mb-3">
          Anyone with this link can view a read-only copy of your graph.
        </p>

        {url ? (
          <div className="flex gap-2">
            <input
              readOnly
              value={url}
              className="flex-1 bg-gray-700 text-gray-200 text-sm rounded px-2 py-1.5 border border-gray-600 truncate"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded shrink-0"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Generating link...</div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
