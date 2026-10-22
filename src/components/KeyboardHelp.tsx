import { useUIStore } from '../store/ui-store';
import { SHORTCUT_GROUPS } from '../lib/shortcuts';
import { Kbd, ShortcutHintStatic } from './Kbd';
import { Dialog } from './ui/dialog';

export function KeyboardHelp() {
  const { showHelp, setShowHelp } = useUIStore();
  if (!showHelp) return null;

  return (
    <Dialog title="Keyboard shortcuts" onClose={() => setShowHelp(false)} width="lg">
      <div className="grid grid-cols-2 gap-x-8 gap-y-5">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.category}>
            <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-stone-500">
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
      <div className="mt-5 flex items-center gap-2 border-t border-surface-border pt-4 text-xs text-stone-400">
        <Kbd>Alt</Kbd>
        <span className="text-stone-500">Hold to reveal hints on buttons</span>
      </div>
    </Dialog>
  );
}
