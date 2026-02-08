import { Field } from '../../../types';
import { labelStyle, requiredMarkerStyle, inputStyle, helpStyle, errorStyle } from '../../../utils/formTokens';

interface AddressValue {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface AddressFieldProps {
  field: Field;
  value?: AddressValue;
  onChange: (value: AddressValue) => void;
  error?: string;
}

const inputClass = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent';
const inputInline = { ...inputStyle, '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties;

export function AddressField({ field, value = {}, onChange, error }: AddressFieldProps) {
  const components = field.components || {};
  const showStreet = components.street !== false;
  const showCity = components.city !== false;
  const showState = components.state !== false;
  const showZip = components.zip !== false;
  const showCountry = components.country !== false;

  const update = (part: string, val: string) => {
    onChange({ ...value, [part]: val });
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={labelStyle}>
        {field.display_name || field.name}
        {field.required && <span className="ml-0.5" style={requiredMarkerStyle}>*</span>}
      </label>
      <div className="space-y-2">
        {showStreet && (
          <input
            type="text"
            value={value.street || ''}
            onChange={(e) => update('street', e.target.value)}
            placeholder="Street address"
            className={inputClass}
            style={inputInline}
          />
        )}
        <div className="grid grid-cols-2 gap-2">
          {showCity && (
            <input
              type="text"
              value={value.city || ''}
              onChange={(e) => update('city', e.target.value)}
              placeholder="City"
              className={inputClass}
              style={inputInline}
            />
          )}
          {showState && (
            <input
              type="text"
              value={value.state || ''}
              onChange={(e) => update('state', e.target.value)}
              placeholder="State / Province"
              className={inputClass}
              style={inputInline}
            />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {showZip && (
            <input
              type="text"
              value={value.zip || ''}
              onChange={(e) => update('zip', e.target.value)}
              placeholder="ZIP / Postal code"
              className={inputClass}
              style={inputInline}
            />
          )}
          {showCountry && (
            <input
              type="text"
              value={value.country || ''}
              onChange={(e) => update('country', e.target.value)}
              placeholder="Country"
              className={inputClass}
              style={inputInline}
            />
          )}
        </div>
      </div>
      {field.help_text && !error && (
        <p className="mt-1 text-xs" style={helpStyle}>{field.help_text}</p>
      )}
      {error && <p className="mt-1 text-xs" style={errorStyle}>{error}</p>}
    </div>
  );
}
