import { Guard } from '../types';

export interface GuardResult {
  passed: boolean;
  message?: string;
}

/**
 * Evaluate a guard condition against a record.
 * Returns pass/fail and the guard's message for failed guards.
 */
export function evaluateGuardExpression(guard: Guard, record: Record<string, any>): GuardResult {
  if (guard.type === 'field_check' && guard.field_check) {
    // Simple field equality check: record[field] === expected
    if (guard.expected !== undefined) {
      const passed = record[guard.field_check] === guard.expected;
      return { passed, message: !passed ? guard.message : undefined };
    }

    // Expression-style: "insurance_expiry_date > today"
    const field = guard.field_check;
    const value = record[field];

    // If we just need the field to be truthy
    if (guard.expected === undefined && !guard.message) {
      return { passed: !!value };
    }

    return { passed: !!value, message: !value ? guard.message : undefined };
  }

  if (guard.type === 'role_check') {
    // Role checks are handled by the permission system, pass here
    return { passed: true };
  }

  // Unknown guard types pass by default
  return { passed: true };
}

/**
 * Evaluate all guards for a transition.
 * Returns overall pass/fail and the first failure message.
 */
export function evaluateGuards(guards: Guard[] | undefined, record: Record<string, any>): GuardResult {
  if (!guards?.length) return { passed: true };

  for (const guard of guards) {
    const result = evaluateGuardExpression(guard, record);
    if (!result.passed) {
      return { passed: false, message: result.message || 'Guard condition not met' };
    }
  }
  return { passed: true };
}
