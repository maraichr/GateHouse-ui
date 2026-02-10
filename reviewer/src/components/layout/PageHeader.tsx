import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-zinc-100">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-surface-500 dark:text-zinc-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
