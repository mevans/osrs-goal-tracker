import { useEffect, useRef, useState } from 'react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { dialogCancel, dialogDanger, dialogPrimary } from './dialog';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}

interface Request extends ConfirmOptions {
  resolve: (ok: boolean) => void;
  settled: boolean;
}

const pending: Request[] = [];
let notify: (request: Request | null) => void = () => {};

function showNext() {
  notify(pending[0] ?? null);
}

export function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    pending.push({ ...options, resolve, settled: false });
    if (pending.length === 1) showNext();
  });
}

function settle(ok: boolean) {
  const current = pending[0];
  if (!current || current.settled) return;
  current.settled = true;
  current.resolve(ok);
  pending.shift();
  showNext();
}

export function ConfirmHost() {
  const [current, setCurrent] = useState<Request | null>(null);
  const accepted = useRef(false);

  useEffect(() => {
    notify = setCurrent;
    showNext();
    return () => {
      notify = () => {};
    };
  }, []);

  return (
    <AlertDialog.Root
      open={current !== null}
      onOpenChange={(open) => {
        if (open) return;
        const ok = accepted.current;
        accepted.current = false;
        settle(ok);
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-black/60" />
        <AlertDialog.Content
          onEscapeKeyDown={(event) => event.stopPropagation()}
          {...(current?.description === undefined ? { 'aria-describedby': undefined } : {})}
          className="fixed left-1/2 top-1/2 z-[60] w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-surface-border bg-surface-800 shadow-xl focus:outline-none"
        >
          {current && (
            <>
              <div className="border-b border-surface-border px-5 py-4">
                <AlertDialog.Title className="text-lg font-semibold text-brand-text">
                  {current.title}
                </AlertDialog.Title>
                {current.description !== undefined && (
                  <AlertDialog.Description className="mt-1 text-sm text-stone-400">
                    {current.description}
                  </AlertDialog.Description>
                )}
              </div>
              <div className="flex justify-end gap-2 px-5 py-4">
                <AlertDialog.Cancel className={dialogCancel}>
                  {current.cancelLabel ?? 'Cancel'}
                </AlertDialog.Cancel>
                <AlertDialog.Action
                  className={current.tone === 'danger' ? dialogDanger : dialogPrimary}
                  onClick={() => {
                    accepted.current = true;
                  }}
                >
                  {current.confirmLabel ?? 'Continue'}
                </AlertDialog.Action>
              </div>
            </>
          )}
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
