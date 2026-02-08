import 'package:flutter/material.dart';
import '../../models/types.dart';
import '../../utils/design_tokens.dart';
import '../../utils/theme_colors.dart';
import '../../utils/icon_mapper.dart';

class EnumBadgeWidget extends StatelessWidget {
  final String value;
  final List<EnumValue> values;
  final bool compact;

  const EnumBadgeWidget({
    super.key,
    required this.value,
    required this.values,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final enumVal = values.cast<EnumValue?>().firstWhere(
          (v) => v!.value == value,
          orElse: () => null,
        );

    if (enumVal == null) return Text(value);

    final color = semanticColor(
      enumVal.color,
      colorScheme: Theme.of(context).colorScheme,
    );

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? tokens.spaceXs : tokens.spaceSm,
        vertical: compact ? 2 : tokens.spaceXs / 2,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(compact ? tokens.radiusSm + 2 : tokens.radiusMd),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (enumVal.icon != null && !compact) ...[
            Icon(mapIcon(enumVal.icon), size: 14, color: color),
            SizedBox(width: tokens.spaceXs / 2),
          ],
          Text(
            enumVal.label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: compact ? tokens.fontXs : tokens.fontSm,
            ),
          ),
        ],
      ),
    );
  }
}
