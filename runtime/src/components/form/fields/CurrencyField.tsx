import { useState, useEffect } from 'react';
import { Field } from '../../../types';
import { labelStyle, requiredMarkerStyle, inputStyle, mutedIconStyle, helpStyle, errorStyle } from '../../../utils/formTokens';

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
};

interface CurrencyFieldProps {
  field: Field;
  value?: number;
  onChange: (value: number | undefined) => void;
  error?: string;
}

export function CurrencyField({ field, value, onChange, error }: CurrencyFieldProps) {
  const currency = field.currency || 'USD';
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const [display, setDisplay] = useState(value != null ? String(value) : '');
  const errorId = `${field.name}-error`;
  const helpId = `${field.name}-help`;

  useEffect(() => {
    setDisplay(value != null ? String(value) : '');
  }, [value]);

  const handleChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, '');
    setDisplay(cleaned);
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      if (field.min != null && num < field.min) return;
      if (field.max != null && num > field.max) return;
      onChange(num);
    } else if (cleaned === '') {
      onChange(undefined);
    }
  };

  return (
    <div>
      <label htmlFor={field.name} className="block text-sm font-medium mb-1" style={labelStyle}>
        {field.display_name || field.name}
        {field.required && <span className="ml-0.5" style={requiredMarkerStyle}>*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={mutedIconStyle} aria-hidden="true">
          {symbol}
        </span>
        <input
          id={field.name}
          type="text"
          inputMode="decimal"
          value={display}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={field.placeholder || '0.00'}
          aria-required={field.required || undefined}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : field.help_text ? helpId : undefined}
          className="w-full pl-8 pr-12 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ ...inputStyle, '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={mutedIconStyle} aria-hidden="true">
          {currency}
        </span>
      </div>
      {field.help_text && !error && (
        <p id={helpId} className="mt-1 text-xs" style={helpStyle}>{field.help_text}</p>
      )}
      {error && <p id={errorId} role="alert" className="mt-1 text-xs" style={errorStyle}>{error}</p>}
    </div>
  );
}
