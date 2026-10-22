import Markdown, { type Components } from 'react-markdown';
import { Dialog, dialogPrimary } from './ui/dialog';
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
    <Dialog
      title={isWhatsNew ? "What's New" : 'Changelog'}
      {...(isWhatsNew ? { description: 'Updates since your last visit' } : {})}
      onClose={handleClose}
      width="lg"
      footer={
        <button type="button" onClick={handleClose} className={dialogPrimary}>
          {markSeenOnClose ? 'Got it' : 'Close'}
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        {entries.map((entry) => (
          <section key={entry.id}>
            <div className="mb-2 flex items-baseline gap-2">
              <h3 className="text-sm font-semibold text-stone-200">{entry.title}</h3>
              <span className="text-xs text-stone-500">{entry.date}</span>
            </div>
            <Markdown components={markdownComponents}>{entry.content}</Markdown>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
