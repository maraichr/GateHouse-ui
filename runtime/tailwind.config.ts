import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
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
