import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAnnotation } from '../../api/specs';
import { Button } from '../ui/Button';

interface AddAnnotationProps {
  specId: string;
  versionId: string;
  elementPath: string;
  elementType: string;
  onDone: () => void;
}

export function AddAnnotation({ specId, versionId, elementPath, elementType, onDone }: AddAnnotationProps) {
  const [body, setBody] = useState('');
  const [state, setState] = useState<'open' | 'blocking'>('open');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      createAnnotation(specId, versionId, {
        element_path: elementPath,
        element_type: elementType,
        body,
        state,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['annotations', specId, versionId] });
      setBody('');
      onDone();
    },
  });

  return (
    <div className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add your feedback..."
        rows={3}
        className="w-full text-sm border border-surface-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-surface-900 dark:text-zinc-100 placeholder:text-surface-400 dark:placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-500 resize-none"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-surface-600 dark:text-zinc-400 cursor-pointer">
            <input
              type="radio"
              name="state"
              checked={state === 'open'}
              onChange={() => setState('open')}
              className="accent-brand-600"
            />
            Comment
          </label>
          <label className="flex items-center gap-1.5 text-xs text-danger-600 dark:text-danger-400 cursor-pointer">
            <input
              type="radio"
              name="state"
              checked={state === 'blocking'}
              onChange={() => setState('blocking')}
              className="accent-danger-600"
            />
            Blocking
          </label>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" color="neutral" size="sm" onClick={onDone}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={!body.trim() || mutation.isPending}
            loading={mutation.isPending}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
