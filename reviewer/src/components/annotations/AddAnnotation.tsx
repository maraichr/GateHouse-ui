import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAnnotation } from '../../api/specs';

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
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-reviewer-300 focus:border-reviewer-400 resize-none"
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-gray-600">
            <input
              type="radio"
              name="state"
              checked={state === 'open'}
              onChange={() => setState('open')}
              className="text-reviewer-600"
            />
            Comment
          </label>
          <label className="flex items-center gap-1 text-xs text-red-600">
            <input
              type="radio"
              name="state"
              checked={state === 'blocking'}
              onChange={() => setState('blocking')}
              className="text-red-600"
            />
            Blocking
          </label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDone}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!body.trim() || mutation.isPending}
            className="text-xs bg-reviewer-600 text-white px-3 py-1 rounded-md hover:bg-reviewer-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? 'Saving...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
