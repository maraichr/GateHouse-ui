import { ThemeConfig } from '../types';

const RADIUS_MAP: Record<string, string> = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  full: '9999px',
};

export function themeToVars(theme?: Partial<ThemeConfig>): Record<string, string> {
  const t = theme || {};
  return {
    '--color-primary': t.primary_color || '#1E40AF',
    '--color-secondary': t.secondary_color || '#7C3AED',
    '--color-accent': t.accent_color || '#F59E0B',
    '--color-danger': t.danger_color || '#DC2626',
    '--color-success': t.success_color || '#16A34A',
    '--radius': RADIUS_MAP[t.border_radius || 'md'] || '0.375rem',
  };
}

/** Generate a lighter tint of a hex color (for hover/active backgrounds) */
export function hexToTint(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
