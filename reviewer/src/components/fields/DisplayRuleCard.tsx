import type { DisplayRule } from '../../types';
import { InlineCode } from '../utility/InlineCode';

interface DisplayRuleCardProps {
  rule: DisplayRule;
}

export function DisplayRuleCard({ rule }: DisplayRuleCardProps) {
  return (
    <div className="flex items-center gap-3 p-2 bg-white rounded border border-gray-200 text-xs">
      <div className="text-gray-500">
        When <InlineCode>{rule.condition}</InlineCode>
      </div>
      <div className="text-gray-400">→</div>
      <div className="text-gray-700 font-medium">{rule.style}</div>
      {rule.tooltip && <div className="text-gray-400 italic">{rule.tooltip}</div>}
    </div>
  );
}
