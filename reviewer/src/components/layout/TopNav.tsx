import { Link, useLocation } from 'react-router';
import { FileText, LogOut, User } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { GlobalSearch } from '../search/GlobalSearch';

const navItems = [
  { label: 'Specs', path: '/' },
];

export function TopNav() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 font-semibold text-gray-900">
              <FileText className="w-5 h-5 text-reviewer-600" />
              <span>Spec Reviewer</span>
            </Link>
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'px-3 py-1.5 text-sm rounded-md transition-colors',
                    location.pathname === item.path
                      ? 'bg-reviewer-50 text-reviewer-700 font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <GlobalSearch />
            {user && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user.display_name}</span>
                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{user.role}</span>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="ml-1 p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
