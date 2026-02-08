import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Field } from '../../../types';

interface EnumFieldProps {
  field: Field;
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function EnumField({ field, register, errors }: EnumFieldProps) {
  const error = errors[field.name];
  const errorId = `${field.name}-error`;
  const values = field.values || [];
  const useRadio = values.length <= 4;

  return (
    <div>
      <label htmlFor={useRadio ? undefined : field.name} className="block text-sm font-medium text-gray-700 mb-1">
        {field.display_name || field.name}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {useRadio ? (
        <div role="radiogroup" aria-label={field.display_name || field.name} className="space-y-2">
          {values.map((v) => (
            <label key={v.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                value={v.value}
                {...register(field.name)}
                aria-required={field.required || undefined}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span>{v.label}</span>
            </label>
          ))}
        </div>
      ) : (
        <select
          id={field.name}
          {...register(field.name)}
          aria-required={field.required || undefined}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : undefined}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select...</option>
          {values.map((v) => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">{error.message as string}</p>
      )}
    </div>
  );
}
