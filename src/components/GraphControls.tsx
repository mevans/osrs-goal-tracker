import type { CSSProperties, ReactNode } from 'react';
import { ControlButton, Controls, useReactFlow, useStore, useStoreApi } from '@xyflow/react';
import { SHORTCUT_KEYS, type ShortcutId } from '../lib/shortcuts';

const CONTROLS_CLASS = 'z-10! border-surface-border! shadow-lg! [&_button]:border-surface-border!';

function formatKeys(id: ShortcutId): string {
  const keys = SHORTCUT_KEYS[id];
  const separator = keys.some((key) => key.length > 1) ? '+' : '';
  return keys.join(separator);
}

function withShortcut(label: string, id: ShortcutId): string {
  return `${label} · ${formatKeys(id)}`;
}

function TipButton({
  label,
  onClick,
  disabled,
  pressed,
  style,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <span className="group/tip relative flex last:[&>button]:border-b-0">
      <ControlButton
        aria-label={label}
        aria-pressed={pressed ?? false}
        onClick={onClick}
        disabled={disabled ?? false}
        className={
          pressed
            ? 'bg-brand! text-white! hover:bg-brand-bright!'
            : 'bg-surface-800! text-stone-300! hover:bg-surface-700!'
        }
        {...(style ? { style } : {})}
      >
        {children}
      </ControlButton>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-1/2 left-full z-50 ml-2 -translate-y-1/2 rounded-md border border-surface-border bg-surface-900 px-2 py-1 text-xs leading-none whitespace-nowrap text-stone-200 opacity-0 shadow-lg group-focus-within/tip:opacity-100 group-hover/tip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M5 11h14v2H5z" />
    </svg>
  );
}

function FitViewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 9V4h5v2H6v3H4zm10-5h5v5h-2V6h-3V4zM4 15h2v3h3v2H4v-5zm14 0h2v5h-5v-2h3v-3z" />
    </svg>
  );
}

function LockIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      {open ? (
        <path d="M17 9h-7V7a3 3 0 0 1 5.8-1H18a5 5 0 0 0-10 1v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-5 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
      ) : (
        <path d="M17 9V7a5 5 0 0 0-10 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-5 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm-3-8V7a3 3 0 0 1 6 0v2z" />
      )}
    </svg>
  );
}

function TidyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" opacity="0.85" />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" />
    </svg>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ fill: 'none' }}
    >
      {off ? (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 10.7a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 5.1A11 11 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.2 3.6" />
          <path d="M6.1 6.1A18 18 0 0 0 2 12s3.5 7 10 7a11 11 0 0 0 4.2-.8" />
        </>
      ) : (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export function GraphControls({
  onTidy,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  hideCompleted = false,
  onToggleHideCompleted,
}: {
  onTidy?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hideCompleted?: boolean;
  onToggleHideCompleted?: () => void;
}) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const store = useStoreApi();
  const maxZoomReached = useStore((s) => s.transform[2] >= s.maxZoom);
  const minZoomReached = useStore((s) => s.transform[2] <= s.minZoom);
  const isInteractive = useStore(
    (s) => s.nodesDraggable || s.nodesConnectable || s.elementsSelectable,
  );

  const historyStyle = (enabled: boolean): CSSProperties => ({
    opacity: enabled ? 1 : 0.3,
    cursor: enabled ? 'pointer' : 'not-allowed',
  });

  return (
    <Controls
      showZoom={false}
      showFitView={false}
      showInteractive={false}
      className={CONTROLS_CLASS}
      aria-label="Graph actions"
    >
      <TipButton label="Zoom in" onClick={() => zoomIn()} disabled={maxZoomReached}>
        <PlusIcon />
      </TipButton>
      <TipButton label="Zoom out" onClick={() => zoomOut()} disabled={minZoomReached}>
        <MinusIcon />
      </TipButton>
      <TipButton label={withShortcut('Fit view', 'fitView')} onClick={() => fitView()}>
        <FitViewIcon />
      </TipButton>
      <TipButton
        label={isInteractive ? 'Lock canvas' : 'Unlock canvas'}
        onClick={() => {
          const next = !isInteractive;
          store.setState({
            nodesDraggable: next,
            nodesConnectable: next,
            elementsSelectable: next,
          });
        }}
      >
        <LockIcon open={isInteractive} />
      </TipButton>
      {onToggleHideCompleted && (
        <TipButton
          label={hideCompleted ? 'Show completed' : 'Hide completed'}
          pressed={hideCompleted}
          onClick={onToggleHideCompleted}
        >
          <EyeIcon off={hideCompleted} />
        </TipButton>
      )}
      {onTidy && (
        <TipButton label="Tidy layout" onClick={onTidy}>
          <TidyIcon />
        </TipButton>
      )}
      {onUndo && (
        <TipButton
          label={withShortcut('Undo', 'undo')}
          onClick={onUndo}
          style={historyStyle(canUndo)}
        >
          <UndoIcon />
        </TipButton>
      )}
      {onRedo && (
        <TipButton
          label={withShortcut('Redo', 'redo')}
          onClick={onRedo}
          style={historyStyle(canRedo)}
        >
          <RedoIcon />
        </TipButton>
      )}
    </Controls>
  );
}
