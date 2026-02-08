import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

// Generate shade scale object for a semantic palette
function shadeScale(name: string) {
  const scale: Record<string | number, string> = { DEFAULT: `var(--color-${name})` };
  for (const s of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
    scale[s] = `var(--color-${name}-${s})`;
  }
  return scale;
}

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: shadeScale('primary'),
        secondary: shadeScale('secondary'),
        accent: shadeScale('accent'),
        danger: shadeScale('danger'),
        success: shadeScale('success'),
        info: shadeScale('info'),
        warning: shadeScale('warning'),
        neutral: shadeScale('neutral'),
        // Surface/text utility colors
        surface: {
          DEFAULT: 'var(--color-surface)',
          hover: 'var(--color-surface-hover)',
        },
        bg: {
          DEFAULT: 'var(--color-bg)',
          alt: 'var(--color-bg-alt)',
        },
        txt: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          faint: 'var(--color-text-faint)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border-light)',
        },
      },
      spacing: {
        'token-xs': 'var(--spacing-xs, 8px)',
        'token-sm': 'var(--spacing-sm, 12px)',
        'token-md': 'var(--spacing-md, 16px)',
        'token-lg': 'var(--spacing-lg, 24px)',
        'token-xl': 'var(--spacing-xl, 32px)',
      },
      fontSize: {
        'token-xs': 'var(--font-xs, 12px)',
        'token-sm': 'var(--font-sm, 13px)',
        'token-base': 'var(--font-base, 14px)',
        'token-lg': 'var(--font-lg, 16px)',
        'token-xl': 'var(--font-xl, 20px)',
        'token-2xl': 'var(--font-2xl, 24px)',
      },
      borderRadius: {
        'token': 'var(--radius, 0.375rem)',
        'token-sm': 'var(--radius-sm, 0.25rem)',
        'token-lg': 'var(--radius-lg, 0.5rem)',
      },
      transitionDuration: {
        'token-fast': 'var(--motion-fast, 150ms)',
        'token-normal': 'var(--motion-normal, 200ms)',
        'token-slow': 'var(--motion-slow, 300ms)',
      },
      boxShadow: {
        'token-sm': 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08))',
        'token-md': 'var(--shadow-md, 0 4px 8px rgba(0,0,0,0.10))',
        'token-lg': 'var(--shadow-lg, 0 8px 16px rgba(0,0,0,0.12))',
        'token-xl': 'var(--shadow-xl, 0 16px 32px rgba(0,0,0,0.14))',
        'focus-ring': 'var(--focus-ring)',
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
        fadeIn: 'fadeIn var(--motion-normal, 200ms) ease-out',
        slideUp: 'slideUp var(--motion-normal, 200ms) ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [typography],
} satisfies Config;
