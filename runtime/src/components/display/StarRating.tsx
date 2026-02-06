import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number | null;
  max?: number;
}

export function StarRating({ value, max = 5 }: StarRatingProps) {
  if (value == null) return <span className="text-gray-400">—</span>;

  const stars = [];
  for (let i = 1; i <= max; i++) {
    const filled = i <= Math.round(value);
    stars.push(
      <Star
        key={i}
        className={`h-4 w-4 ${filled ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
      />
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {stars}
      <span className="ml-1 text-xs text-gray-500">{value.toFixed(1)}</span>
    </div>
  );
}
