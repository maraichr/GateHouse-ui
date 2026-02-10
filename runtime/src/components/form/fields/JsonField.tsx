import { useEffect, useState } from 'react';
import type { Field } from '../../../types';

interface JsonFieldProps {
  field: Field;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function JsonField({ field, value, onChange, error }: JsonFieldProps) {
  const [text, setText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (value == null || value === '') {
      setText(field.type === 'array' ? '[]' : '{}');
      return;
    }
    try {
      setText(JSON.stringify(value, null, 2));
    } catch {
      setText(String(value));
    }
  }, [value, field.type]);

  return (
    <div>
      <label htmlFor={field.name} className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary, #374151)' }}>
        {field.display_name || field.name}
        {field.required && <span style={{ color: 'var(--color-danger, #ef4444)' }} className="ml-0.5">*</span>}
      </label>
      <textarea
        id={field.name}
        value={text}
        rows={8}
        onChange={(e) => {
          const next = e.target.value;
          setText(next);
          if (!next.trim()) {
            setParseError(null);
            onChange(undefined);
            return;
          }
          try {
            const parsed = JSON.parse(next);
            setParseError(null);
            onChange(parsed);
          } catch {
            setParseError('Invalid JSON');
          }
        }}
        className="w-full px-3 py-2 rounded-lg text-sm font-mono focus:outline-none"
        style={{ border: '1px solid var(--color-border, #d1d5db)' }}
      />
      {parseError && <p className="mt-1 text-xs" style={{ color: 'var(--color-danger, #dc2626)' }}>{parseError}</p>}
      {!parseError && error && <p className="mt-1 text-xs" style={{ color: 'var(--color-danger, #dc2626)' }}>{error}</p>}
      {!parseError && !error && field.help_text && (
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted, #6b7280)' }}>{field.help_text}</p>
      )}
    </div>
  );
}
