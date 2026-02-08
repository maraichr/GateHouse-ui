import { ThemeConfig } from '../types';

const RADIUS_MAP: Record<string, string> = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  full: '9999px',
};

// Spacing tokens by density
const SPACING: Record<string, Record<string, string>> = {
  compact: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px' },
  comfortable: { xs: '8px', sm: '12px', md: '16px', lg: '24px', xl: '32px' },
  spacious: { xs: '12px', sm: '16px', md: '24px', lg: '32px', xl: '48px' },
};

// Font-size tokens by scale
const FONT_SIZES: Record<string, Record<string, string>> = {
  sm: { xs: '11px', sm: '12px', base: '13px', lg: '15px', xl: '18px', '2xl': '20px' },
  md: { xs: '12px', sm: '13px', base: '14px', lg: '16px', xl: '20px', '2xl': '24px' },
  lg: { xs: '14px', sm: '15px', base: '16px', lg: '18px', xl: '24px', '2xl': '30px' },
};

// Motion tokens by mode
const MOTION: Record<string, Record<string, string>> = {
  full: { fast: '150ms', normal: '200ms', slow: '300ms' },
  reduced: { fast: '50ms', normal: '100ms', slow: '150ms' },
  none: { fast: '0ms', normal: '0ms', slow: '0ms' },
};

// Elevation presets
const ELEVATION: Record<string, Record<string, string>> = {
  none: { sm: 'none', md: 'none', lg: 'none', xl: 'none' },
  sm: {
    sm: '0 1px 2px rgba(0,0,0,0.04)',
    md: '0 2px 4px rgba(0,0,0,0.06)',
    lg: '0 4px 8px rgba(0,0,0,0.08)',
    xl: '0 8px 16px rgba(0,0,0,0.10)',
  },
  md: {
    sm: '0 1px 3px rgba(0,0,0,0.08)',
    md: '0 4px 8px rgba(0,0,0,0.10)',
    lg: '0 8px 16px rgba(0,0,0,0.12)',
    xl: '0 16px 32px rgba(0,0,0,0.14)',
  },
  lg: {
    sm: '0 2px 4px rgba(0,0,0,0.10)',
    md: '0 6px 12px rgba(0,0,0,0.14)',
    lg: '0 12px 24px rgba(0,0,0,0.16)',
    xl: '0 24px 48px rgba(0,0,0,0.18)',
  },
};

// Shade scale: mix percentages for generating 50-950 from a seed color (at 600)
// Lighter shades mix toward white, darker shades mix toward black
const SHADE_MIX: Record<number, { with: 'white' | 'black'; pct: number }> = {
  50:  { with: 'white', pct: 90 },
  100: { with: 'white', pct: 80 },
  200: { with: 'white', pct: 65 },
  300: { with: 'white', pct: 45 },
  400: { with: 'white', pct: 25 },
  500: { with: 'white', pct: 10 },
  600: { with: 'white', pct: 0 },  // seed color
  700: { with: 'black', pct: 15 },
  800: { with: 'black', pct: 30 },
  900: { with: 'black', pct: 45 },
  950: { with: 'black', pct: 60 },
};

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/** Generate CSS custom properties for a full shade scale using color-mix(in oklch) */
function generateShadeScale(seedHex: string, name: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const shade of SHADES) {
    const mix = SHADE_MIX[shade];
    if (mix.pct === 0) {
      vars[`--color-${name}-${shade}`] = seedHex;
    } else {
      vars[`--color-${name}-${shade}`] = `color-mix(in oklch, ${seedHex} ${100 - mix.pct}%, ${mix.with})`;
    }
  }
  return vars;
}

const SEMANTIC_PALETTES = ['primary', 'secondary', 'accent', 'danger', 'success', 'info', 'warning'] as const;

const NEUTRAL_SHADES_LIGHT: Record<number, string> = {
  50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db',
  400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151',
  800: '#1f2937', 900: '#111827', 950: '#030712',
};
const NEUTRAL_SHADES_DARK: Record<number, string> = {
  50: '#0f172a', 100: '#1e293b', 200: '#334155', 300: '#475569',
  400: '#64748b', 500: '#94a3b8', 600: '#cbd5e1', 700: '#e2e8f0',
  800: '#f1f5f9', 900: '#f8fafc', 950: '#ffffff',
};

export function themeToVars(theme?: Partial<ThemeConfig>): Record<string, string> {
  const t = theme || {};
  const dark = t.mode === 'dark';

  const density = t.density || 'comfortable';
  const fontScale = t.font_scale || 'md';
  const motionMode = t.motion_mode || 'full';
  const borderRadius = t.border_radius || 'md';
  const radiusBase = RADIUS_MAP[borderRadius] || '0.375rem';

  const spacing = SPACING[density] || SPACING.comfortable;
  const fonts = FONT_SIZES[fontScale] || FONT_SIZES.md;
  const motion = MOTION[motionMode] || MOTION.full;

  const elevation = ELEVATION[t.elevation || 'md'] || ELEVATION.md;
  const surfaceStyle = t.surface_style || 'bordered';

  // Seed colors for shade scales
  const seeds: Record<string, string> = {
    primary: t.primary_color || '#1E40AF',
    secondary: t.secondary_color || '#7C3AED',
    accent: t.accent_color || '#F59E0B',
    danger: t.danger_color || '#DC2626',
    success: t.success_color || '#16A34A',
    info: t.info_color || '#3B82F6',
    warning: t.warning_color || '#F59E0B',
  };

  // Generate shade scales for all semantic palettes
  let shadeVars: Record<string, string> = {};
  for (const name of SEMANTIC_PALETTES) {
    Object.assign(shadeVars, generateShadeScale(seeds[name], name));
  }

  // Neutral shades use explicit values (not color-mix) for precision
  const neutralShades = dark ? NEUTRAL_SHADES_DARK : NEUTRAL_SHADES_LIGHT;
  for (const shade of SHADES) {
    shadeVars[`--color-neutral-${shade}`] = neutralShades[shade];
  }

  return {
    // Base colors (keep for backward compat)
    '--color-primary': seeds.primary,
    '--color-secondary': seeds.secondary,
    '--color-accent': seeds.accent,
    '--color-danger': seeds.danger,
    '--color-success': seeds.success,
    '--color-info': seeds.info,
    '--color-warning': seeds.warning,

    // Full shade scales (~88 vars)
    ...shadeVars,

    // Radius
    '--radius': radiusBase,
    '--radius-sm': RADIUS_MAP[borderRadius === 'none' ? 'none' : 'sm'] || '0.25rem',
    '--radius-lg': borderRadius === 'full' ? '1rem' : borderRadius === 'none' ? '0' : (RADIUS_MAP['lg'] || '0.5rem'),

    // Spacing
    '--spacing-xs': spacing.xs,
    '--spacing-sm': spacing.sm,
    '--spacing-md': spacing.md,
    '--spacing-lg': spacing.lg,
    '--spacing-xl': spacing.xl,

    // Font sizes
    '--font-xs': fonts.xs,
    '--font-sm': fonts.sm,
    '--font-base': fonts.base,
    '--font-lg': fonts.lg,
    '--font-xl': fonts.xl,
    '--font-2xl': fonts['2xl'],

    // Motion
    '--motion-fast': motion.fast,
    '--motion-normal': motion.normal,
    '--motion-slow': motion.slow,

    // Elevation / shadows
    '--shadow-sm': elevation.sm,
    '--shadow-md': elevation.md,
    '--shadow-lg': elevation.lg,
    '--shadow-xl': elevation.xl,

    // Surface tokens
    '--card-shadow': surfaceStyle === 'raised' ? elevation.sm : 'none',
    '--card-border': surfaceStyle === 'bordered'
      ? `1px solid ${dark ? '#334155' : '#e5e7eb'}`
      : surfaceStyle === 'flat' ? 'none' : 'none',

    // Header style token (consumed by DetailHeader via data attribute)
    '--header-style': t.header_style || 'flat',

    // Focus ring
    '--focus-ring': '0 0 0 2px var(--color-bg), 0 0 0 4px color-mix(in srgb, var(--color-primary) 50%, transparent)',

    // Semantic surface/text/border tokens driven by mode
    '--color-bg': dark ? '#0f172a' : '#f9fafb',
    '--color-bg-alt': dark ? '#0b1120' : '#f3f4f6',
    '--color-surface': dark ? '#1e293b' : '#ffffff',
    '--color-surface-hover': dark ? '#334155' : '#f9fafb',
    '--color-text': dark ? '#f1f5f9' : '#111827',
    '--color-text-secondary': dark ? '#cbd5e1' : '#374151',
    '--color-text-muted': dark ? '#94a3b8' : '#6b7280',
    '--color-text-faint': dark ? '#64748b' : '#9ca3af',
    '--color-border': dark ? '#334155' : '#e5e7eb',
    '--color-border-light': dark ? '#1e293b' : '#f3f4f6',
  };
}

export function isDarkMode(theme?: Partial<ThemeConfig>): boolean {
  return theme?.mode === 'dark';
}

/** Generate a lighter tint of a hex color (for hover/active backgrounds) */
export function hexToTint(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
