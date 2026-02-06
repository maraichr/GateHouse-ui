import { ReactNode } from 'react';
import { SidebarConfig } from '../../types';

interface SidebarProps {
  config?: SidebarConfig;
  children?: ReactNode;
  appName?: string;
}

export function Sidebar({ children, appName }: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-gray-100">
        <h1 className="text-lg font-semibold text-gray-900 truncate">{appName || 'GateHouse'}</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="space-y-0.5 px-2">
          {children}
        </div>
      </nav>
    </div>
  );
}
