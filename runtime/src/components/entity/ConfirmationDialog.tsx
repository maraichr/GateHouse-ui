import { useState, useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { Confirmation } from '../../types';

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

  if (!open) return null;

  const requiresComment = confirmation.type === 'comment_required';
  const requiresTypeConfirm = confirmation.type === 'type_to_confirm';
  const confirmValue = confirmation.confirm_value || 'CONFIRM';

  const canConfirm =
    (!requiresComment || comment.trim().length > 0) &&
    (!requiresTypeConfirm || confirmInput === confirmValue);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="text-sm text-gray-700 mb-4">{confirmation.message}</p>

        {children}

        {requiresComment && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment *</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a comment..."
            />
          </div>
        )}

        {requiresTypeConfirm && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <code className="bg-gray-100 px-1 rounded text-xs">{confirmValue}</code> to confirm
            </label>
            <input
              ref={inputRef}
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(requiresComment ? comment : undefined)}
            disabled={!canConfirm || isLoading}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : confirmation.confirm_text || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
