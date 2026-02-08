import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarConfig, HeaderConfig } from '../../types';
import { cn } from '../../utils/cn';
import { Header } from './Header';
import { useIsMobile } from '../../hooks/useIsMobile';

interface AppShellProps {
  sidebar?: ReactNode;
  children?: ReactNode;
  app_name?: string;
  shell?: { sidebar?: SidebarConfig; header?: HeaderConfig };
  entities?: string[];
}

export function AppShell({ sidebar, children, shell, entities }: AppShellProps) {
  const sidebarConfig = shell?.sidebar;
  const headerConfig = shell?.header;
  const [collapsed, setCollapsed] = useState(sidebarConfig?.default_collapsed ?? false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  // Auto-close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleMenuClick = useCallback(() => {
    setMobileOpen(true);
  }, []);

  const sidebarWidth = collapsed
    ? (sidebarConfig?.collapsed_width ?? 64)
    : (sidebarConfig?.width ?? 260);

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--color-bg, #f9fafb)' }}>
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-sm focus:font-medium focus:shadow-lg focus:rounded-lg"
        style={{ color: 'var(--color-primary)' }}
      >
        Skip to main content
      </a>

      {sidebar && (
        <>
          {/* Desktop sidebar */}
          <aside
            className={cn(
              'hidden md:flex flex-col transition-all duration-token-normal',
            )}
            style={{ backgroundColor: 'var(--color-surface, #fff)', borderRight: '1px solid var(--color-border, #e5e7eb)', width: sidebarWidth, minWidth: sidebarWidth }}
          >
            <nav aria-label="Main navigation" className="flex flex-col flex-1 min-h-0">
              {sidebar}
            </nav>
            {sidebarConfig?.collapsible && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="p-2 mx-2 mb-2 rounded text-sm hover:opacity-80"
                style={{ color: 'var(--color-text-faint, #9ca3af)' }}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? '→' : '←'}
              </button>
            )}
          </aside>

          {/* Mobile drawer overlay */}
          {isMobile && mobileOpen && (
            <div
              className="fixed inset-0 z-40"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
              onClick={() => setMobileOpen(false)}
              onKeyDown={(e) => { if (e.key === 'Escape') setMobileOpen(false); }}
              role="presentation"
            />
          )}

          {/* Mobile drawer */}
          <aside
            className={cn(
              'fixed inset-y-0 left-0 z-50 flex flex-col w-72 transform transition-transform duration-token-normal md:hidden',
              isMobile && mobileOpen ? 'translate-x-0' : '-translate-x-full',
            )}
            style={{ backgroundColor: 'var(--color-surface, #fff)', borderRight: '1px solid var(--color-border, #e5e7eb)' }}
            aria-label="Main navigation"
          >
            <div className="flex items-center justify-between px-4 h-12 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border, #e5e7eb)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary, #374151)' }}>Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded hover:opacity-80"
                style={{ color: 'var(--color-text-faint, #9ca3af)' }}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto">
              {sidebar}
            </nav>
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          config={headerConfig}
          entities={entities}
          onMenuClick={isMobile ? handleMenuClick : undefined}
        />
        <main id="main-content" tabIndex={-1} className="flex-1 overflow-auto outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
