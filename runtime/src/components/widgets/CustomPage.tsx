import { ReactNode } from 'react';
import { PageHeader } from '../layout/PageHeader';

interface CustomPageProps {
  title?: string;
  icon?: string;
  description?: string;
  layout?: string;
  columns?: number;
  children?: ReactNode;
}

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4',
};

export function CustomPage({ title, icon, description, layout, columns, children }: CustomPageProps) {
  const isGrid = layout === 'grid' || (!layout && !columns);
  const colClass = columns
    ? GRID_COLS[columns] || 'md:grid-cols-2'
    : 'md:grid-cols-2';

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={title || 'Dashboard'} icon={icon} />
      {description && (
        <p className="px-6 text-sm text-gray-500">{description}</p>
      )}
      <div className="flex-1 p-6">
        <div className={`grid grid-cols-1 ${isGrid ? colClass : ''} gap-6`}>
          {children}
        </div>
      </div>
    </div>
  );
}
