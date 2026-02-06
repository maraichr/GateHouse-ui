import { Link } from 'react-router-dom';
import { Icon } from '../../utils/icons';
import { useWidgetData } from '../../data/useWidgetData';
import { cn } from '../../utils/cn';

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

const COLOR_MAP: Record<string, string> = {
  primary: 'bg-blue-50 text-blue-600',
  blue: 'bg-blue-50 text-blue-600',
  info: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  success: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  warning: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  danger: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  indigo: 'bg-indigo-50 text-indigo-600',
};

function resolveCardValue(val: StatCardConfig['value'], fetchedData: Record<string, any> | undefined): string | number {
  if (val == null) return '—';
  if (typeof val === 'string' || typeof val === 'number') return val;
  // Object with source/field — need fetched data
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
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

export function StatCards({ title, layout, cards, columns }: StatCardsProps) {
  const source = getCardSource(cards);
  const { data } = useWidgetData(source);

  if (!cards?.length) return null;

  const cols = Math.min(columns || cards.length, 4);
  const gridClass = GRID_COLS[cols] || 'grid-cols-4';

  return (
    <div className="col-span-full">
      {title && (
        <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      )}
      <div className={cn('grid gap-4', gridClass)}>
        {cards.map((card, i) => {
          const resolved = resolveCardValue(card.value, data);
          const colorClass = card.color ? COLOR_MAP[card.color] || COLOR_MAP.primary : COLOR_MAP.primary;

          const content = (
            <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-500 truncate">{card.title}</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {String(resolved)}
                  </p>
                  {card.trend && (
                    <p className={cn(
                      'mt-1 text-xs font-medium',
                      card.trend.direction === 'up' ? 'text-green-600' : 'text-red-600',
                    )}>
                      {card.trend.direction === 'up' ? '\u2191' : '\u2193'} {card.trend.value}
                    </p>
                  )}
                </div>
                {card.icon && (
                  <div className={cn('p-2 rounded-lg', colorClass)}>
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
