import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Field } from '../../../types';
import { useEntityList } from '../../../data/useEntityList';
import { entityToResource } from '../../../utils/entityResource';

interface ReferenceFieldProps {
  field: Field;
  register: UseFormRegister<any>;
  errors: FieldErrors;
}

export function ReferenceField({ field, register, errors }: ReferenceFieldProps) {
  const error = errors[field.name];
  const errorId = `${field.name}-error`;
  const helpId = `${field.name}-help`;
  const apiResource = field.entity ? entityToResource(field.entity) : '';

  const { data, isLoading } = useEntityList({
    apiResource,
    pageSize: 100,
  });

  const records: any[] = data?.data ?? [];

  const getLabelValue = (record: any): string => {
    if (record.name) return record.name;
    if (record.company_name) return record.company_name;
    if (record.display_name) return record.display_name;
    if (record.title) return record.title;
    for (const val of Object.values(record)) {
      if (typeof val === 'string' && val.length > 0) return val;
    }
    return record.id ?? '—';
  };

  return (
    <div>
      <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
        {field.display_name || field.name}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        id={field.name}
        {...register(field.name)}
        aria-required={field.required || undefined}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errorId : field.help_text ? helpId : undefined}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isLoading}
      >
        <option value="">
          {isLoading ? 'Loading...' : `Select ${field.display_name || field.entity}...`}
        </option>
        {records.map((record) => (
          <option key={record.id} value={record.id}>
            {getLabelValue(record)}
          </option>
        ))}
      </select>
      {field.help_text && !error && (
        <p id={helpId} className="mt-1 text-xs text-gray-500">{field.help_text}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">{error.message as string}</p>
      )}
    </div>
  );
}
