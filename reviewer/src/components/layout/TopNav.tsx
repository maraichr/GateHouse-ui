import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { FileText, LogOut, Moon, Sun } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { GlobalSearch } from '../search/GlobalSearch';
import { useDarkMode } from '../../hooks/useDarkMode';

const navItems = [
  { label: 'Specs', path: '/' },
];

export function TopNav() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark, toggle } = useDarkMode();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={clsx(
        'sticky top-0 z-40 transition-all duration-200',
        scrolled
          ? 'glass shadow-elevation-sm'
          : 'bg-white/0 dark:bg-zinc-950/0 border-b border-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 font-semibold text-surface-900 dark:text-zinc-100 group">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-sm group-hover:shadow-glow-brand transition-shadow">
                <FileText className="w-3.5 h-3.5 text-white" />
              </div>
              <span>GateHouse <span className="text-brand-600 dark:text-brand-400">Studio</span></span>
            </Link>
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                    location.pathname === item.path
                      ? 'bg-brand-50 text-brand-700 font-medium dark:bg-brand-950 dark:text-brand-400'
                      : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <GlobalSearch />
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-surface-500 hover:text-surface-700 hover:bg-surface-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-semibold text-brand-700 dark:text-brand-300">
                  {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden sm:block">
                  <span className="text-sm font-medium text-surface-700 dark:text-zinc-300">{user.display_name}</span>
                  <span className="ml-1.5 text-xs bg-surface-100 dark:bg-zinc-800 text-surface-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-md">{user.role}</span>
                </div>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="ml-1 p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Bottom gradient accent */}
      <div
        className={clsx(
          'h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent transition-opacity duration-200',
          scrolled ? 'opacity-100' : 'opacity-0',
        )}
      />
    </header>
  );
}
