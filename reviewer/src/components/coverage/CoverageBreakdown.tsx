import { CoverageBar } from './CoverageBar';
import type { CoverageSummary } from '../../types';

interface CoverageBreakdownProps {
  summary: CoverageSummary;
}

const categories = [
  { key: 'field_score', label: 'Fields', weight: '30%' },
  { key: 'state_machine_score', label: 'State Machines', weight: '20%' },
  { key: 'view_score', label: 'Views', weight: '25%' },
  { key: 'permission_score', label: 'Permissions', weight: '15%' },
  { key: 'navigation_score', label: 'Navigation', weight: '10%' },
] as const;

export function CoverageBreakdown({ summary }: CoverageBreakdownProps) {
  return (
    <div className="space-y-3">
      {categories.map(({ key, label, weight }) => (
        <div key={key}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-surface-700 dark:text-zinc-300 font-medium">{label}</span>
            <span className="text-surface-400 dark:text-zinc-500 text-xs">{weight} weight</span>
          </div>
          <CoverageBar value={summary[key]} size="sm" />
        </div>
      ))}
    </div>
  );
}
