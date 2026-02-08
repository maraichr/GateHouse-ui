import 'dart:math' as math;
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

    final tokens = context.tokens;
    return Card(
      elevation: 0,
      clipBehavior: Clip.hardEdge,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(tokens.radiusLg),
        side: BorderSide(color: tokens.neutral[200]!),
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
                    style: TextStyle(
                      fontSize: tokens.fontSm,
                      fontWeight: FontWeight.w600,
                      color: tokens.neutral[900],
                    )),
              ),
            SizedBox(
              height: height,
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final chartWidth = constraints.maxWidth;
                  Widget chart;
                  if (isPie) {
                    chart = _buildPieChart(context, data, xKey, yKey, colorMap, chartType == 'donut', palette, specTheme, chartWidth);
                  } else if (chartType == 'line') {
                    chart = _buildLineChart(context, data, xKey, yKey, false, palette, chartWidth);
                  } else if (chartType == 'area') {
                    chart = _buildLineChart(context, data, xKey, yKey, true, palette, chartWidth);
                  } else if (hasSeries) {
                    chart = _buildSeriesBarChart(context, data, xKey, yKey, seriesKey, colorMap, palette, specTheme, chartWidth);
                  } else {
                    chart = _buildBarChart(context, data, xKey, yKey, colorMap, palette, specTheme, chartWidth);
                  }
                  return chart;
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Resolve a color from color_map (case-insensitive) or fall back to palette
  Color _resolveColor(String label, int index, Map? colorMap, List<Color> palette, Map<String, dynamic>? specTheme) {
    if (colorMap != null) {
      final semantic = (colorMap[label] ?? colorMap[label.toLowerCase()]) as String?;
      if (semantic != null) {
        return resolveChartColor(semantic, specTheme);
      }
    }
    return palette[index % palette.length];
  }

  // ---------- PIE / DONUT ----------

  Widget _buildPieChart(BuildContext context, List<Map<String, dynamic>> data, String labelKey,
      String valueKey, Map? colorMap, bool isDonut, List<Color> palette, Map<String, dynamic>? specTheme, double chartWidth) {
    final tokens = context.tokens;
    final total = data.fold<double>(0, (sum, item) => sum + ((item[valueKey] as num?)?.toDouble() ?? 0));

    final isNarrow = chartWidth < 360;
    final pieRadius = isNarrow ? (isDonut ? 30.0 : 45.0) : (isDonut ? 50.0 : 60.0);

    final sections = data.asMap().entries.map((entry) {
      final i = entry.key;
      final item = entry.value;
      final label = item[labelKey]?.toString() ?? '';
      final value = (item[valueKey] as num?)?.toDouble() ?? 0;
      final color = _resolveColor(label, i, colorMap, palette, specTheme);
      final pct = total > 0 ? (value / total * 100) : 0;

      return PieChartSectionData(
        value: value,
        title: pct >= 8 ? '${pct.round()}%' : '',
        color: color,
        radius: pieRadius,
        titleStyle: TextStyle(
            fontSize: tokens.fontXs, fontWeight: FontWeight.w600, color: Colors.white),
        titlePositionPercentageOffset: 0.55,
      );
    }).toList();
    final centerRadius = isDonut ? (isNarrow ? 35.0 : 50.0) : 0.0;

    final pieChart = PieChart(
      PieChartData(
        sections: sections,
        centerSpaceRadius: centerRadius,
        sectionsSpace: 2,
        pieTouchData: PieTouchData(enabled: true),
      ),
    );

    final legend = Wrap(
      spacing: tokens.spaceSm,
      runSpacing: tokens.spaceXs / 2,
      children: data.asMap().entries.map((entry) {
        final i = entry.key;
        final item = entry.value;
        final label = item[labelKey]?.toString() ?? '';
        final value = item[valueKey]?.toString() ?? '';
        final color = _resolveColor(label, i, colorMap, palette, specTheme);
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(tokens.radiusSm),
              ),
            ),
            SizedBox(width: tokens.spaceXs),
            Text(
              isNarrow ? label : '$label ($value)',
              style: TextStyle(fontSize: tokens.fontXs, color: tokens.neutral[700]),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        );
      }).toList(),
    );

    if (isNarrow) {
      return Column(
        children: [
          Expanded(child: pieChart),
          SizedBox(height: tokens.spaceXs),
          legend,
        ],
      );
    }

    return Row(
      children: [
        Expanded(flex: 3, child: pieChart),
        SizedBox(width: tokens.spaceMd),
        Expanded(
          flex: 2,
          child: SingleChildScrollView(
            child: legend,
          ),
        ),
      ],
    );
  }

  // ---------- BAR CHART ----------

  Widget _buildBarChart(BuildContext context, List<Map<String, dynamic>> data, String xKey,
      String yKey, Map? colorMap, List<Color> palette, Map<String, dynamic>? specTheme, double chartWidth) {
    final tokens = context.tokens;
    final maxY = data.fold<double>(
        0, (m, item) => math.max(m, (item[yKey] as num?)?.toDouble() ?? 0));
    final ceiledMaxY = maxY * 1.15;
    final yInterval = _niceInterval(ceiledMaxY);
    final adjustedMaxY = (ceiledMaxY / yInterval).ceil() * yInterval;
    final leftReserved = _leftAxisReservedSize(adjustedMaxY);
    final barWidth = _adaptiveBarWidth(data.length, chartWidth);

    return BarChart(
      BarChartData(
        maxY: adjustedMaxY,
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
                width: barWidth,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(tokens.radiusSm),
                  topRight: Radius.circular(tokens.radiusSm),
                ),
              ),
            ],
          );
        }).toList(),
        titlesData: _buildTitlesData(
          labels: data.map((d) => d[xKey]?.toString() ?? '').toList(),
          maxY: adjustedMaxY,
          yInterval: yInterval,
          leftReserved: leftReserved,
          context: context,
          chartWidth: chartWidth,
        ),
        gridData: _gridData(context, adjustedMaxY, yInterval: yInterval),
        borderData: FlBorderData(show: false),
        barTouchData: _barTouchData(context, labels: data.map((d) => d[xKey]?.toString() ?? '').toList()),
      ),
    );
  }

  // ---------- SERIES BAR CHART ----------

  Widget _buildSeriesBarChart(
    BuildContext context,
    List<Map<String, dynamic>> data,
    String xKey,
    String yKey,
    String seriesKey,
    Map? colorMap,
    List<Color> palette,
    Map<String, dynamic>? specTheme,
    double chartWidth,
  ) {
    final tokens = context.tokens;
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

    final ceiledMaxY = maxY * 1.15;
    final yInterval = _niceInterval(ceiledMaxY);
    final adjustedMaxY = (ceiledMaxY / yInterval).ceil() * yInterval;
    final leftReserved = _leftAxisReservedSize(adjustedMaxY);
    final plotWidth = chartWidth - leftReserved - 16;
    final barWidth = (plotWidth / (xValues.length * seriesList.length * 1.8)).clamp(4.0, 16.0);

    return BarChart(
      BarChartData(
        maxY: adjustedMaxY,
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
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(tokens.radiusSm),
                  topRight: Radius.circular(tokens.radiusSm),
                ),
              );
            }).toList(),
          );
        }).toList(),
        titlesData: _buildTitlesData(
          labels: xValues,
          maxY: adjustedMaxY,
          yInterval: yInterval,
          leftReserved: leftReserved,
          context: context,
          chartWidth: chartWidth,
        ),
        gridData: _gridData(context, adjustedMaxY, yInterval: yInterval),
        borderData: FlBorderData(show: false),
        barTouchData: _barTouchData(context, labels: xValues),
      ),
    );
  }

  // ---------- LINE / AREA CHART ----------

  Widget _buildLineChart(BuildContext context, List<Map<String, dynamic>> data, String xKey,
      String yKey, bool isArea, List<Color> palette, double chartWidth) {
    final tokens = context.tokens;
    final spots = data.asMap().entries.map((entry) {
      final value = (entry.value[yKey] as num?)?.toDouble() ?? 0;
      return FlSpot(entry.key.toDouble(), value);
    }).toList();

    final maxY = spots.fold<double>(0, (m, s) => math.max(m, s.y));
    final ceiledMaxY = maxY * 1.15;
    final yInterval = _niceInterval(ceiledMaxY);
    final adjustedMaxY = (ceiledMaxY / yInterval).ceil() * yInterval;
    final leftReserved = _leftAxisReservedSize(adjustedMaxY);
    final color = palette.isNotEmpty ? palette[0] : Colors.blue;
    final axisTextColor = tokens.neutral[500]!;
    final surfaceColor = tokens.neutral[50]!;

    final labels = data.map((d) => d[xKey]?.toString() ?? '').toList();
    // Account for both left and right reserved (right mirrors left for symmetry)
    final plotWidth = chartWidth - leftReserved * 2;
    final maxVisibleLabels = _maxVisibleLabels(plotWidth, labels);
    final visibleIndices = _evenlySpacedIndices(labels.length, maxVisibleLabels);

    return LineChart(
      LineChartData(
        maxY: adjustedMaxY,
        minY: 0,
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            preventCurveOverShooting: true,
            color: color,
            barWidth: 2,
            dotData: FlDotData(
              show: true,
              getDotPainter: (spot, pct, bar, idx) => FlDotCirclePainter(
                radius: 3,
                color: color,
                strokeWidth: 1.5,
                strokeColor: surfaceColor,
              ),
            ),
            belowBarData: isArea
                ? BarAreaData(show: true, color: color.withAlpha(40))
                : BarAreaData(show: false),
          ),
        ],
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: leftReserved,
              getTitlesWidget: (_, __) => const SizedBox.shrink(),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              interval: 1,
              getTitlesWidget: (value, meta) {
                final idx = value.toInt();
                if ((value - idx).abs() > 0.01) return const SizedBox.shrink();
                if (idx < 0 || idx >= labels.length) return const SizedBox.shrink();
                if (!visibleIndices.contains(idx)) {
                  return const SizedBox.shrink();
                }
                final isNarrow = chartWidth < 400;
                return Padding(
                  padding: EdgeInsets.only(top: tokens.spaceXs),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(maxWidth: isNarrow ? 60 : 80),
                    child: Text(
                      _smartTruncate(labels[idx], isNarrow ? 10 : 14),
                      style: TextStyle(fontSize: tokens.fontXs, color: axisTextColor),
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.center,
                    ),
                  ),
                );
              },
              reservedSize: 28,
            ),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              interval: yInterval,
              reservedSize: leftReserved,
              getTitlesWidget: (value, meta) {
                if (value == meta.max || value == meta.min) return const SizedBox.shrink();
                return Text(
                  _formatAxisValue(value),
                  style: TextStyle(fontSize: tokens.fontXs, color: axisTextColor),
                );
              },
            ),
          ),
        ),
        gridData: _gridData(context, adjustedMaxY, yInterval: yInterval),
        borderData: FlBorderData(show: false),
        lineTouchData: _lineTouchData(context, color),
      ),
    );
  }

  // ---------- SHARED HELPERS ----------

  /// Build consistent titles data for bar-type charts.
  /// Auto-skips labels based on available chart width (like Recharts).
  FlTitlesData _buildTitlesData({
    required List<String> labels,
    required double maxY,
    required double yInterval,
    required double leftReserved,
    required BuildContext context,
    required double chartWidth,
  }) {
    final tokens = context.tokens;
    final axisTextColor = tokens.neutral[500]!;
    // Account for both left and right reserved (right mirrors left for symmetry)
    final plotWidth = chartWidth - leftReserved * 2;
    final maxVisible = _maxVisibleLabels(plotWidth, labels);
    final visibleIndices = _evenlySpacedIndices(labels.length, maxVisible);
    final isNarrow = chartWidth < 400;
    final truncLen = isNarrow ? 10 : 14;
    final maxLabelWidth = isNarrow ? 60.0 : 80.0;

    return FlTitlesData(
      topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      rightTitles: AxisTitles(
        sideTitles: SideTitles(
          showTitles: true,
          reservedSize: leftReserved,
          getTitlesWidget: (_, __) => const SizedBox.shrink(),
        ),
      ),
      bottomTitles: AxisTitles(
        sideTitles: SideTitles(
          showTitles: true,
          interval: 1,
          getTitlesWidget: (value, meta) {
            final idx = value.toInt();
            if ((value - idx).abs() > 0.01) return const SizedBox.shrink();
            if (idx < 0 || idx >= labels.length) return const SizedBox.shrink();
            if (!visibleIndices.contains(idx)) {
              return const SizedBox.shrink();
            }
            return Padding(
              padding: EdgeInsets.only(top: tokens.spaceXs),
              child: ConstrainedBox(
                constraints: BoxConstraints(maxWidth: maxLabelWidth),
                child: Text(
                  _smartTruncate(labels[idx], truncLen),
                  style: TextStyle(fontSize: tokens.fontXs, color: axisTextColor),
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                ),
              ),
            );
          },
          reservedSize: 32,
        ),
      ),
      leftTitles: AxisTitles(
        sideTitles: SideTitles(
          showTitles: true,
          interval: yInterval,
          reservedSize: leftReserved,
          getTitlesWidget: (value, meta) {
            if (value == meta.max || value == meta.min) return const SizedBox.shrink();
            return Text(
              _formatAxisValue(value),
              style: TextStyle(fontSize: tokens.fontXs, color: axisTextColor),
            );
          },
        ),
      ),
    );
  }

  /// Compute a "nice" interval for the Y-axis
  double _niceInterval(double maxY) {
    if (maxY <= 0) return 1;
    final rough = maxY / 4;
    final exp = math.pow(10, (math.log(rough) / math.ln10).floor()).toDouble();
    final normalized = rough / exp;
    if (normalized <= 1) return exp;
    if (normalized <= 2) return 2 * exp;
    if (normalized <= 2.5) return 2.5 * exp;
    if (normalized <= 5) return 5 * exp;
    return 10 * exp;
  }

  /// Calculate left axis reserved size based on the magnitude of max Y value
  double _leftAxisReservedSize(double maxY) {
    final digits = maxY > 0 ? (math.log(maxY) / math.ln10).ceil() + 1 : 2;
    return (digits * 7.0 + 8).clamp(28.0, 56.0);
  }

  /// Adaptive bar width — uses available chart width for proportional sizing
  double _adaptiveBarWidth(int count, double chartWidth) {
    if (count <= 0) return 20;
    // Use ~55% of available slot width for the bar itself
    final slotWidth = chartWidth / count;
    return (slotWidth * 0.55).clamp(8.0, 40.0);
  }

  /// Compute evenly-distributed indices for label display.
  /// Always includes first and last, with remaining spread evenly between.
  Set<int> _evenlySpacedIndices(int total, int maxVisible) {
    if (total <= maxVisible) {
      return Set<int>.from(List.generate(total, (i) => i));
    }
    if (maxVisible <= 1) return {0};
    final indices = <int>{};
    for (int i = 0; i < maxVisible; i++) {
      indices.add((i * (total - 1) / (maxVisible - 1)).round());
    }
    return indices;
  }

  /// Calculate max number of labels that fit at the given width.
  /// Estimates label width from average label length plus inter-label gap.
  int _maxVisibleLabels(double plotWidth, List<String> labels) {
    if (labels.isEmpty) return 1;
    final avgLen = labels.fold<int>(0, (s, l) => s + l.length) ~/ labels.length;
    // ~6px per char at fontXs, plus 20px gap between labels for breathing room
    final approxLabelWidth = (avgLen.clamp(4, 14) * 6.0) + 20;
    return (plotWidth / approxLabelWidth).floor().clamp(2, 6);
  }

  /// Format axis values: use "k" suffix for thousands
  String _formatAxisValue(double value) {
    if (value >= 10000) return '${(value / 1000).toStringAsFixed(0)}k';
    if (value >= 1000) return '${(value / 1000).toStringAsFixed(1)}k';
    if (value == value.roundToDouble()) return value.toInt().toString();
    return value.toStringAsFixed(1);
  }

  /// Smarter truncation: prefer word boundaries
  String _smartTruncate(String label, int maxLen) {
    if (label.length <= maxLen) return label;
    final sub = label.substring(0, maxLen);
    final lastSpace = sub.lastIndexOf(' ');
    if (lastSpace > maxLen ~/ 2) {
      return '${sub.substring(0, lastSpace)}...';
    }
    return '${label.substring(0, maxLen - 1)}...';
  }

  /// Grid lines using neutral-200 token
  FlGridData _gridData(BuildContext context, double maxY, {double? yInterval}) {
    final gridColor = context.tokens.neutral[200]!;
    final interval = yInterval ?? (maxY > 0 ? maxY / 4 : 1);
    return FlGridData(
      show: true,
      drawVerticalLine: false,
      horizontalInterval: interval,
      getDrawingHorizontalLine: (value) => FlLine(
        color: gridColor,
        strokeWidth: 0.8,
        dashArray: [4, 3],
      ),
    );
  }

  /// Bar chart tooltip — shows label + value like Recharts Tooltip component
  BarTouchData _barTouchData(BuildContext context, {List<String>? labels}) {
    final tokens = context.tokens;
    return BarTouchData(
      enabled: true,
      touchTooltipData: BarTouchTooltipData(
        getTooltipColor: (_) => tokens.neutral[900]!,
        tooltipBorderRadius: BorderRadius.circular(tokens.radiusMd),
        tooltipPadding: EdgeInsets.symmetric(horizontal: tokens.spaceSm, vertical: tokens.spaceXs),
        getTooltipItem: (group, groupIdx, rod, rodIdx) {
          final label = (labels != null && groupIdx < labels.length) ? labels[groupIdx] : null;
          final valueText = _formatAxisValue(rod.toY);
          return BarTooltipItem(
            label != null ? '$label\n$valueText' : valueText,
            TextStyle(
              color: tokens.neutral[50],
              fontWeight: FontWeight.w500,
              fontSize: tokens.fontXs,
            ),
          );
        },
      ),
    );
  }

  /// Line chart tooltip
  LineTouchData _lineTouchData(BuildContext context, Color lineColor) {
    final tokens = context.tokens;
    return LineTouchData(
      enabled: true,
      touchTooltipData: LineTouchTooltipData(
        getTooltipColor: (_) => tokens.neutral[900]!,
        tooltipBorderRadius: BorderRadius.circular(tokens.radiusMd),
        tooltipPadding: EdgeInsets.symmetric(horizontal: tokens.spaceSm, vertical: tokens.spaceXs),
        getTooltipItems: (spots) => spots.map((spot) {
          return LineTooltipItem(
            _formatAxisValue(spot.y),
            TextStyle(
              color: tokens.neutral[50],
              fontWeight: FontWeight.w500,
              fontSize: tokens.fontXs,
            ),
          );
        }).toList(),
      ),
      getTouchedSpotIndicator: (barData, spotIndexes) {
        return spotIndexes.map((idx) {
          return TouchedSpotIndicatorData(
            FlLine(color: lineColor.withAlpha(80), strokeWidth: 1, dashArray: [4, 3]),
            FlDotData(
              show: true,
              getDotPainter: (_, __, ___, ____) => FlDotCirclePainter(
                radius: 5,
                color: lineColor,
                strokeWidth: 2,
                strokeColor: tokens.neutral[50]!,
              ),
            ),
          );
        }).toList();
      },
    );
  }

  Widget _emptyChart(BuildContext context, String? title, double height) {
    final tokens = context.tokens;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(tokens.radiusLg),
        side: BorderSide(color: tokens.neutral[200]!),
      ),
      child: Padding(
        padding: EdgeInsets.all(tokens.spaceMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (title != null)
              Text(title,
                  style: TextStyle(
                    fontSize: tokens.fontSm,
                    fontWeight: FontWeight.w600,
                    color: tokens.neutral[900],
                  )),
            SizedBox(
              height: height,
              child: Center(
                child: Text('No chart data available',
                    style: TextStyle(fontSize: tokens.fontSm, color: tokens.neutral[400])),
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
        borderRadius: BorderRadius.circular(tokens.radiusLg),
        side: BorderSide(color: tokens.neutral[200]!),
      ),
      child: Padding(
        padding: EdgeInsets.all(tokens.spaceMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (title != null)
              Text(title,
                  style: TextStyle(
                    fontSize: tokens.fontSm,
                    fontWeight: FontWeight.w600,
                    color: tokens.neutral[900],
                  )),
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
        borderRadius: BorderRadius.circular(tokens.radiusLg),
        side: BorderSide(color: tokens.danger[200]!),
      ),
      child: Padding(
        padding: EdgeInsets.all(tokens.spaceMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (title != null)
              Text(title,
                  style: TextStyle(
                    fontSize: tokens.fontSm,
                    fontWeight: FontWeight.w600,
                    color: tokens.neutral[900],
                  )),
            SizedBox(
              height: height,
              child: Center(
                child: Text('Failed to load chart',
                    style: TextStyle(fontSize: tokens.fontSm, color: tokens.danger[600])),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
