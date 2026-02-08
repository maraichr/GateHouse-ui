import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Field } from '../../../types';

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
      <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
        {field.display_name || field.name}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={field.name}
        type="date"
        {...register(field.name)}
        min={field.future_only ? today : undefined}
        aria-required={field.required || undefined}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errorId : field.help_text ? helpId : undefined}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {field.help_text && !error && (
        <p id={helpId} className="mt-1 text-xs text-gray-500">{field.help_text}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">{error.message as string}</p>
      )}
    </div>
  );
}
