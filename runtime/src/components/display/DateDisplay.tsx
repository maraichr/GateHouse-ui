interface DateDisplayProps {
  value: string | null;
  format?: string;
}

const faintStyle = { color: 'var(--color-text-faint)' };
const textStyle = { color: 'var(--color-text)' };

export function DateDisplay({ value, format }: DateDisplayProps) {
  if (!value) return <span style={faintStyle}>—</span>;

  const date = new Date(value);
  if (isNaN(date.getTime())) return <span style={faintStyle}>Invalid date</span>;

  if (format === 'relative') {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return <span style={textStyle}>Today</span>;
    if (diffDays === 1) return <span style={textStyle}>Yesterday</span>;
    if (diffDays < 7) return <span style={textStyle}>{diffDays} days ago</span>;
    if (diffDays < 30) return <span style={textStyle}>{Math.floor(diffDays / 7)} weeks ago</span>;
  }

  const formatted = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return <span style={textStyle}>{formatted}</span>;
}
