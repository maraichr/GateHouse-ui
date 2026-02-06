interface StringDisplayProps {
  value: any;
  sensitive?: boolean;
  mask_pattern?: string;
}

export function StringDisplay({ value, sensitive, mask_pattern }: StringDisplayProps) {
  if (value == null) return <span className="text-gray-400">—</span>;

  let display = String(value);
  if (sensitive && mask_pattern) {
    // Simple masking: show first 2 and last 4 chars
    if (display.length > 6) {
      display = display.slice(0, 3) + '***' + display.slice(-4);
    } else {
      display = '***';
    }
  }

  return <span className="text-gray-900">{display}</span>;
}
