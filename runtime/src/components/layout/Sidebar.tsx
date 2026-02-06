import { ReactNode } from 'react';
import { SidebarConfig, ThemeConfig } from '../../types';

interface SidebarProps {
  config?: SidebarConfig;
  children?: ReactNode;
  appName?: string;
  theme?: Partial<ThemeConfig>;
}

export function Sidebar({ children, appName, theme }: SidebarProps) {
  const logo = (theme as any)?.logo;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-gray-100">
        {logo ? (
          <img src={logo} alt={appName || 'Logo'} className="h-8 object-contain" />
        ) : (
          <h1 className="text-lg font-semibold text-gray-900 truncate">{appName || 'GateHouse'}</h1>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="space-y-0.5 px-2">
          {children}
        </div>
      </nav>
    </div>
  );
}
