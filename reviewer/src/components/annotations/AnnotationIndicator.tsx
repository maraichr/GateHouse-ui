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
        hasBlocking && 'bg-danger-100 dark:bg-danger-900/40 text-danger-700 dark:text-danger-300 hover:bg-danger-200 dark:hover:bg-danger-900/60',
        !hasBlocking && hasOpen && 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 hover:bg-brand-200 dark:hover:bg-brand-900/60',
        allResolved && 'bg-success-100 dark:bg-success-900/40 text-success-700 dark:text-success-300 hover:bg-success-200 dark:hover:bg-success-900/60',
      )}
    >
      <MessageSquare className="w-3 h-3" />
      {matching.length}
    </button>
  );
}
