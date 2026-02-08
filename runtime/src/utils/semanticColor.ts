import type { CSSProperties } from 'react';

export type SemanticColor =
  | 'primary' | 'secondary' | 'accent'
  | 'success' | 'danger' | 'warning' | 'info' | 'neutral'
  | 'blue' | 'green' | 'red' | 'amber' | 'purple';

const COLOR_VAR: Record<string, string> = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
  success: 'var(--color-success)',
  danger: 'var(--color-danger)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)',
  neutral: 'var(--color-text-muted)',
  // aliases
  blue: 'var(--color-info)',
  green: 'var(--color-success)',
  red: 'var(--color-danger)',
  amber: 'var(--color-warning)',
  purple: 'var(--color-secondary)',
};

export function resolve(color: string): string {
  return COLOR_VAR[color] || COLOR_VAR.neutral;
}

/** Map semantic name → CSS custom property name (derived from COLOR_VAR) */
const SEMANTIC_CSS_VAR: Record<string, string> = Object.fromEntries(
  Object.entries(COLOR_VAR).map(([k, v]) => [k, v.replace(/^var\((.+)\)$/, '$1')])
);

/** Find the element that has theme CSS vars (the [data-theme] div from App.tsx) */
function getThemeElement(): Element {
  return document.querySelector('[data-theme]') || document.documentElement;
}

/** Resolve a semantic color name to its computed hex value from the theme.
 *  Falls back to raw value if not a known semantic name (allows raw hex). */
export function resolveSemanticHex(name: string): string {
  const cssVar = SEMANTIC_CSS_VAR[name.toLowerCase()];
  if (!cssVar) return name; // raw hex or unknown
  const computed = getComputedStyle(getThemeElement()).getPropertyValue(cssVar).trim();
  return computed || name;
}

const DEFAULT_CHART_PALETTE = ['primary', 'success', 'warning', 'danger', 'secondary', 'info'];

/** Get the chart palette as resolved hex colors. Uses chart_palette from theme if provided. */
export function getChartPalette(chartPalette?: string[]): string[] {
  const palette = chartPalette && chartPalette.length > 0 ? chartPalette : DEFAULT_CHART_PALETTE;
  return palette.map(resolveSemanticHex);
}

/** Badge / pill style: light tinted bg + dark text */
export function semanticBadgeStyle(color: string): CSSProperties {
  const c = resolve(color);
  return {
    backgroundColor: `color-mix(in srgb, ${c} 15%, transparent)`,
    color: `color-mix(in srgb, ${c} 80%, black)`,
  };
}

/** Icon container style: very light bg + color icon */
export function semanticIconBgStyle(color: string): CSSProperties {
  const c = resolve(color);
  return {
    backgroundColor: `color-mix(in srgb, ${c} 10%, transparent)`,
    color: c,
  };
}

/** Solid button / fill style: full color bg + white text */
export function semanticSolidStyle(color: string): CSSProperties {
  const c = resolve(color);
  return {
    backgroundColor: c,
    color: '#ffffff',
  };
}

/** Trend text color */
export function trendColor(direction: 'up' | 'down'): CSSProperties {
  return {
    color: direction === 'up' ? 'var(--color-success)' : 'var(--color-danger)',
  };
}
