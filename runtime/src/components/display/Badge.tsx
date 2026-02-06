import { cn } from '../../utils/cn';

interface BadgeProps {
  label: string;
  color?: string;
}

const colorMap: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-gray-100 text-gray-800',
};

export function Badge({ label, color = 'neutral' }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      colorMap[color] || colorMap.neutral
    )}>
      {label}
    </span>
  );
}
