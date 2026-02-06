import { Field } from '../../types';
import { StringDisplay } from '../display/StringDisplay';
import { EnumBadge } from '../display/EnumBadge';
import { DateDisplay } from '../display/DateDisplay';
import { CurrencyDisplay } from '../display/CurrencyDisplay';
import { StarRating } from '../display/StarRating';
import { evaluateDisplayRules, styleForRule } from '../../utils/displayRuleEvaluator';
import { sanitizeHtml } from '../../utils/sanitizeHtml';
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
  // Evaluate display rules for conditional styling
  const ruleResult = evaluateDisplayRules(field.display_rules, value);
  const ruleClass = ruleResult ? styleForRule(ruleResult.style) : '';

  const wrapWithRule = (el: React.ReactElement) => {
    if (!ruleResult) return el;
    return (
      <span className={ruleClass} title={ruleResult.tooltip}>
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
  // Richtext fields: render sanitized HTML with prose styling
  if (field.type === 'richtext' && value) {
    return (
      <div
        className="prose prose-sm max-w-none text-gray-900"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(String(value)) }}
      />
    );
  }
  return wrapWithRule(<StringDisplay value={value} sensitive={field.sensitive} mask_pattern={field.mask_pattern} input_type={field.input_type} />);
}
