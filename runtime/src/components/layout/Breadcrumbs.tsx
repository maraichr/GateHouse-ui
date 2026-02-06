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
    // Use override if available, otherwise humanize the segment
    const label = overrides[seg] || seg
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const isLast = i === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav className="flex items-center gap-1 text-sm">
      <Link to="/" className="text-gray-400 hover:text-gray-600">
        <Home className="h-4 w-4" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.path} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-gray-300" />
          {crumb.isLast ? (
            <span className="text-gray-700 font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="text-gray-400 hover:text-gray-600">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
