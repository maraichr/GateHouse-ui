import { useState, ReactNode } from 'react';
import { Icon } from '../../utils/icons';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

interface NavGroupProps {
  label?: string;
  icon?: string;
  children?: ReactNode;
}

export function NavGroup({ label, icon, children }: NavGroupProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {icon && <Icon name={icon} className="h-5 w-5 flex-shrink-0" />}
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}
