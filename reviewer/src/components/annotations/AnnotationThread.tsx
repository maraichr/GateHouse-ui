import { useState } from 'react';
import { X, CheckCircle2, AlertOctagon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AnnotationComment } from './AnnotationComment';
import { AddAnnotation } from './AddAnnotation';
import { Badge } from '../utility/Badge';
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-lg w-96 max-h-[70vh] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Annotations</h4>
          <p className="text-xs text-gray-500 font-mono">{elementPath}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {matching.length === 0 && !showAdd && (
          <p className="text-sm text-gray-400 text-center py-4">No annotations yet</p>
        )}

        {matching.map((annotation) => (
          <div key={annotation.id} className="space-y-2">
            <AnnotationComment annotation={annotation} />
            <div className="flex items-center gap-1.5 ml-8">
              <Badge color={stateColors[annotation.state] || 'gray'}>{annotation.state}</Badge>
              {annotation.state !== 'resolved' && (
                <button
                  onClick={() => resolveAnnotation.mutate(annotation.id)}
                  className="text-[10px] flex items-center gap-0.5 text-green-600 hover:text-green-800"
                >
                  <CheckCircle2 className="w-3 h-3" /> Resolve
                </button>
              )}
              {annotation.state === 'open' && (
                <button
                  onClick={() => blockAnnotation.mutate(annotation.id)}
                  className="text-[10px] flex items-center gap-0.5 text-red-600 hover:text-red-800"
                >
                  <AlertOctagon className="w-3 h-3" /> Block
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 p-4">
        {showAdd ? (
          <AddAnnotation
            specId={specId}
            versionId={versionId}
            elementPath={elementPath}
            elementType={elementType}
            onDone={() => setShowAdd(false)}
          />
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full text-sm text-reviewer-600 hover:text-reviewer-800 font-medium"
          >
            + Add annotation
          </button>
        )}
      </div>
    </div>
  );
}
