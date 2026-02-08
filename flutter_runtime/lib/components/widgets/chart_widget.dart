import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../models/component_tree.dart';
import '../../providers/widget_data_provider.dart';
import '../../providers/spec_provider.dart';
import '../../utils/design_tokens.dart';
import '../../utils/theme_colors.dart';

class ChartWidget extends ConsumerWidget {
  final ComponentNode node;
  const ChartWidget({super.key, required this.node});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final title = node.stringProp('title');
    final chartType = node.stringProp('chart_type') ?? 'bar';
    final source = node.stringProp('source');
    final dataMapping = node.mapProp('data_mapping');
    final height = (node.prop<num>('height') ?? 300).toDouble();

    // Get spec theme for color resolution
    final specAsync = ref.watch(specProvider);
    final specTheme = specAsync.whenOrNull(
      data: (tree) => tree.root.props?['theme'] as Map<String, dynamic>?,
    );

    if (source == null) return _emptyChart(context, title, height);

    final asyncData = ref.watch(widgetDataProvider(source));

    return asyncData.when(
      loading: () => _loadingChart(context, title, height),
      error: (_, __) => _errorChart(context, title, height),
      data: (fetchedData) {
        final chartData = _extractChartData(fetchedData);
        if (chartData.isEmpty) return _emptyChart(context, title, height);

        return _buildChartCard(
            context, title, chartType, chartData, dataMapping, height, specTheme);
      },
    );
  }

  List<Map<String, dynamic>> _extractChartData(Map<String, dynamic> raw) {
    final data = raw['data'];
    if (data is List) {
      return data
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    }
    return [];
  }

  Widget _buildChartCard(
    BuildContext context,
    String? title,
    String chartType,
    List<Map<String, dynamic>> data,
    Map<String, dynamic>? mapping,
    double height,
    Map<String, dynamic>? specTheme,
  ) {
    final xKey = mapping?['x'] as String? ??
        mapping?['label'] as String? ??
        'name';
    final yKey = mapping?['y'] as String? ??
        mapping?['value'] as String? ??
        'value';
    final colorMap = mapping?['color_map'] as Map?;
    final seriesKey = mapping?['series'] as String?;

    final palette = getChartPalette(specTheme);
    final isPie = chartType == 'pie' || chartType == 'donut';
    final hasSeries = seriesKey != null && !isPie;

    Widget chart;
    if (isPie) {
      chart = _buildPieChart(data, xKey, yKey, colorMap, chartType == 'donut', palette, specTheme);
    } else if (chartType == 'line') {
      chart = _buildLineChart(data, xKey, yKey, false, palette);
    } else if (chartType == 'area') {
      chart = _buildLineChart(data, xKey, yKey, true, palette);
    } else if (hasSeries) {
      chart = _buildSeriesBarChart(data, xKey, yKey, seriesKey, colorMap, palette, specTheme);
    } else {
      chart = _buildBarChart(data, xKey, yKey, colorMap, palette, specTheme);
    }

    final tokens = context.tokens;
    final borderColor = Theme.of(context).dividerColor;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(tokens.radiusMd),
        side: BorderSide(color: borderColor),
      ),
      child: Padding(
        padding: EdgeInsets.all(tokens.spaceMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (title != null)
              Padding(
                padding: EdgeInsets.only(bottom: tokens.spaceSm),
                child: Text(title,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600)),
              ),
            SizedBox(height: height, child: chart),
          ],
        ),
      ),
    );
  }

  /// Resolve a color from color_map (case-insensitive) or fall back to palette
  Color _resolveColor(String label, int index, Map? colorMap, List<Color> palette, Map<String, dynamic>? specTheme) {
    if (colorMap != null) {
      // Try exact match, then lowercase
      final semantic = (colorMap[label] ?? colorMap[label.toLowerCase()]) as String?;
      if (semantic != null) {
        return resolveChartColor(semantic, specTheme);
      }
    }
    return palette[index % palette.length];
  }

  Widget _buildPieChart(List<Map<String, dynamic>> data, String labelKey,
      String valueKey, Map? colorMap, bool isDonut, List<Color> palette, Map<String, dynamic>? specTheme) {
    final sections = data.asMap().entries.map((entry) {
      final i = entry.key;
      final item = entry.value;
      final label = item[labelKey]?.toString() ?? '';
      final value = (item[valueKey] as num?)?.toDouble() ?? 0;
      final color = _resolveColor(label, i, colorMap, palette, specTheme);

      return PieChartSectionData(
        value: value,
        title: label,
        color: color,
        radius: isDonut ? 40 : 60,
        titleStyle: const TextStyle(
            fontSize: 10, fontWeight: FontWeight.w500, color: Colors.white),
        titlePositionPercentageOffset: 0.6,
      );
    }).toList();

    return Row(
      children: [
        Expanded(
          flex: 3,
          child: PieChart(
            PieChartData(
              sections: sections,
              centerSpaceRadius: isDonut ? 50 : 0,
              sectionsSpace: 2,
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          flex: 2,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: data.asMap().entries.map((entry) {
              final i = entry.key;
              final item = entry.value;
              final label = item[labelKey]?.toString() ?? '';
              final value = item[valueKey]?.toString() ?? '';
              final color = _resolveColor(label, i, colorMap, palette, specTheme);
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: color,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text('$label ($value)',
                          style: const TextStyle(fontSize: 11),
                          overflow: TextOverflow.ellipsis),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildBarChart(List<Map<String, dynamic>> data, String xKey,
      String yKey, Map? colorMap, List<Color> palette, Map<String, dynamic>? specTheme) {
    final maxY = data.fold<double>(
        0, (m, item) => m > ((item[yKey] as num?)?.toDouble() ?? 0) ? m : (item[yKey] as num?)?.toDouble() ?? 0);

    return BarChart(
      BarChartData(
        maxY: maxY * 1.2,
        barGroups: data.asMap().entries.map((entry) {
          final i = entry.key;
          final item = entry.value;
          final label = item[xKey]?.toString() ?? '';
          final value = (item[yKey] as num?)?.toDouble() ?? 0;
          return BarChartGroupData(
            x: i,
            barRods: [
              BarChartRodData(
                toY: value,
                color: _resolveColor(label, i, colorMap, palette, specTheme),
                width: 20,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(4),
                  topRight: Radius.circular(4),
                ),
              ),
            ],
          );
        }).toList(),
        titlesData: _barTitlesData(data, xKey, maxY),
        gridData: _gridData(maxY),
        borderData: FlBorderData(show: false),
      ),
    );
  }

  /// Grouped bar chart for series data (e.g. leave types per month)
  Widget _buildSeriesBarChart(
    List<Map<String, dynamic>> data,
    String xKey,
    String yKey,
    String seriesKey,
    Map? colorMap,
    List<Color> palette,
    Map<String, dynamic>? specTheme,
  ) {
    // Pivot: group by xKey, then columns per series value
    final xValues = <String>[];
    final seriesNames = <String>{};
    final grouped = <String, Map<String, double>>{};

    for (final item in data) {
      final x = item[xKey]?.toString() ?? '';
      final s = item[seriesKey]?.toString() ?? '';
      final v = (item[yKey] as num?)?.toDouble() ?? 0;
      seriesNames.add(s);
      if (!grouped.containsKey(x)) {
        grouped[x] = {};
        xValues.add(x);
      }
      grouped[x]![s] = v;
    }

    final seriesList = seriesNames.toList();
    double maxY = 0;
    for (final row in grouped.values) {
      for (final v in row.values) {
        if (v > maxY) maxY = v;
      }
    }

    final barWidth = (20 / seriesList.length).clamp(6.0, 16.0);

    return BarChart(
      BarChartData(
        maxY: maxY * 1.2,
        barGroups: xValues.asMap().entries.map((entry) {
          final xi = entry.key;
          final x = entry.value;
          final row = grouped[x] ?? {};
          return BarChartGroupData(
            x: xi,
            barRods: seriesList.asMap().entries.map((se) {
              final si = se.key;
              final sName = se.value;
              final value = row[sName] ?? 0;
              Color color = palette[si % palette.length];
              if (colorMap != null) {
                final semantic = (colorMap[sName] ?? colorMap[sName.toLowerCase()]) as String?;
                if (semantic != null) {
                  color = resolveChartColor(semantic, specTheme);
                }
              }
              return BarChartRodData(
                toY: value,
                color: color,
                width: barWidth,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(3),
                  topRight: Radius.circular(3),
                ),
              );
            }).toList(),
          );
        }).toList(),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                final idx = value.toInt();
                if (idx < 0 || idx >= xValues.length) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(_truncateLabel(xValues[idx]), style: const TextStyle(fontSize: 10)),
                );
              },
              reservedSize: 28,
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 32,
              getTitlesWidget: (value, meta) => Text(value.toInt().toString(), style: const TextStyle(fontSize: 10)),
            ),
          ),
        ),
        gridData: _gridData(maxY),
        borderData: FlBorderData(show: false),
      ),
    );
  }

  Widget _buildLineChart(List<Map<String, dynamic>> data, String xKey,
      String yKey, bool isArea, List<Color> palette) {
    final spots = data.asMap().entries.map((entry) {
      final value = (entry.value[yKey] as num?)?.toDouble() ?? 0;
      return FlSpot(entry.key.toDouble(), value);
    }).toList();

    final maxY = spots.fold<double>(0, (m, s) => m > s.y ? m : s.y);
    final color = palette.isNotEmpty ? palette[0] : Colors.blue;

    return LineChart(
      LineChartData(
        maxY: maxY * 1.2,
        minY: 0,
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: color,
            barWidth: 2,
            dotData: const FlDotData(show: true),
            belowBarData: isArea
                ? BarAreaData(
                    show: true,
                    color: color.withAlpha(50),
                  )
                : BarAreaData(show: false),
          ),
        ],
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              getTitlesWidget: (value, meta) {
                final idx = value.toInt();
                if (idx < 0 || idx >= data.length) {
                  return const SizedBox.shrink();
                }
                return Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    _truncateLabel(data[idx][xKey]?.toString() ?? ''),
                    style: const TextStyle(fontSize: 10),
                  ),
                );
              },
              reservedSize: 28,
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 32,
              getTitlesWidget: (value, meta) => Text(
                value.toInt().toString(),
                style: const TextStyle(fontSize: 10),
              ),
            ),
          ),
        ),
        gridData: _gridData(maxY),
        borderData: FlBorderData(show: false),
      ),
    );
  }

  FlTitlesData _barTitlesData(List<Map<String, dynamic>> data, String xKey, double maxY) {
    return FlTitlesData(
      topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      bottomTitles: AxisTitles(
        sideTitles: SideTitles(
          showTitles: true,
          getTitlesWidget: (value, meta) {
            final idx = value.toInt();
            if (idx < 0 || idx >= data.length) return const SizedBox.shrink();
            return Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(_truncateLabel(data[idx][xKey]?.toString() ?? ''), style: const TextStyle(fontSize: 10)),
            );
          },
          reservedSize: 28,
        ),
      ),
      leftTitles: AxisTitles(
        sideTitles: SideTitles(
          showTitles: true,
          reservedSize: 32,
          getTitlesWidget: (value, meta) => Text(value.toInt().toString(), style: const TextStyle(fontSize: 10)),
        ),
      ),
    );
  }

  FlGridData _gridData(double maxY, {Color? gridColor, BuildContext? ctx}) {
    final lineColor = gridColor ?? (ctx != null ? Theme.of(ctx).colorScheme.outlineVariant : const Color(0xFFE5E7EB));
    return FlGridData(
      show: true,
      drawVerticalLine: false,
      horizontalInterval: maxY > 0 ? maxY / 4 : 1,
      getDrawingHorizontalLine: (value) => FlLine(
        color: lineColor,
        strokeWidth: 1,
      ),
    );
  }

  String _truncateLabel(String label) {
    return label.length > 8 ? '${label.substring(0, 7)}…' : label;
  }

  Widget _emptyChart(BuildContext context, String? title, double height) {
    final tokens = context.tokens;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(tokens.radiusMd),
        side: BorderSide(color: Theme.of(context).dividerColor),
      ),
      child: Padding(
        padding: EdgeInsets.all(tokens.spaceMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (title != null)
              Text(title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600)),
            SizedBox(
              height: height,
              child: Center(
                child: Text('No chart data available',
                    style:
                        TextStyle(fontSize: tokens.fontSm, color: Theme.of(context).colorScheme.outline)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _loadingChart(BuildContext context, String? title, double height) {
    final tokens = context.tokens;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(tokens.radiusMd),
        side: BorderSide(color: Theme.of(context).dividerColor),
      ),
      child: Padding(
        padding: EdgeInsets.all(tokens.spaceMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (title != null)
              Text(title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600)),
            SizedBox(
              height: height,
              child: const Center(
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _errorChart(BuildContext context, String? title, double height) {
    final tokens = context.tokens;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(tokens.radiusMd),
        side: BorderSide(color: Theme.of(context).colorScheme.error.withValues(alpha: 0.3)),
      ),
      child: Padding(
        padding: EdgeInsets.all(tokens.spaceMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (title != null)
              Text(title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600)),
            SizedBox(
              height: height,
              child: Center(
                child: Text('Failed to load chart',
                    style:
                        TextStyle(fontSize: tokens.fontSm, color: Theme.of(context).colorScheme.error)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
