import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({ title, message, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
        {icon || <Inbox className="w-8 h-8 text-surface-400 dark:text-zinc-500" />}
      </div>
      <h3 className="text-lg font-semibold text-surface-900 dark:text-zinc-100 mb-1">{title}</h3>
      {message && <p className="text-sm text-surface-500 dark:text-zinc-400 mb-4 max-w-sm">{message}</p>}
      {action}
    </div>
  );
}
