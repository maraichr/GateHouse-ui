interface DateDisplayProps {
  value: string | null;
  format?: string;
}

export function DateDisplay({ value, format }: DateDisplayProps) {
  if (!value) return <span className="text-gray-400">—</span>;

  const date = new Date(value);
  if (isNaN(date.getTime())) return <span className="text-gray-400">Invalid date</span>;

  if (format === 'relative') {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return <span className="text-gray-900">Today</span>;
    if (diffDays === 1) return <span className="text-gray-900">Yesterday</span>;
    if (diffDays < 7) return <span className="text-gray-900">{diffDays} days ago</span>;
    if (diffDays < 30) return <span className="text-gray-900">{Math.floor(diffDays / 7)} weeks ago</span>;
  }

  const formatted = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return <span className="text-gray-900">{formatted}</span>;
}
