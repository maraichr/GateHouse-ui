import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

type CardVariant = 'default' | 'elevated' | 'glass';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hover?: boolean;
  accent?: 'brand' | 'success' | 'warning' | 'danger' | 'info' | false;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const variantMap: Record<CardVariant, string> = {
  default: 'surface-card',
  elevated: 'bg-white border border-surface-200 rounded-xl shadow-elevation-md dark:bg-zinc-900 dark:border-zinc-800',
  glass: 'bg-white/60 backdrop-blur-lg border border-surface-200/60 rounded-xl dark:bg-zinc-900/60 dark:border-zinc-800/60',
};

const accentMap: Record<string, string> = {
  brand: 'border-t-2 border-t-brand-500',
  success: 'border-t-2 border-t-success-500',
  warning: 'border-t-2 border-t-warning-500',
  danger: 'border-t-2 border-t-danger-500',
  info: 'border-t-2 border-t-info-500',
};

const paddingMap: Record<string, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({
  variant = 'default',
  hover = false,
  accent = false,
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        variantMap[variant],
        hover && 'surface-card-hover cursor-pointer',
        accent && accentMap[accent],
        paddingMap[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
