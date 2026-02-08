import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useBreadcrumbs } from '../../context/BreadcrumbContext';

export function Breadcrumbs() {
  const location = useLocation();
  const { overrides } = useBreadcrumbs();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    const label = overrides[seg] || seg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const isLast = i === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link to="/" style={{ color: 'var(--color-text-faint)' }}>
        <Home className="h-4 w-4" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" style={{ color: 'var(--color-border)' }} />
          {crumb.isLast ? (
            <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>{crumb.label}</span>
          ) : (
            <Link to={crumb.path} style={{ color: 'var(--color-text-faint)' }}>
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
