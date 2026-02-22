import { useUIStore } from '../store/ui-store';
import { SHORTCUT_GROUPS } from '../lib/shortcuts';
import { Kbd, ShortcutHintStatic } from './Kbd';

export function KeyboardHelp() {
  const { showHelp, setShowHelp } = useUIStore();
  if (!showHelp) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="bg-surface-800 border border-surface-border rounded-xl shadow-2xl p-6 w-[480px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-brand-text">Keyboard Shortcuts</h2>
          <button
            onClick={() => setShowHelp(false)}
            className="text-stone-400 hover:text-white text-lg leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category}>
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-medium mb-2">
                {group.category}
              </div>
              <ul className="space-y-2">
                {group.items.map(({ id, label }) => (
                  <li key={id} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-stone-300">{label}</span>
                    <ShortcutHintStatic id={id} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <Kbd>Alt</Kbd>
            <span className="text-stone-500">Hold to reveal hints on buttons</span>
          </div>
          <p className="text-xs text-stone-500">Esc to close</p>
        </div>
      </div>
    </div>
  );
}
