import { useState, useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { Confirmation } from '../../types';
import { Dialog } from '../layout/Dialog';
import { Button } from '../shared/Button';

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (comment?: string) => void;
  confirmation: Confirmation;
  isLoading?: boolean;
  children?: ReactNode;
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  confirmation,
  isLoading,
  children,
}: ConfirmationDialogProps) {
  const [comment, setComment] = useState('');
  const [confirmInput, setConfirmInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setComment('');
      setConfirmInput('');
    }
  }, [open]);

  const requiresComment = confirmation.type === 'comment_required';
  const requiresTypeConfirm = confirmation.type === 'type_to_confirm';
  const confirmValue = confirmation.confirm_value || 'CONFIRM';

  const canConfirm =
    (!requiresComment || comment.trim().length > 0) &&
    (!requiresTypeConfirm || confirmInput === confirmValue);

  return (
    <Dialog open={open} onClose={onClose} aria-label="Confirmation">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 hover:opacity-70"
        style={{ color: 'var(--color-text-faint)' }}
        aria-label="Close dialog"
      >
        <X className="h-5 w-5" />
      </button>

      <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>{confirmation.message}</p>

      {children}

      {requiresComment && (
        <div className="mb-4">
          <label htmlFor="confirm-comment" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Comment *</label>
          <textarea
            id="confirm-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            placeholder="Enter a comment..."
            aria-required="true"
          />
        </div>
      )}

      {requiresTypeConfirm && (
        <div className="mb-4">
          <label htmlFor="confirm-type-input" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            Type <code className="px-1 rounded text-xs" style={{ backgroundColor: 'var(--color-bg-alt)' }}>{confirmValue}</code> to confirm
          </label>
          <input
            id="confirm-type-input"
            ref={inputRef}
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
            aria-required="true"
          />
        </div>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outlined" color="neutral" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="filled"
          color="primary"
          onClick={() => onConfirm(requiresComment ? comment : undefined)}
          disabled={!canConfirm}
          loading={isLoading}
        >
          {confirmation.confirm_text || 'Confirm'}
        </Button>
      </div>
    </Dialog>
  );
}
