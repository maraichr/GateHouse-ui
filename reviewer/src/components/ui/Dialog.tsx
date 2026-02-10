import { useEffect, useRef, useCallback, type ReactNode } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { Button } from './Button';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Dialog({ open, onClose, title, description, children, actions, size = 'md' }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Focus trap + Escape
  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handler);
    // Focus first focusable element
    requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      first?.focus();
    });

    return () => {
      window.removeEventListener('keydown', handler);
      previousFocus.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        ref={dialogRef}
        className={clsx(
          'relative w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-elevation-xl border border-surface-200 dark:border-zinc-800 animate-scale-in',
          sizeMap[size],
        )}
      >
        <div className="flex items-start justify-between p-5 pb-0">
          <div>
            <h2 id="dialog-title" className="text-lg font-semibold text-surface-900 dark:text-zinc-100">{title}</h2>
            {description && <p className="mt-1 text-sm text-surface-500 dark:text-zinc-400">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children && <div className="p-5">{children}</div>}
        {actions && (
          <div className="flex items-center justify-end gap-2 px-5 pb-5">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// Convenience confirm dialog
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmColor?: 'primary' | 'danger';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmColor = 'danger',
  loading,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      actions={
        <>
          <Button variant="ghost" color="neutral" onClick={onClose}>Cancel</Button>
          <Button color={confirmColor} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    />
  );
}
