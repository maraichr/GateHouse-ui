import { Field } from '../../../types';

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

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.display_name || field.name}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="space-y-2">
        {showStreet && (
          <input
            type="text"
            value={value.street || ''}
            onChange={(e) => update('street', e.target.value)}
            placeholder="Street address"
            className={inputClass}
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
            />
          )}
          {showState && (
            <input
              type="text"
              value={value.state || ''}
              onChange={(e) => update('state', e.target.value)}
              placeholder="State / Province"
              className={inputClass}
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
            />
          )}
          {showCountry && (
            <input
              type="text"
              value={value.country || ''}
              onChange={(e) => update('country', e.target.value)}
              placeholder="Country"
              className={inputClass}
            />
          )}
        </div>
      </div>
      {field.help_text && !error && (
        <p className="mt-1 text-xs text-gray-500">{field.help_text}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
