import { useEffect, useState, type ReactNode } from 'react';
import clsx from 'clsx';

type TransitionVariant = 'fade-in' | 'slide-up' | 'slide-down' | 'scale-in';

interface TransitionProps {
  show: boolean;
  variant?: TransitionVariant;
  duration?: number;
  delay?: number;
  className?: string;
  children: ReactNode;
}

const variantClasses: Record<TransitionVariant, { enter: string; exit: string }> = {
  'fade-in': {
    enter: 'opacity-100',
    exit: 'opacity-0',
  },
  'slide-up': {
    enter: 'opacity-100 translate-y-0',
    exit: 'opacity-0 translate-y-2',
  },
  'slide-down': {
    enter: 'opacity-100 translate-y-0',
    exit: 'opacity-0 -translate-y-2',
  },
  'scale-in': {
    enter: 'opacity-100 scale-100',
    exit: 'opacity-0 scale-95',
  },
};

/**
 * CSS-only mount/unmount transition wrapper.
 * Respects `prefers-reduced-motion` via the global CSS rule.
 */
export function Transition({
  show,
  variant = 'fade-in',
  duration = 200,
  delay = 0,
  className,
  children,
}: TransitionProps) {
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setMounted(true);
      // Trigger enter after mount for CSS transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), duration + delay);
      return () => clearTimeout(timer);
    }
  }, [show, duration, delay]);

  if (!mounted) return null;

  const { enter, exit } = variantClasses[variant];

  return (
    <div
      className={clsx(
        'transition-all ease-out',
        visible ? enter : exit,
        className,
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: visible ? `${delay}ms` : '0ms',
      }}
    >
      {children}
    </div>
  );
}
