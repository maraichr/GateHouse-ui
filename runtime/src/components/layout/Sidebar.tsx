import { ReactNode } from 'react';
import { SidebarConfig, ThemeConfig } from '../../types';

interface SidebarProps {
  config?: SidebarConfig;
  children?: ReactNode;
  appName?: string;
  theme?: Partial<ThemeConfig>;
}

export function Sidebar({ children, appName, theme }: SidebarProps) {
  const rawLogo = (theme as any)?.logo;
  const isDark = theme?.mode === 'dark';

  // Resolve logo: can be a string or {light, dark} object
  let logoUrl: string | undefined;
  if (typeof rawLogo === 'string') {
    logoUrl = rawLogo;
  } else if (rawLogo && typeof rawLogo === 'object') {
    logoUrl = isDark ? (rawLogo.dark || rawLogo.light) : (rawLogo.light || rawLogo.dark);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5" style={{ borderBottom: '1px solid var(--color-border-light, #f3f4f6)' }}>
        {logoUrl ? (
          <img src={logoUrl} alt={appName || 'Logo'} className="h-8 object-contain" />
        ) : (
          <h1 className="text-lg font-semibold truncate" style={{ color: 'var(--color-text, #111827)' }}>{appName || 'GateHouse'}</h1>
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
