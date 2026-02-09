import { MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import type { Annotation } from '../../types';

interface AnnotationIndicatorProps {
  annotations: Annotation[];
  elementPath: string;
  onClick?: () => void;
}

export function AnnotationIndicator({ annotations, elementPath, onClick }: AnnotationIndicatorProps) {
  const matching = annotations.filter((a) => a.element_path === elementPath);
  if (matching.length === 0) return null;

  const hasBlocking = matching.some((a) => a.state === 'blocking');
  const hasOpen = matching.some((a) => a.state === 'open');
  const allResolved = matching.every((a) => a.state === 'resolved');

  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors',
        hasBlocking && 'bg-red-100 text-red-700 hover:bg-red-200',
        !hasBlocking && hasOpen && 'bg-blue-100 text-blue-700 hover:bg-blue-200',
        allResolved && 'bg-green-100 text-green-700 hover:bg-green-200',
      )}
    >
      <MessageSquare className="w-3 h-3" />
      {matching.length}
    </button>
  );
}
