interface CurrencyDisplayProps {
  value: number | null;
  currency?: string;
}

export function CurrencyDisplay({ value, currency = 'USD' }: CurrencyDisplayProps) {
  if (value == null) return <span className="text-gray-400">—</span>;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);

  return <span className="text-gray-900 font-mono">{formatted}</span>;
}
