import type { DisplayRule } from '../../types';
import { InlineCode } from '../utility/InlineCode';

interface DisplayRuleCardProps {
  rule: DisplayRule;
}

export function DisplayRuleCard({ rule }: DisplayRuleCardProps) {
  return (
    <div className="flex items-center gap-3 p-2 bg-white dark:bg-zinc-900 rounded border border-surface-200 dark:border-zinc-800 text-xs">
      <div className="text-surface-500 dark:text-zinc-400">
        When <InlineCode>{rule.condition}</InlineCode>
      </div>
      <div className="text-surface-400 dark:text-zinc-500">→</div>
      <div className="text-surface-700 dark:text-zinc-300 font-medium">{rule.style}</div>
      {rule.tooltip && <div className="text-surface-400 dark:text-zinc-500 italic">{rule.tooltip}</div>}
    </div>
  );
}
