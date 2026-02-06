import { Field } from '../../types';
import { StringDisplay } from '../display/StringDisplay';
import { EnumBadge } from '../display/EnumBadge';
import { DateDisplay } from '../display/DateDisplay';
import { CurrencyDisplay } from '../display/CurrencyDisplay';
import { StarRating } from '../display/StarRating';
import { cn } from '../../utils/cn';

interface SectionProps {
  title?: string;
  layout?: string;
  fields?: string[];
  allFields?: Field[];
  record?: Record<string, any>;
}

export function Section({ title, layout, fields: fieldNames, allFields, record }: SectionProps) {
  if (!fieldNames || !record) return null;

  const fieldMap = new Map(allFields?.map((f) => [f.name, f]) || []);

  return (
    <div className="mb-6">
      {title && (
        <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      )}
      <div className={cn(
        'grid gap-4',
        layout === 'two_column' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
      )}>
        {fieldNames.map((name) => {
          const field = fieldMap.get(name);
          if (!field || field.hidden) return null;
          const value = record[name];

          return (
            <div key={name}>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {field.display_name || name}
              </dt>
              <dd className="mt-1">
                <FieldDisplay field={field} value={value} />
              </dd>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FieldDisplay({ field, value }: { field: Field; value: any }) {
  if (field.type === 'enum') return <EnumBadge value={value} values={field.values} />;
  if (field.type === 'date' || field.type === 'datetime') return <DateDisplay value={value} format={field.format} />;
  if (field.type === 'currency') return <CurrencyDisplay value={value} currency={field.currency} />;
  if (field.display_as === 'star_rating') return <StarRating value={value} />;
  if (field.type === 'address' && typeof value === 'object' && value) {
    const parts = [value.street1, value.street2, value.city, value.state, value.zip].filter(Boolean);
    return <span className="text-gray-900">{parts.join(', ')}</span>;
  }
  return <StringDisplay value={value} sensitive={field.sensitive} mask_pattern={field.mask_pattern} />;
}
