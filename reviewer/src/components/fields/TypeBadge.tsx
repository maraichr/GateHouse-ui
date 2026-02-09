import clsx from 'clsx';

const typeColors: Record<string, string> = {
  string: 'bg-gray-100 text-gray-700',
  text: 'bg-gray-100 text-gray-700',
  integer: 'bg-blue-100 text-blue-700',
  decimal: 'bg-blue-100 text-blue-700',
  number: 'bg-blue-100 text-blue-700',
  currency: 'bg-emerald-100 text-emerald-700',
  boolean: 'bg-teal-100 text-teal-700',
  date: 'bg-sky-100 text-sky-700',
  datetime: 'bg-sky-100 text-sky-700',
  timestamp: 'bg-sky-100 text-sky-700',
  enum: 'bg-purple-100 text-purple-700',
  reference: 'bg-amber-100 text-amber-700',
  array: 'bg-orange-100 text-orange-700',
  address: 'bg-lime-100 text-lime-700',
  file: 'bg-pink-100 text-pink-700',
  image: 'bg-pink-100 text-pink-700',
  richtext: 'bg-indigo-100 text-indigo-700',
  email: 'bg-cyan-100 text-cyan-700',
  phone: 'bg-cyan-100 text-cyan-700',
  url: 'bg-cyan-100 text-cyan-700',
  json: 'bg-violet-100 text-violet-700',
  uuid: 'bg-gray-100 text-gray-600',
  inline_table: 'bg-orange-100 text-orange-700',
  percentage: 'bg-emerald-100 text-emerald-700',
  star_rating: 'bg-yellow-100 text-yellow-700',
};

interface TypeBadgeProps {
  type: string;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const color = typeColors[type] || 'bg-gray-100 text-gray-600';
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 text-xs font-mono rounded', color)}>
      {type}
    </span>
  );
}
