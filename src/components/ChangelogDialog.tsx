import Markdown, { type Components } from 'react-markdown';
import { CHANGELOG, LATEST_CHANGELOG_ID, type ChangelogEntry } from '../changelog';
import { useChangelogStore } from '../store/changelog-store';

interface ChangelogDialogProps {
  entries: ChangelogEntry[];
  onClose: () => void;
  markSeenOnClose: boolean;
}

const markdownComponents: Components = {
  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
  li: ({ children }) => <li className="text-sm text-stone-400">{children}</li>,
  p: ({ children }) => <p className="text-sm text-stone-400 mb-2 last:mb-0">{children}</p>,
  a: ({ children, ...props }) => (
    <a
      {...props}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand hover:text-brand-bright underline"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="text-stone-300 font-medium">{children}</strong>,
};

export function ChangelogDialog({ entries, onClose, markSeenOnClose }: ChangelogDialogProps) {
  const markSeen = useChangelogStore((s) => s.markSeen);
  const isWhatsNew = entries.length < CHANGELOG.length;

  const handleClose = () => {
    if (markSeenOnClose && LATEST_CHANGELOG_ID) {
      markSeen(LATEST_CHANGELOG_ID);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-surface-800 border border-surface-border rounded-lg w-[480px] max-h-[80vh] shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 border-b border-surface-border">
          <h2 className="text-lg font-semibold text-brand-text">
            {isWhatsNew ? "What's New" : 'Changelog'}
          </h2>
          {isWhatsNew && (
            <p className="text-xs text-stone-500 mt-1">Updates since your last visit</p>
          )}
        </div>

        <div className="overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {entries.map((entry) => (
            <section key={entry.id}>
              <div className="flex items-baseline gap-2 mb-2">
                <h3 className="text-sm font-semibold text-stone-200">{entry.title}</h3>
                <span className="text-xs text-stone-500">{entry.date}</span>
              </div>
              <Markdown components={markdownComponents}>{entry.content}</Markdown>
            </section>
          ))}
        </div>

        <div className="flex justify-end px-5 py-4 border-t border-surface-border">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 text-sm text-white bg-brand hover:bg-brand-bright rounded font-medium"
          >
            {markSeenOnClose ? 'Got it' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
