import { useState } from 'react';
import { X, CheckCircle2, AlertOctagon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnnotationComment } from './AnnotationComment';
import { AddAnnotation } from './AddAnnotation';
import { Badge } from '../utility/Badge';
import { Button } from '../ui/Button';
import { updateAnnotation } from '../../api/specs';
import type { Annotation } from '../../types';

interface AnnotationThreadProps {
  annotations: Annotation[];
  elementPath: string;
  elementType: string;
  specId: string;
  versionId: string;
  onClose: () => void;
}

const stateColors: Record<string, 'red' | 'blue' | 'green'> = {
  blocking: 'red',
  open: 'blue',
  resolved: 'green',
};

export function AnnotationThread({
  annotations,
  elementPath,
  elementType,
  specId,
  versionId,
  onClose,
}: AnnotationThreadProps) {
  const matching = annotations.filter((a) => a.element_path === elementPath);
  const [showAdd, setShowAdd] = useState(matching.length === 0);
  const queryClient = useQueryClient();

  const resolveAnnotation = useMutation({
    mutationFn: (annotationId: string) => updateAnnotation(annotationId, 'resolved'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['annotations', specId, versionId] }),
  });

  const blockAnnotation = useMutation({
    mutationFn: (annotationId: string) => updateAnnotation(annotationId, 'blocking'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['annotations', specId, versionId] }),
  });

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-surface-200 dark:border-zinc-800 shadow-elevation-lg w-96 max-h-[70vh] flex flex-col animate-scale-in">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-zinc-800">
        <div>
          <h4 className="text-sm font-semibold text-surface-900 dark:text-zinc-100">Annotations</h4>
          <p className="text-xs text-surface-500 dark:text-zinc-400 font-mono">{elementPath}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-surface-400 dark:text-zinc-500 hover:text-surface-600 dark:hover:text-zinc-300 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {matching.length === 0 && !showAdd && (
          <p className="text-sm text-surface-400 dark:text-zinc-500 text-center py-4">No annotations yet</p>
        )}

        {matching.map((annotation) => (
          <div key={annotation.id} className="space-y-2">
            <AnnotationComment annotation={annotation} />
            <div className="flex items-center gap-1.5 ml-8">
              <Badge color={stateColors[annotation.state] || 'gray'}>{annotation.state}</Badge>
              {annotation.state !== 'resolved' && (
                <button
                  onClick={() => resolveAnnotation.mutate(annotation.id)}
                  className="text-[10px] flex items-center gap-0.5 text-success-600 dark:text-success-400 hover:text-success-800 dark:hover:text-success-300 transition-colors"
                >
                  <CheckCircle2 className="w-3 h-3" /> Resolve
                </button>
              )}
              {annotation.state === 'open' && (
                <button
                  onClick={() => blockAnnotation.mutate(annotation.id)}
                  className="text-[10px] flex items-center gap-0.5 text-danger-600 dark:text-danger-400 hover:text-danger-800 dark:hover:text-danger-300 transition-colors"
                >
                  <AlertOctagon className="w-3 h-3" /> Block
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-surface-200 dark:border-zinc-800 p-4">
        {showAdd ? (
          <AddAnnotation
            specId={specId}
            versionId={versionId}
            elementPath={elementPath}
            elementType={elementType}
            onDone={() => setShowAdd(false)}
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdd(true)}
            className="w-full"
          >
            + Add annotation
          </Button>
        )}
      </div>
    </div>
  );
}
