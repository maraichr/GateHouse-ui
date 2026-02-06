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
  children?: any;
}

const SEMANTIC_COLORS: Record<string, string> = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  neutral: '#6b7280',
};

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

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

  const colorMap = data_mapping?.color_map;

  const cellColors = useMemo(() => {
    if (!colorMap || !Array.isArray(chartData)) return undefined;
    const labelKey = data_mapping?.label || xKey;
    return chartData.map((item: any) => {
      const semantic = colorMap[item[labelKey]];
      return semantic ? (SEMANTIC_COLORS[semantic] || semantic) : DEFAULT_COLORS[0];
    });
  }, [chartData, colorMap, data_mapping, xKey]);

  if (!Array.isArray(chartData) || chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {title && <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>}
        <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
          No chart data available
        </div>
      </div>
    );
  }

  const isPie = chart_type === 'pie' || chart_type === 'donut';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {title && <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>}
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
                <Cell key={i} fill={cellColors?.[i] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        ) : chart_type === 'line' ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey={yKey} stroke={DEFAULT_COLORS[0]} strokeWidth={2} />
          </LineChart>
        ) : chart_type === 'area' ? (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey={yKey} stroke={DEFAULT_COLORS[0]} fill={DEFAULT_COLORS[0]} fillOpacity={0.2} />
          </AreaChart>
        ) : (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey={yKey} fill={DEFAULT_COLORS[0]} radius={[4, 4, 0, 0]}>
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
