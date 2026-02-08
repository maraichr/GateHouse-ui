import { Avatar } from '../display/Avatar';
import { EnumBadge } from '../display/EnumBadge';
import { StarRating } from '../display/StarRating';
import { CurrencyDisplay } from '../display/CurrencyDisplay';
import { Icon } from '../../utils/icons';
import { evaluateTemplate } from '../../utils/templateExpression';
import { DetailHeader as DetailHeaderConfig, Field, StateMachine } from '../../types';
import { usePermissions } from '../../auth/usePermissions';
import { TransitionActions } from './TransitionActions';
import { cn } from '../../utils/cn';

interface DetailHeaderProps {
  config?: DetailHeaderConfig;
  record?: Record<string, any>;
  fields?: Field[];
  state_machine?: StateMachine | null;
  api_resource?: string;
  header_style?: string;
}

export function DetailHeader({ config, record, fields, state_machine, api_resource, header_style: headerStyleProp }: DetailHeaderProps) {
  const { hasPermission } = usePermissions();

  if (!config || !record) return null;

  // Read header_style from prop or from CSS custom property set by themeToVars
  const header_style = headerStyleProp || (() => {
    const el = document.querySelector('[data-theme]');
    return el ? getComputedStyle(el).getPropertyValue('--header-style').trim() : 'flat';
  })();

  const ctx = { ...record, record, id: record?.id };
  const title = evaluateTemplate(config.title, ctx);
  const subtitle = config.subtitle ? evaluateTemplate(config.subtitle, ctx) : undefined;

  const statusField = fields?.find((f) => f.name === state_machine?.field);
  const statusValue = statusField ? record[statusField.name] : null;

  const headerClass = cn(
    'px-6 py-5',
    header_style === 'accent-bar' && 'header-accent-bar',
    header_style === 'gradient' && 'header-gradient',
  );

  return (
    <div
      className={headerClass}
      style={{
        backgroundColor: header_style === 'gradient' ? undefined : 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-start gap-4">
        {config.avatar && (
          <Avatar
            src={
              config.avatar.includes('{{')
                ? evaluateTemplate(config.avatar, ctx) || undefined
                : record?.[config.avatar] || undefined
            }
            name={title}
            size="lg"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>{title}</h1>
            {statusValue && statusField?.values && (
              <EnumBadge value={statusValue} values={statusField.values} />
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>
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
                  <div key={i} className="text-sm flex items-center gap-1">
                    {stat.icon && <Icon name={stat.icon} className="h-4 w-4" style={{ color: 'var(--color-text-faint)' }} />}
                    <span style={{ color: 'var(--color-text-muted)' }}>{stat.label}: </span>
                    {stat.display_as === 'star_rating' ? (
                      <StarRating value={Number(value)} />
                    ) : stat.format === 'currency' ? (
                      <CurrencyDisplay value={Number(value)} />
                    ) : (
                      <span className="font-medium" style={{ color: 'var(--color-text)' }}>{value ?? '—'}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {state_machine && api_resource && (
          <div className="flex-shrink-0">
            <TransitionActions
              stateMachine={state_machine}
              record={record}
              apiResource={api_resource}
            />
          </div>
        )}
      </div>
    </div>
  );
}
