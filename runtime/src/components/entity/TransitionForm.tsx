import { TransitionFormField } from '../../types';

interface TransitionFormProps {
  fields: TransitionFormField[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
}

export function TransitionForm({ fields, values, onChange }: TransitionFormProps) {
  if (!fields.length) return null;

  return (
    <div className="space-y-3 mb-4">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {field.type === 'enum' && field.values ? (
            <select
              value={values[field.name] || ''}
              onChange={(e) => onChange({ ...values, [field.name]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select...</option>
              {field.values.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={values[field.name] || ''}
              onChange={(e) => onChange({ ...values, [field.name]: e.target.value })}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>
      ))}
    </div>
  );
}
