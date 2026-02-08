import { TransitionFormField } from '../../types';
import { labelStyle, requiredMarkerStyle, inputStyle } from '../../utils/formTokens';

interface TransitionFormProps {
  fields: TransitionFormField[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
}

const fieldStyle = { ...inputStyle, '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties;

export function TransitionForm({ fields, values, onChange }: TransitionFormProps) {
  if (!fields.length) return null;

  return (
    <div className="space-y-3 mb-4">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>
            {field.label}
            {field.required && <span className="ml-0.5" style={requiredMarkerStyle}>*</span>}
          </label>
          {field.type === 'enum' && field.values ? (
            <select
              value={values[field.name] || ''}
              onChange={(e) => onChange({ ...values, [field.name]: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
              style={fieldStyle}
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
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2"
              style={fieldStyle}
            />
          )}
        </div>
      ))}
    </div>
  );
}
