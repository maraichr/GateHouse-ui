import { useState, type ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 text-xs bg-surface-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg whitespace-nowrap z-50 shadow-elevation-sm animate-fade-in pointer-events-none">
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-surface-900 dark:border-t-zinc-100" />
        </span>
      )}
    </span>
  );
}
