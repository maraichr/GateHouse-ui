import clsx from 'clsx';

const typeColors: Record<string, string> = {
  string: 'bg-surface-100 dark:bg-zinc-800 text-surface-700 dark:text-zinc-300',
  text: 'bg-surface-100 dark:bg-zinc-800 text-surface-700 dark:text-zinc-300',
  integer: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  decimal: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  number: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  currency: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  boolean: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
  date: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
  datetime: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
  timestamp: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
  enum: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  reference: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  array: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  address: 'bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-300',
  file: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
  image: 'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
  richtext: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
  email: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
  phone: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
  url: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
  json: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  uuid: 'bg-surface-100 dark:bg-zinc-800 text-surface-600 dark:text-zinc-400',
  inline_table: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  percentage: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  star_rating: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
};

interface TypeBadgeProps {
  type: string;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const color = typeColors[type] || 'bg-surface-100 dark:bg-zinc-800 text-surface-600 dark:text-zinc-400';
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 text-xs font-mono rounded', color)}>
      {type}
    </span>
  );
}
