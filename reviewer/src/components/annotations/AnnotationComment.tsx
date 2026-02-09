import { User } from 'lucide-react';
import type { Annotation } from '../../types';

interface AnnotationCommentProps {
  annotation: Annotation;
}

export function AnnotationComment({ annotation }: AnnotationCommentProps) {
  const timeAgo = formatRelativeTime(annotation.created_at);

  return (
    <div className="flex gap-2">
      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
        <User className="w-3 h-3 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-800">
            {annotation.author_name || 'Unknown'}
          </span>
          <span className="text-[10px] text-gray-400">{timeAgo}</span>
        </div>
        <p className="text-xs text-gray-600 mt-0.5 whitespace-pre-wrap">{annotation.body}</p>
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}
