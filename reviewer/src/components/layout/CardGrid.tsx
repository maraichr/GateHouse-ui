import clsx from 'clsx';

interface CardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

const colsMap = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export function CardGrid({ children, columns = 3 }: CardGridProps) {
  return <div className={clsx('grid gap-4', colsMap[columns])}>{children}</div>;
}
