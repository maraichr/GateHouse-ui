import { useState, ReactNode } from 'react';
import { SidebarConfig } from '../../types';
import { cn } from '../../utils/cn';

interface AppShellProps {
  sidebar?: ReactNode;
  children?: ReactNode;
  app_name?: string;
  shell?: { sidebar?: SidebarConfig };
}

export function AppShell({ sidebar, children, shell }: AppShellProps) {
  const sidebarConfig = shell?.sidebar;
  const [collapsed, setCollapsed] = useState(sidebarConfig?.default_collapsed ?? false);

  const sidebarWidth = collapsed
    ? (sidebarConfig?.collapsed_width ?? 64)
    : (sidebarConfig?.width ?? 260);

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebar && (
        <aside
          className={cn(
            'flex flex-col bg-white border-r border-gray-200 transition-all duration-200',
          )}
          style={{ width: sidebarWidth, minWidth: sidebarWidth }}
        >
          {sidebar}
          {sidebarConfig?.collapsible && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 mx-2 mb-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded text-sm"
            >
              {collapsed ? '→' : '←'}
            </button>
          )}
        </aside>
      )}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
