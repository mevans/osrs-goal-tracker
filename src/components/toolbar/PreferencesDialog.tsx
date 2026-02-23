import { usePreferencesStore } from '../../store/preferences-store';

interface PreferencesDialogProps {
  onClose: () => void;
}

export function PreferencesDialog({ onClose }: PreferencesDialogProps) {
  const hideCompleted = usePreferencesStore((s) => s.hideCompleted);
  const toggleHideCompleted = usePreferencesStore((s) => s.toggleHideCompleted);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface-800 border border-surface-border rounded-lg p-5 w-[400px] shadow-xl">
        <h2 className="text-lg font-semibold text-brand-text mb-4">Preferences</h2>

        <div className="flex flex-col gap-3">
          <label className="flex items-center justify-between gap-4 cursor-pointer group">
            <div>
              <div className="text-sm text-stone-200 font-medium">Hide completed nodes</div>
              <div className="text-xs text-stone-500 mt-0.5">
                Completed nodes are hidden from the canvas. They are not deleted.
              </div>
            </div>
            <button
              role="switch"
              aria-checked={hideCompleted}
              onClick={toggleHideCompleted}
              className={`relative shrink-0 w-10 h-6 rounded-full transition-colors ${
                hideCompleted ? 'bg-brand' : 'bg-surface-600'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  hideCompleted ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </div>

        <div className="flex justify-end mt-5">
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
