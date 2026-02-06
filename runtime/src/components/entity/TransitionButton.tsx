import { Icon } from '../../utils/icons';
import { cn } from '../../utils/cn';
import { Transition } from '../../types';

const COLOR_MAP: Record<string, { bg: string; hover: string } | null> = {
  success: { bg: 'bg-green-600', hover: 'hover:bg-green-700' },
  danger: { bg: 'bg-red-600', hover: 'hover:bg-red-700' },
  warning: { bg: 'bg-amber-500', hover: 'hover:bg-amber-600' },
  info: null, // uses theme primary
  primary: null, // uses theme primary
};

const DEFAULT_STYLE = { bg: 'bg-gray-600', hover: 'hover:bg-gray-700' };

interface TransitionButtonProps {
  transition: Transition;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}

export function TransitionButton({ transition, onClick, disabled, tooltip }: TransitionButtonProps) {
  const mapped = transition.color ? COLOR_MAP[transition.color] : undefined;
  const useTheme = mapped === null || mapped === undefined;
  const staticColor = mapped ? `${mapped.bg} ${mapped.hover} text-white` : (!transition.color ? `${DEFAULT_STYLE.bg} ${DEFAULT_STYLE.hover} text-white` : '');

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50',
        useTheme ? 'text-white' : staticColor,
      )}
      style={useTheme ? { backgroundColor: 'var(--color-primary)' } : undefined}
      onMouseEnter={(e) => { if (useTheme && !disabled) e.currentTarget.style.filter = 'brightness(0.9)'; }}
      onMouseLeave={(e) => { if (useTheme) e.currentTarget.style.filter = ''; }}
    >
      {transition.icon && <Icon name={transition.icon} className="h-4 w-4" />}
      {transition.label}
    </button>
  );
}
