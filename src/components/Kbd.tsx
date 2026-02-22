import { useUIStore } from '../store/ui-store';
import { SHORTCUT_KEYS, type ShortcutId } from '../lib/shortcuts';

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center px-1 min-w-[18px] h-[18px] text-[10px] font-mono bg-surface-900 border border-surface-border rounded text-stone-400 leading-none">
      {children}
    </kbd>
  );
}

/** Renders the key sequence for a named shortcut. Only visible when shortcut hints are active (Alt held). */
export function ShortcutHint({ id }: { id: ShortcutId }) {
  const showShortcutHints = useUIStore((s) => s.showShortcutHints);
  if (!showShortcutHints) return null;

  const keys = SHORTCUT_KEYS[id];
  return (
    <span className="flex items-center gap-0.5 shrink-0">
      {keys.map((k, i) => (
        <Kbd key={i}>{k}</Kbd>
      ))}
    </span>
  );
}

/** Always-visible shortcut hint, used in the help overlay. */
export function ShortcutHintStatic({ id }: { id: ShortcutId }) {
  const keys = SHORTCUT_KEYS[id];
  return (
    <span className="flex items-center gap-0.5 shrink-0">
      {keys.map((k, i) => (
        <Kbd key={i}>{k}</Kbd>
      ))}
    </span>
  );
}
