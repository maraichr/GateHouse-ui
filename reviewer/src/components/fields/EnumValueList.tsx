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
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-50 dark:bg-zinc-800/50 border border-surface-200 dark:border-zinc-700 text-xs"
        >
          {v.color && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: v.color }}
            />
          )}
          <span className="font-medium text-surface-700 dark:text-zinc-300">{v.label}</span>
          <span className="text-surface-400 dark:text-zinc-500 font-mono">{v.value}</span>
        </span>
      ))}
    </div>
  );
}
