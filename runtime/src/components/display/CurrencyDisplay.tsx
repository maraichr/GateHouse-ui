interface CurrencyDisplayProps {
  value: number | null;
  currency?: string;
}

export function CurrencyDisplay({ value, currency = 'USD' }: CurrencyDisplayProps) {
  if (value == null) return <span style={{ color: 'var(--color-text-faint)' }}>—</span>;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);

  return <span className="font-mono" style={{ color: 'var(--color-text)' }}>{formatted}</span>;
}
