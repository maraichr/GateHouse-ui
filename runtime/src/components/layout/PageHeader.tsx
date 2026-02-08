import { ReactNode } from 'react';
import { Icon } from '../../utils/icons';

interface PageHeaderProps {
  title: string;
  icon?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, icon, actions, children }: PageHeaderProps) {
  return (
    <div className="border-b px-6 py-4" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && <Icon name={icon} className="h-6 w-6" style={{ color: 'var(--color-text-faint)' }} />}
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
