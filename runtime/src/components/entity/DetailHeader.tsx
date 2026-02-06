import { Avatar } from '../display/Avatar';
import { EnumBadge } from '../display/EnumBadge';
import { StarRating } from '../display/StarRating';
import { CurrencyDisplay } from '../display/CurrencyDisplay';
import { evaluateTemplate } from '../../utils/templateExpression';
import { DetailHeader as DetailHeaderConfig, Field, StateMachine } from '../../types';
import { usePermissions } from '../../auth/usePermissions';

interface DetailHeaderProps {
  config?: DetailHeaderConfig;
  record?: Record<string, any>;
  fields?: Field[];
  state_machine?: StateMachine | null;
}

export function DetailHeader({ config, record, fields, state_machine }: DetailHeaderProps) {
  const { hasPermission } = usePermissions();

  if (!config || !record) return null;

  const ctx = { record, id: record?.id };
  const title = evaluateTemplate(config.title, ctx);
  const subtitle = config.subtitle ? evaluateTemplate(config.subtitle, ctx) : undefined;

  const statusField = fields?.find((f) => f.name === state_machine?.field);
  const statusValue = statusField ? record[statusField.name] : null;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-5">
      <div className="flex items-start gap-4">
        {config.avatar && (
          <Avatar
            src={evaluateTemplate(config.avatar, ctx) || undefined}
            name={title}
            size="lg"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
            {statusValue && statusField?.values && (
              <EnumBadge value={statusValue} values={statusField.values} />
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
          {config.stats && config.stats.length > 0 && (
            <div className="mt-3 flex gap-6">
              {config.stats.map((stat, i) => {
                if (stat.permissions && !hasPermission(stat.permissions)) return null;
                let value: any;
                if (typeof stat.value === 'string') {
                  value = evaluateTemplate(stat.value, ctx);
                }

                return (
                  <div key={i} className="text-sm">
                    <span className="text-gray-500">{stat.label}: </span>
                    {stat.display_as === 'star_rating' ? (
                      <StarRating value={Number(value)} />
                    ) : stat.format === 'currency' ? (
                      <CurrencyDisplay value={Number(value)} />
                    ) : (
                      <span className="font-medium text-gray-900">{value ?? '—'}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
