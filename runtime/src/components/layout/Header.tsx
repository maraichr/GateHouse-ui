import { Menu } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { ExampleSwitcher } from './ExampleSwitcher';
import { GlobalSearch } from './GlobalSearch';
import { NotificationBell } from './NotificationBell';
import { RoleSwitcher } from './RoleSwitcher';
import { HeaderConfig } from '../../types';

interface HeaderProps {
  config?: HeaderConfig;
  entities?: string[];
  onMenuClick?: () => void;
}

export function Header({ config, entities, onMenuClick }: HeaderProps) {
  const showBreadcrumbs = config?.show_breadcrumbs !== false;
  const showSearch = config?.show_search !== false;
  const showNotifications = config?.show_notifications !== false;

  return (
    <header role="banner" className="h-12 flex items-center justify-between px-4 flex-shrink-0" style={{ backgroundColor: 'var(--color-surface, #fff)', borderBottom: '1px solid var(--color-border, #e5e7eb)' }}>
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-1.5 rounded-lg md:hidden hover:opacity-80"
            style={{ color: 'var(--color-text-muted, #6b7280)' }}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        {showBreadcrumbs && <Breadcrumbs />}
      </div>
      <div className="flex items-center gap-2">
        <ExampleSwitcher />
        {showSearch && <GlobalSearch entities={entities} />}
        {showNotifications && <NotificationBell />}
        <RoleSwitcher />
      </div>
    </header>
  );
}
