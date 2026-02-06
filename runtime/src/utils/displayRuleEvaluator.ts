import { DisplayRule } from '../types';

export interface DisplayRuleResult {
  style: string;
  tooltip?: string;
  label?: string;
}

const STYLE_MAP: Record<string, string> = {
  danger: 'text-red-700 bg-red-50 px-2 py-0.5 rounded',
  warning: 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded',
  success: 'text-green-700 bg-green-50 px-2 py-0.5 rounded',
  info: 'text-blue-700 bg-blue-50 px-2 py-0.5 rounded',
  muted: 'text-gray-400',
};

export function styleForRule(style: string): string {
  return STYLE_MAP[style] || '';
}

/**
 * Evaluate display rules against a field value.
 * Returns the first matching rule or null.
 */
export function evaluateDisplayRules(
  rules: DisplayRule[] | undefined,
  value: any,
): DisplayRuleResult | null {
  if (!rules?.length) return null;

  for (const rule of rules) {
    if (matchesCondition(rule.condition, value)) {
      return {
        style: rule.style,
        tooltip: rule.tooltip,
        label: rule.label,
      };
    }
  }
  return null;
}

function matchesCondition(condition: string, value: any): boolean {
  // Patterns:
  //   "value < today + 30d"
  //   "value <= 0"
  //   "value == 'expired'"
  //   "value > 100"
  const match = condition.match(/^value\s*(==|!=|<=|>=|<|>)\s*(.+)$/);
  if (!match) return false;

  const operator = match[1];
  const rhs = match[2].trim();

  // Parse RHS
  const rhsVal = parseRhsValue(rhs);
  const lhsVal = coerceValue(value, rhsVal);

  return compare(lhsVal, operator, rhsVal);
}

function parseRhsValue(rhs: string): any {
  // String literal: 'expired' or "expired"
  const strMatch = rhs.match(/^['"](.+)['"]$/);
  if (strMatch) return strMatch[1];

  // Date expression: today, today + 30d, today - 7d
  const dateMatch = rhs.match(/^today(?:\s*([+-])\s*(\d+)d)?$/);
  if (dateMatch) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (dateMatch[1] && dateMatch[2]) {
      const days = parseInt(dateMatch[2], 10);
      const sign = dateMatch[1] === '+' ? 1 : -1;
      now.setDate(now.getDate() + sign * days);
    }
    return now;
  }

  // Number
  const num = Number(rhs);
  if (!isNaN(num)) return num;

  return rhs;
}

function coerceValue(value: any, target: any): any {
  if (target instanceof Date) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d;
  }
  if (typeof target === 'number') {
    const n = Number(value);
    return isNaN(n) ? value : n;
  }
  return value == null ? '' : String(value);
}

function compare(lhs: any, op: string, rhs: any): boolean {
  // Convert dates to timestamps for comparison
  const l = lhs instanceof Date ? lhs.getTime() : lhs;
  const r = rhs instanceof Date ? rhs.getTime() : rhs;

  switch (op) {
    case '==': return l === r;
    case '!=': return l !== r;
    case '<':  return l < r;
    case '<=': return l <= r;
    case '>':  return l > r;
    case '>=': return l >= r;
    default: return false;
  }
}
