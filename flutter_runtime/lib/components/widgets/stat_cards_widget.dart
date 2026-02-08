import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/component_tree.dart';
import '../../providers/widget_data_provider.dart';
import '../../utils/design_tokens.dart';
import '../../utils/theme_colors.dart';
import '../../utils/icon_mapper.dart';

class StatCardsWidget extends ConsumerWidget {
  final ComponentNode node;
  const StatCardsWidget({super.key, required this.node});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cards = node.listProp('cards');
    if (cards == null || cards.isEmpty) return const SizedBox.shrink();

    // Find the shared data source from card values
    final source = _getCardSource(cards);
    final asyncData = source != null
        ? ref.watch(widgetDataProvider(source))
        : const AsyncValue<Map<String, dynamic>>.data({});

    return asyncData.when(
      loading: () => _buildShimmer(context, cards.length),
      error: (_, __) => _buildError(context),
      data: (fetchedData) => _buildCards(context, cards, fetchedData),
    );
  }

  Widget _buildCards(BuildContext context, List<dynamic> cards,
      Map<String, dynamic> fetchedData) {
    final colorScheme = Theme.of(context).colorScheme;
    final tokens = context.tokens;

    return LayoutBuilder(
      builder: (context, constraints) {
        final cols = _responsiveCols(constraints.maxWidth, cards.length);
        final spacing = tokens.spaceSm;
        final cardWidth =
            (constraints.maxWidth - (cols - 1) * spacing) / cols;

        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: cards.map((cardDef) {
            final card = Map<String, dynamic>.from(cardDef as Map);
            final title = card['title'] as String? ?? '';
            final icon = card['icon'] as String?;
            final color = card['color'] as String?;
            final link = card['link'] as String?;
            final resolved = _resolveValue(card['value'], fetchedData);
            final semantic = semanticColor(color ?? 'primary',
                colorScheme: colorScheme);

            // Trend indicator
            final trend = card['trend'] as Map<String, dynamic>?;
            final trendValue = trend?['value'] as num?;
            final trendDirection = trend?['direction'] as String?;

            final content = SizedBox(
              width: cardWidth,
              child: Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(tokens.radiusMd),
                  side: BorderSide(color: Theme.of(context).dividerColor),
                ),
                child: Padding(
                  padding: EdgeInsets.all(tokens.spaceMd),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(title,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(color: colorScheme.onSurfaceVariant)),
                            const SizedBox(height: 4),
                            Text(resolved,
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineSmall
                                    ?.copyWith(fontWeight: FontWeight.w600)),
                            if (trendValue != null || trendDirection != null) ...[
                              const SizedBox(height: 4),
                              _buildTrend(trendValue, trendDirection),
                            ],
                          ],
                        ),
                      ),
                      if (icon != null)
                        Container(
                          padding: EdgeInsets.all(tokens.spaceXs),
                          decoration: BoxDecoration(
                            color: semantic.withAlpha(25),
                            borderRadius: BorderRadius.circular(tokens.radiusMd),
                          ),
                          child: Icon(mapIcon(icon),
                              size: 20, color: semantic),
                        ),
                    ],
                  ),
                ),
              ),
            );

            if (link != null) {
              return InkWell(
                onTap: () => context.go(link),
                borderRadius: BorderRadius.circular(tokens.radiusMd),
                child: content,
              );
            }
            return content;
          }).toList(),
        );
      },
    );
  }

  Widget _buildTrend(num? value, String? direction) {
    return Builder(builder: (context) {
      final tokens = context.tokens;
      final isUp = direction == 'up' || (value != null && value > 0);
      final color = isUp ? tokens.success[600]! : tokens.danger[600]!;
      final icon = isUp ? Icons.arrow_upward : Icons.arrow_downward;
      final displayValue = value != null ? '${value.abs()}%' : '';

      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 2),
          Text(
            displayValue,
            style: TextStyle(fontSize: tokens.fontXs, color: color, fontWeight: FontWeight.w500),
          ),
        ],
      );
    });
  }

  int _responsiveCols(double width, int count) {
    final maxCols = count.clamp(1, 4);
    if (width < 400) return 1;
    if (width < 600) return maxCols.clamp(1, 2);
    return maxCols;
  }

  String _resolveValue(dynamic val, Map<String, dynamic> fetchedData) {
    if (val == null) return '—';
    if (val is String || val is num) return val.toString();
    if (val is Map) {
      final field = val['field'] as String?;
      if (field != null && fetchedData.containsKey(field)) {
        return fetchedData[field].toString();
      }
    }
    return '—';
  }

  String? _getCardSource(List<dynamic> cards) {
    for (final card in cards) {
      if (card is Map) {
        final value = card['value'];
        if (value is Map && value['source'] is String) {
          return value['source'] as String;
        }
      }
    }
    return null;
  }

  Widget _buildShimmer(BuildContext context, int count) {
    final tokens = context.tokens;
    return LayoutBuilder(
      builder: (context, constraints) {
        final cols = _responsiveCols(constraints.maxWidth, count);
        final spacing = tokens.spaceSm;
        final cardWidth =
            (constraints.maxWidth - (cols - 1) * spacing) / cols;

        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: List.generate(
            count,
            (_) => SizedBox(
              width: cardWidth,
              height: 88,
              child: Card(
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(tokens.radiusMd),
                  side: BorderSide(color: Theme.of(context).dividerColor),
                ),
                child: const Center(
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildError(BuildContext context) {
    final tokens = context.tokens;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(tokens.radiusMd),
        side: BorderSide(color: Theme.of(context).colorScheme.error.withValues(alpha: 0.3)),
      ),
      child: Padding(
        padding: EdgeInsets.all(tokens.spaceMd),
        child: Text('Failed to load stats',
            style: TextStyle(color: Theme.of(context).colorScheme.error, fontSize: tokens.fontSm)),
      ),
    );
  }
}
