import clsx from 'clsx';

interface ShowInMatrixProps {
  showIn: { list: boolean; detail: boolean; create: boolean; edit: boolean };
}

const columns = [
  { key: 'list', label: 'L' },
  { key: 'detail', label: 'D' },
  { key: 'create', label: 'C' },
  { key: 'edit', label: 'E' },
] as const;

export function ShowInMatrix({ showIn }: ShowInMatrixProps) {
  return (
    <div className="flex gap-0.5">
      {columns.map(({ key, label }) => (
        <span
          key={key}
          title={`${key}: ${showIn[key] ? 'yes' : 'no'}`}
          className={clsx(
            'w-5 h-5 flex items-center justify-center text-[10px] font-medium rounded',
            showIn[key]
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-400',
          )}
        >
          {label}
        </span>
      ))}
    </div>
  );
}
