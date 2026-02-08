import { EnumValue } from '../../types';
import { Icon } from '../../utils/icons';
import { cn } from '../../utils/cn';
import { semanticBadgeStyle } from '../../utils/semanticColor';

interface EnumBadgeProps {
  value: string;
  values?: EnumValue[];
}

export function EnumBadge({ value, values }: EnumBadgeProps) {
  const enumDef = values?.find((v) => v.value === value);
  const label = enumDef?.label || value;
  const color = enumDef?.color || 'neutral';

  return (
    <span
      className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium')}
      style={semanticBadgeStyle(color)}
    >
      {enumDef?.icon && <Icon name={enumDef.icon} className="h-3 w-3" />}
      {label}
    </span>
  );
}
