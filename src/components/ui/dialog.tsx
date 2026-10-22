import type { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

function isDialogPopover(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('[data-dialog-popover]') !== null;
}

const widths = {
  sm: 'max-w-[360px]',
  md: 'max-w-[420px]',
  lg: 'max-w-[480px]',
} as const;

export const dialogCancel =
  'px-3 py-1.5 text-sm text-stone-300 hover:text-white bg-surface-700 hover:bg-surface-600 rounded';

export const dialogPrimary =
  'px-3 py-1.5 text-sm text-white bg-brand hover:bg-brand-bright rounded font-medium disabled:opacity-40 disabled:cursor-not-allowed';

export const dialogDanger =
  'px-3 py-1.5 text-sm text-white bg-red-700 hover:bg-red-600 rounded font-medium';

interface DialogProps {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: keyof typeof widths;
  /** Overlay click and Escape close the dialog. Forced choices set this false. */
  dismissable?: boolean;
  className?: string;
}

export function Dialog({
  title,
  description,
  onClose,
  children,
  footer,
  width = 'md',
  dismissable = true,
  className = '',
}: DialogProps) {
  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(next) => {
        if (!next && dismissable) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <DialogPrimitive.Content
          {...(description === undefined ? { 'aria-describedby': undefined } : {})}
          className={`fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[calc(100%-2rem)] ${widths[width]} -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg border border-surface-border bg-surface-800 shadow-xl focus:outline-none ${className}`}
          onPointerDownOutside={(event) => {
            if (isDialogPopover(event.target) || !dismissable) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (isDialogPopover(event.target) || !dismissable) event.preventDefault();
          }}
          onFocusOutside={(event) => {
            if (isDialogPopover(event.target)) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            event.stopPropagation();
            if (!dismissable) event.preventDefault();
          }}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-surface-border px-5 py-4">
            <div>
              <DialogPrimitive.Title className="text-lg font-semibold text-brand-text">
                {title}
              </DialogPrimitive.Title>
              {description !== undefined && (
                <DialogPrimitive.Description className="mt-1 text-sm text-stone-400">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            {dismissable && (
              <DialogPrimitive.Close
                className="text-xl leading-none text-stone-400 hover:text-white"
                aria-label="Close"
              >
                ×
              </DialogPrimitive.Close>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer !== undefined && (
            <div className="flex shrink-0 justify-end gap-2 border-t border-surface-border px-5 py-4">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
