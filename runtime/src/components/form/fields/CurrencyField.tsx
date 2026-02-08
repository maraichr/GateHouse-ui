import { useState, useEffect } from 'react';
import { Field } from '../../../types';

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
      <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
        {field.display_name || field.name}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden="true">
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
          className="w-full pl-8 pr-12 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" aria-hidden="true">
          {currency}
        </span>
      </div>
      {field.help_text && !error && (
        <p id={helpId} className="mt-1 text-xs text-gray-500">{field.help_text}</p>
      )}
      {error && <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
