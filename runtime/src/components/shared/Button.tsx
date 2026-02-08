import { forwardRef, type ReactNode, type ButtonHTMLAttributes, type CSSProperties } from 'react';
import { cn } from '../../utils/cn';
import { type SemanticColor, semanticSolidStyle, resolve } from '../../utils/semanticColor';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: 'filled' | 'outlined' | 'ghost' | 'soft';
  color?: SemanticColor;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  loading?: boolean;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'px-2.5 py-1 text-xs gap-1',
  md: 'px-4 py-2 text-sm gap-1.5',
  lg: 'px-5 py-2.5 text-base gap-2',
};

function variantStyle(variant: string, color: string): CSSProperties {
  const c = resolve(color);
  switch (variant) {
    case 'filled':
      return semanticSolidStyle(color);
    case 'outlined':
      return {
        backgroundColor: 'transparent',
        color: c,
        border: `1px solid ${c}`,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        color: c,
      };
    case 'soft':
      return {
        backgroundColor: `color-mix(in srgb, ${c} 12%, transparent)`,
        color: c,
      };
    default:
      return semanticSolidStyle(color);
  }
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'filled', color = 'primary', size = 'md', icon, loading, disabled, className, children, style, ...rest },
  ref
) {
  const isDisabled = disabled || loading;
  const computedStyle: CSSProperties = { ...variantStyle(variant, color), ...style };

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-medium interactive-hover',
        SIZE_CLASSES[size] || SIZE_CLASSES.md,
        isDisabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      style={{
        ...computedStyle,
        borderRadius: 'var(--radius)',
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = 'var(--focus-ring)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = '';
      }}
      {...rest}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
});
