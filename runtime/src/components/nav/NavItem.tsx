import { NavLink } from 'react-router-dom';
import { Icon } from '../../utils/icons';
import { NavBadge } from '../../types';
import { useNavBadge } from '../../data/useNavBadge';
import { cn } from '../../utils/cn';

interface NavItemProps {
  id?: string;
  label?: string;
  icon?: string;
  path?: string;
  position?: string;
  badge?: NavBadge;
  api_resource?: string;
}

const badgeColorMap: Record<string, string> = {
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  success: 'bg-green-100 text-green-700',
  info: 'bg-blue-100 text-blue-700',
  primary: 'bg-blue-100 text-blue-700',
};

export function NavItem({ label, icon, path, badge, api_resource }: NavItemProps) {
  const { data: badgeCount } = useNavBadge(badge, api_resource);

  if (!path) return null;

  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
          !isActive && 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )
      }
      style={({ isActive }) =>
        isActive
          ? { backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }
          : undefined
      }
    >
      {icon && <Icon name={icon} className="h-5 w-5 flex-shrink-0" />}
      <span className="truncate">{label}</span>
      {badge && badgeCount != null && badgeCount > 0 && (
        <span
          className={cn(
            'ml-auto text-xs font-medium px-2 py-0.5 rounded-full',
            badgeColorMap[badge.color || 'info'] || badgeColorMap.info
          )}
        >
          {badgeCount}
        </span>
      )}
    </NavLink>
  );
}
