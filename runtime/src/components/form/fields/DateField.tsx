import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Field } from '../../../types';
import { labelStyle, requiredMarkerStyle, inputStyle, helpStyle, errorStyle } from '../../../utils/formTokens';

interface DateFieldProps {
  field: Field;
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function DateField({ field, register, errors }: DateFieldProps) {
  const error = errors[field.name];
  const errorId = `${field.name}-error`;
  const helpId = `${field.name}-help`;
  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <label htmlFor={field.name} className="block text-sm font-medium mb-1" style={labelStyle}>
        {field.display_name || field.name}
        {field.required && <span className="ml-0.5" style={requiredMarkerStyle}>*</span>}
      </label>
      <input
        id={field.name}
        type="date"
        {...register(field.name)}
        min={field.future_only ? today : undefined}
        aria-required={field.required || undefined}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errorId : field.help_text ? helpId : undefined}
        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
        style={{ ...inputStyle, '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
      />
      {field.help_text && !error && (
        <p id={helpId} className="mt-1 text-xs" style={helpStyle}>{field.help_text}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs" style={errorStyle}>{error.message as string}</p>
      )}
    </div>
  );
}
