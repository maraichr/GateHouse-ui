interface StringDisplayProps {
  value: any;
  sensitive?: boolean;
  mask_pattern?: string;
  input_type?: string;
}

/**
 * Apply a mask pattern to a value.
 * '#' = show character, 'X' or '*' = mask character.
 * Characters in pattern that aren't #/X/* are literal separators.
 */
function applyMaskPattern(value: string, pattern: string): string {
  const digits = value.replace(/\D/g, '');
  let digitIdx = 0;
  let result = '';

  for (const ch of pattern) {
    if (digitIdx >= digits.length) break;
    if (ch === '#') {
      result += digits[digitIdx++];
    } else if (ch === 'X' || ch === '*') {
      result += '*';
      digitIdx++;
    } else {
      result += ch;
    }
  }
  return result;
}

function defaultMask(value: string): string {
  if (value.length > 6) {
    return value.slice(0, 3) + '***' + value.slice(-4);
  }
  return '***';
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return value;
}

export function StringDisplay({ value, sensitive, mask_pattern, input_type }: StringDisplayProps) {
  if (value == null) return <span style={{ color: 'var(--color-text-faint, #9ca3af)' }}>—</span>;

  let display = String(value);

  if (sensitive) {
    if (mask_pattern) {
      display = applyMaskPattern(display, mask_pattern);
    } else {
      display = defaultMask(display);
    }
  }

  // Phone formatting
  if (!sensitive && (input_type === 'tel' || /^\d{10,11}$/.test(display))) {
    display = formatPhone(display);
  }

  return <span style={{ color: 'var(--color-text, #111827)' }}>{display}</span>;
}
