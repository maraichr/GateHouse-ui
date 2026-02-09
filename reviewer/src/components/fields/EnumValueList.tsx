import type { EnumValue } from '../../types';

interface EnumValueListProps {
  values: EnumValue[];
}

export function EnumValueList({ values }: EnumValueListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <span
          key={v.value}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 border border-gray-200 text-xs"
        >
          {v.color && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: v.color }}
            />
          )}
          <span className="font-medium text-gray-700">{v.label}</span>
          <span className="text-gray-400 font-mono">{v.value}</span>
        </span>
      ))}
    </div>
  );
}
