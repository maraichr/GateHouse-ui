import { Field } from '../../types';
import { StringDisplay } from '../display/StringDisplay';
import { EnumBadge } from '../display/EnumBadge';
import { DateDisplay } from '../display/DateDisplay';
import { CurrencyDisplay } from '../display/CurrencyDisplay';
import { StarRating } from '../display/StarRating';
import { evaluateDisplayRules, styleForRule } from '../../utils/displayRuleEvaluator';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
import { cn } from '../../utils/cn';
import { flattenFields, getByPath } from '../../utils/fieldPaths';

interface SectionProps {
  title?: string;
  layout?: string;
  fields?: string[];
  allFields?: Field[];
  record?: Record<string, any>;
}

export function Section({ title, layout, fields: fieldNames, allFields, record }: SectionProps) {
  if (!fieldNames || !record) return null;

  const flatFields = flattenFields(allFields || []);
  const fieldMap = new Map(flatFields.map((f) => [f.name, f]));

  return (
    <div className="mb-6">
      {title && (
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text, #111827)' }}>{title}</h3>
      )}
      <div className={cn(
        'grid gap-4',
        layout === 'two_column' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
      )}>
        {fieldNames.map((name) => {
          const field = fieldMap.get(name) || allFields?.find((f) => f.name === name);
          if (!field || field.hidden) return null;
          const value = getByPath(record, name);

          return (
            <div key={name}>
              <dt className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
                {field.display_name || name}
              </dt>
              <dd className="mt-1">
                <FieldDisplay field={field} value={value} record={record} />
              </dd>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FieldDisplay({ field, value, record }: { field: Field; value: any; record?: Record<string, any> }) {
  // Evaluate display rules for conditional styling
  const ruleResult = evaluateDisplayRules(field.display_rules, value);
  const ruleStyle = ruleResult ? styleForRule(ruleResult.style) : undefined;

  const wrapWithRule = (el: React.ReactElement) => {
    if (!ruleResult) return el;
    return (
      <span style={ruleStyle} title={ruleResult.tooltip}>
        {ruleResult.label || el}
      </span>
    );
  };

  if (field.type === 'enum') return wrapWithRule(<EnumBadge value={value} values={field.values} />);
  if (field.type === 'date' || field.type === 'datetime') return wrapWithRule(<DateDisplay value={value} format={field.format} />);
  if (field.type === 'currency') return wrapWithRule(<CurrencyDisplay value={value} currency={field.currency} />);
  if (field.display_as === 'star_rating') return <StarRating value={value} />;
  if (field.type === 'address' && typeof value === 'object' && value) {
    const parts = [value.street1, value.street2, value.city, value.state, value.zip].filter(Boolean);
    return <span className="text-gray-900">{parts.join(', ')}</span>;
  }
  if (field.type === 'object' && value && typeof value === 'object') {
    return <span className="text-gray-900">{Object.keys(value).length} properties</span>;
  }
  if (field.type === 'array' && Array.isArray(value)) {
    return <span className="text-gray-900">{value.length} items</span>;
  }
  if (value && typeof value === 'object') {
    return <span className="text-gray-900">{JSON.stringify(value)}</span>;
  }
  // Richtext fields: render sanitized HTML with prose styling
  if (field.type === 'richtext' && value) {
    return (
      <div
        className="prose prose-sm max-w-none text-gray-900"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(value)) }}
      />
    );
  }
  // Reference fields: show display name if available (e.g. customer_name for customer_id)
  if (field.type === 'reference' && record) {
    const baseName = field.name.replace(/_id$/, '');
    const displayValue = record[`${baseName}_name`] || record[baseName] || value;
    return wrapWithRule(<StringDisplay value={displayValue} />);
  }
  return wrapWithRule(<StringDisplay value={value} sensitive={field.sensitive} mask_pattern={field.mask_pattern} input_type={field.input_type} />);
}
