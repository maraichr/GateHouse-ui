import { cn } from '../../utils/cn';
import { semanticBadgeStyle } from '../../utils/semanticColor';

interface BadgeProps {
  label: string;
  color?: string;
}

export function Badge({ label, color = 'neutral' }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium')}
      style={semanticBadgeStyle(color)}
    >
      {label}
    </span>
  );
}
