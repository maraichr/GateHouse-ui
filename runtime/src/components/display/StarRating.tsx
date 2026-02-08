import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number | null;
  max?: number;
}

export function StarRating({ value, max = 5 }: StarRatingProps) {
  if (value == null) return <span style={{ color: 'var(--color-text-faint)' }}>—</span>;

  const stars = [];
  for (let i = 1; i <= max; i++) {
    const filled = i <= Math.round(value);
    stars.push(
      <Star
        key={i}
        className="h-4 w-4"
        style={filled
          ? { color: 'var(--color-warning)', fill: 'var(--color-warning)' }
          : { color: 'var(--color-border)' }
        }
      />
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {stars}
      <span className="ml-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>{value.toFixed(1)}</span>
    </div>
  );
}
