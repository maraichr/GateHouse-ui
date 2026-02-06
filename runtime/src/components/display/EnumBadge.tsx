import { EnumValue } from '../../types';
import { Icon } from '../../utils/icons';
import { cn } from '../../utils/cn';

interface EnumBadgeProps {
  value: string;
  values?: EnumValue[];
}

const colorMap: Record<string, string> = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-gray-100 text-gray-800',
  primary: 'bg-blue-100 text-blue-800',
};

export function EnumBadge({ value, values }: EnumBadgeProps) {
  const enumDef = values?.find((v) => v.value === value);
  const label = enumDef?.label || value;
  const color = enumDef?.color || 'neutral';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        colorMap[color] || colorMap.neutral
      )}
    >
      {enumDef?.icon && <Icon name={enumDef.icon} className="h-3 w-3" />}
      {label}
    </span>
  );
}
