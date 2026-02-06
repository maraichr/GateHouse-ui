import { Breadcrumbs } from './Breadcrumbs';
import { GlobalSearch } from './GlobalSearch';
import { NotificationBell } from './NotificationBell';
import { HeaderConfig } from '../../types';

interface HeaderProps {
  config?: HeaderConfig;
  entities?: string[];
}

export function Header({ config, entities }: HeaderProps) {
  const showBreadcrumbs = config?.show_breadcrumbs !== false;
  const showSearch = config?.show_search !== false;
  const showNotifications = config?.show_notifications !== false;

  return (
    <header className="h-12 flex items-center justify-between px-4 bg-white border-b border-gray-200 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {showBreadcrumbs && <Breadcrumbs />}
      </div>
      <div className="flex items-center gap-2">
        {showSearch && <GlobalSearch entities={entities} />}
        {showNotifications && <NotificationBell />}
      </div>
    </header>
  );
}
