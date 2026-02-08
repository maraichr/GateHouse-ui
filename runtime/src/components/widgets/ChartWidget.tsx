import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useWidgetData } from '../../data/useWidgetData';
import { resolveSemanticHex, getChartPalette } from '../../utils/semanticColor';

interface DataMapping {
  label?: string;
  value?: string;
  x?: string;
  y?: string;
  series?: string;
  color_map?: Record<string, string>;
}

interface ChartWidgetProps {
  title?: string;
  chart_type?: 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'stacked_bar';
  source?: string;
  data_mapping?: DataMapping;
  height?: number;
}

/** Case-insensitive lookup in color_map, then resolve semantic name → theme hex */
function resolveFromColorMap(label: string, colorMap: Record<string, string>): string | undefined {
  // Try exact match first, then lowercase
  const semantic = colorMap[label] ?? colorMap[label.toLowerCase()];
  if (!semantic) return undefined;
  return resolveSemanticHex(semantic);
}

/** Pivot series data: [{month:"Jan", type:"A", count:3}, ...] → [{month:"Jan", A:3, B:2}, ...] */
function pivotSeriesData(
  data: any[],
  xKey: string,
  yKey: string,
  seriesKey: string,
): { pivoted: any[]; seriesNames: string[] } {
  const groups = new Map<string, any>();
  const seriesSet = new Set<string>();

  for (const item of data) {
    const x = String(item[xKey] ?? '');
    const s = String(item[seriesKey] ?? '');
    const v = item[yKey] ?? 0;
    seriesSet.add(s);
    if (!groups.has(x)) groups.set(x, { [xKey]: x });
    groups.get(x)![s] = v;
  }

  return { pivoted: Array.from(groups.values()), seriesNames: Array.from(seriesSet) };
}

export function ChartWidget({
  title,
  chart_type = 'bar',
  source,
  data_mapping,
  height = 300,
}: ChartWidgetProps) {
  const { data: fetchedData } = useWidgetData(source);
  const chartData = fetchedData?.data || fetchedData || [];

  const xKey = data_mapping?.x || data_mapping?.label || 'name';
  const yKey = data_mapping?.y || data_mapping?.value || 'value';
  const seriesKey = data_mapping?.series;
  const colorMap = data_mapping?.color_map;

  // Theme-aware palette: reads from CSS vars so colors match the current theme
  const palette = useMemo(() => getChartPalette(), []);

  // Resolve per-cell colors for pie/donut and single-series bar charts
  const cellColors = useMemo(() => {
    if (!Array.isArray(chartData)) return undefined;
    const labelKey = data_mapping?.label || xKey;
    return chartData.map((item: any, i: number) => {
      if (colorMap) {
        const resolved = resolveFromColorMap(String(item[labelKey] ?? ''), colorMap);
        if (resolved) return resolved;
      }
      return palette[i % palette.length];
    });
  }, [chartData, colorMap, data_mapping, xKey, palette]);

  // Theme-aware text/grid colors
  const textColor = 'var(--color-text-muted)';
  const gridColor = 'var(--color-border-light)';

  if (!Array.isArray(chartData) || chartData.length === 0) {
    return (
      <div className="surface-card p-4">
        {title && <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>{title}</h3>}
        <div className="flex items-center justify-center text-sm" style={{ height, color: 'var(--color-text-faint)' }}>
          No chart data available
        </div>
      </div>
    );
  }

  const isPie = chart_type === 'pie' || chart_type === 'donut';
  const hasSeries = !!seriesKey && !isPie;

  return (
    <div className="surface-card p-4">
      {title && <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        {isPie ? (
          <PieChart>
            <Pie
              data={chartData}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              innerRadius={chart_type === 'donut' ? '60%' : 0}
              outerRadius="80%"
              label
            >
              {chartData.map((_: any, i: number) => (
                <Cell key={i} fill={cellColors?.[i] || palette[i % palette.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        ) : chart_type === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: textColor }} />
            <YAxis tick={{ fontSize: 12, fill: textColor }} />
            <Tooltip />
            <Line type="monotone" dataKey={yKey} stroke={palette[0]} strokeWidth={2} />
          </LineChart>
        ) : chart_type === 'area' ? (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: textColor }} />
            <YAxis tick={{ fontSize: 12, fill: textColor }} />
            <Tooltip />
            <Area type="monotone" dataKey={yKey} stroke={palette[0]} fill={palette[0]} fillOpacity={0.2} />
          </AreaChart>
        ) : hasSeries ? (
          <SeriesBarChart data={chartData} xKey={xKey} yKey={yKey} seriesKey={seriesKey!} colorMap={colorMap} palette={palette} gridColor={gridColor} textColor={textColor} />
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: textColor }} />
            <YAxis tick={{ fontSize: 12, fill: textColor }} />
            <Tooltip />
            <Bar dataKey={yKey} fill={palette[0]} radius={[4, 4, 0, 0]}>
              {cellColors && chartData.map((_: any, i: number) => (
                <Cell key={i} fill={cellColors[i]} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/** Grouped bar chart for series data (e.g. leave types per month) */
function SeriesBarChart({
  data, xKey, yKey, seriesKey, colorMap, palette, gridColor, textColor,
}: {
  data: any[];
  xKey: string;
  yKey: string;
  seriesKey: string;
  colorMap?: Record<string, string>;
  palette: string[];
  gridColor: string;
  textColor: string;
}) {
  const { pivoted, seriesNames } = useMemo(
    () => pivotSeriesData(data, xKey, yKey, seriesKey),
    [data, xKey, yKey, seriesKey],
  );

  return (
    <BarChart data={pivoted}>
      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
      <XAxis dataKey={xKey} tick={{ fontSize: 12, fill: textColor }} />
      <YAxis tick={{ fontSize: 12, fill: textColor }} />
      <Tooltip />
      <Legend />
      {seriesNames.map((name, i) => {
        let color = palette[i % palette.length];
        if (colorMap) {
          const resolved = resolveFromColorMap(name, colorMap);
          if (resolved) color = resolved;
        }
        return (
          <Bar key={name} dataKey={name} fill={color} radius={[4, 4, 0, 0]} />
        );
      })}
    </BarChart>
  );
}
