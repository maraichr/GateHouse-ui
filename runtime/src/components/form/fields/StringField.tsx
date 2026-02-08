import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Field } from '../../../types';

interface StringFieldProps {
  field: Field;
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function StringField({ field, register, errors }: StringFieldProps) {
  const error = errors[field.name];
  const errorId = `${field.name}-error`;
  const helpId = `${field.name}-help`;

  return (
    <div>
      <label htmlFor={field.name} className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary, #374151)' }}>
        {field.display_name || field.name}
        {field.required && <span style={{ color: 'var(--color-danger, #ef4444)' }} className="ml-0.5">*</span>}
      </label>
      <input
        id={field.name}
        type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
        {...register(field.name)}
        placeholder={field.placeholder}
        aria-required={field.required || undefined}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errorId : field.help_text ? helpId : undefined}
        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
        style={{ border: '1px solid var(--color-border, #d1d5db)' }}
      />
      {field.help_text && !error && (
        <p id={helpId} className="mt-1 text-xs" style={{ color: 'var(--color-text-muted, #6b7280)' }}>{field.help_text}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs" style={{ color: 'var(--color-danger, #dc2626)' }}>{error.message as string}</p>
      )}
    </div>
  );
}
