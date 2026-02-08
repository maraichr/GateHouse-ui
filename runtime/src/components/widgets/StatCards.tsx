import { Link } from 'react-router-dom';
import { Icon } from '../../utils/icons';
import { useWidgetData } from '../../data/useWidgetData';
import { cn } from '../../utils/cn';
import { StatCardsSkeleton } from '../shared/Skeleton';
import { semanticIconBgStyle, trendColor } from '../../utils/semanticColor';

interface StatCardValue {
  source?: string;
  field?: string;
}

interface StatCardConfig {
  title: string;
  value?: number | string | StatCardValue;
  icon?: string;
  color?: string;
  trend?: { direction: 'up' | 'down'; value: string };
  link?: string;
}

interface StatCardsProps {
  title?: string;
  layout?: string;
  cards?: StatCardConfig[];
  columns?: number;
  children?: any;
}

function resolveCardValue(val: StatCardConfig['value'], fetchedData: Record<string, any> | undefined): string | number {
  if (val == null) return '—';
  if (typeof val === 'string' || typeof val === 'number') return val;
  if (typeof val === 'object' && val.field && fetchedData) {
    return fetchedData[val.field] ?? '—';
  }
  return '—';
}

function getCardSource(cards?: StatCardConfig[]): string | undefined {
  if (!cards) return undefined;
  for (const card of cards) {
    if (typeof card.value === 'object' && card.value?.source) {
      return card.value.source;
    }
  }
  return undefined;
}

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
};

export function StatCards({ title, layout, cards, columns }: StatCardsProps) {
  const source = getCardSource(cards);
  const { data, isLoading } = useWidgetData(source);

  if (!cards?.length) return null;

  if (isLoading && source) {
    return (
      <div className="col-span-full">
        {title && <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>{title}</h3>}
        <StatCardsSkeleton count={cards.length} />
      </div>
    );
  }

  const cols = Math.min(columns || cards.length, 4);
  const gridClass = GRID_COLS[cols] || 'grid-cols-4';

  return (
    <div className="col-span-full">
      {title && (
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>{title}</h3>
      )}
      <div className={cn('grid gap-4', gridClass)}>
        {cards.map((card, i) => {
          const resolved = resolveCardValue(card.value, data);

          const content = (
            <div className="surface-card surface-card-lift p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-tight" style={{ color: 'var(--color-text-muted)' }}>{card.title}</p>
                  <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
                    {String(resolved)}
                  </p>
                  {card.trend && (
                    <p className="mt-1 text-xs font-medium" style={trendColor(card.trend.direction)}>
                      {card.trend.direction === 'up' ? '\u2191' : '\u2193'} {card.trend.value}
                    </p>
                  )}
                </div>
                {card.icon && (
                  <div className="p-2 rounded-lg" style={semanticIconBgStyle(card.color || 'primary')}>
                    <Icon name={card.icon} className="h-5 w-5" />
                  </div>
                )}
              </div>
            </div>
          );

          return card.link ? (
            <Link key={i} to={card.link} className="block">
              {content}
            </Link>
          ) : (
            <div key={i}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
