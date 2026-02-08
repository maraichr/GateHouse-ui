import 'package:flutter/material.dart';
import 'package:flutter_html/flutter_html.dart';
import '../../models/types.dart';
import '../../utils/design_tokens.dart';
import '../../utils/display_rule_evaluator.dart';
import '../../utils/theme_colors.dart';
import 'enum_badge_widget.dart';

/// Universal field display widget — renders any field type appropriately.
class FieldDisplay extends StatelessWidget {
  final Field field;
  final dynamic value;
  final bool compact;

  const FieldDisplay({
    super.key,
    required this.field,
    required this.value,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    if (value == null) {
      return Text('\u2013', style: TextStyle(color: Theme.of(context).colorScheme.outline));
    }

    // Check display rules first
    final ruleResult = evaluateDisplayRules(field.displayRules, value);

    Widget content;
    switch (field.type) {
      case 'enum':
        content = EnumBadgeWidget(
          value: value.toString(),
          values: field.values ?? [],
          compact: compact,
        );
        break;

      case 'date':
      case 'datetime':
        content = _DateDisplay(
          value: value,
          format: field.format,
          ruleResult: ruleResult,
        );
        break;

      case 'decimal':
      case 'number':
      case 'integer':
        if (field.displayAs == 'star_rating') {
          content = _StarRating(value: value);
        } else {
          content = Text(value.toString());
        }
        break;

      case 'currency':
        content = _CurrencyDisplay(value: value, currency: field.currency);
        break;

      case 'array':
        content = _ArrayDisplay(value: value, compact: compact);
        break;

      case 'image':
        if (field.displayAs == 'avatar') {
          content = _AvatarDisplay(value: value);
        } else {
          content = Text(value.toString());
        }
        break;

      case 'address':
        content = _AddressDisplay(value: value);
        break;

      case 'richtext':
        content = _RichtextDisplay(value: value, compact: compact);
        break;

      case 'string':
      case 'phone':
      case 'email':
      default:
        content = _StringDisplay(
          value: value,
          sensitive: field.sensitive,
          maskPattern: field.maskPattern,
          type: field.type,
        );
    }

    // Wrap with display rule styling
    if (ruleResult != null) {
      final tokens = context.tokens;
      final ruleColor = _ruleStyleColor(ruleResult.style, context);
      return Tooltip(
        message: ruleResult.tooltip ?? '',
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: tokens.spaceXs * 0.75, vertical: 2),
          decoration: BoxDecoration(
            color: ruleColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(tokens.radiusSm),
          ),
          child: DefaultTextStyle.merge(
            style: TextStyle(color: ruleColor, fontWeight: FontWeight.w500),
            child: content,
          ),
        ),
      );
    }

    return content;
  }

  Color _ruleStyleColor(String style, BuildContext context) {
    return semanticColor(style, colorScheme: Theme.of(context).colorScheme);
  }
}

class _DateDisplay extends StatelessWidget {
  final dynamic value;
  final String? format;
  final DisplayRuleResult? ruleResult;

  const _DateDisplay({required this.value, this.format, this.ruleResult});

  @override
  Widget build(BuildContext context) {
    final date = DateTime.tryParse(value.toString());
    if (date == null) return Text(value.toString());

    String display;
    if (format == 'relative') {
      final diff = DateTime.now().difference(date);
      if (diff.inDays == 0) {
        display = 'Today';
      } else if (diff.inDays == 1) {
        display = 'Yesterday';
      } else if (diff.inDays < 30) {
        display = '${diff.inDays} days ago';
      } else if (diff.inDays < 365) {
        display = '${(diff.inDays / 30).floor()} months ago';
      } else {
        display = '${(diff.inDays / 365).floor()} years ago';
      }
    } else {
      display =
          '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
    }

    return Text(display);
  }
}

class _StarRating extends StatelessWidget {
  final dynamic value;
  const _StarRating({required this.value});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final numVal = (value is num) ? value.toDouble() : (double.tryParse(value.toString()) ?? 0);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        if (i < numVal.floor()) {
          return Icon(Icons.star, size: 16, color: tokens.warning[500]!);
        } else if (i < numVal) {
          return Icon(Icons.star_half, size: 16, color: tokens.warning[500]!);
        } else {
          return Icon(Icons.star_border, size: 16, color: Theme.of(context).colorScheme.outlineVariant);
        }
      }),
    );
  }
}

class _CurrencyDisplay extends StatelessWidget {
  final dynamic value;
  final String? currency;
  const _CurrencyDisplay({required this.value, this.currency});

  @override
  Widget build(BuildContext context) {
    final numVal = value is num ? value : num.tryParse(value.toString());
    if (numVal == null) return Text(value.toString());

    final prefix = currency == 'USD' ? '\$' : (currency ?? '');
    final formatted = numVal.toStringAsFixed(2);
    // Add thousand separators
    final parts = formatted.split('.');
    final intPart = parts[0].replaceAllMapped(
        RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
    return Text('$prefix$intPart.${parts[1]}');
  }
}

class _ArrayDisplay extends StatelessWidget {
  final dynamic value;
  final bool compact;
  const _ArrayDisplay({required this.value, this.compact = false});

  @override
  Widget build(BuildContext context) {
    if (value is! List) return Text(value.toString());
    final tokens = context.tokens;
    final colorScheme = Theme.of(context).colorScheme;
    final items = value as List;
    final display = compact ? items.take(2).toList() : items;
    final remaining = items.length - display.length;

    return Wrap(
      spacing: tokens.spaceXs / 2,
      runSpacing: tokens.spaceXs / 2,
      children: [
        ...display.map((item) => Container(
              padding: EdgeInsets.symmetric(horizontal: tokens.spaceXs, vertical: 2),
              decoration: BoxDecoration(
                color: colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(tokens.radiusMd),
              ),
              child: Text(
                item.toString(),
                style: TextStyle(fontSize: tokens.fontSm),
              ),
            )),
        if (remaining > 0)
          Container(
            padding: EdgeInsets.symmetric(horizontal: tokens.spaceXs, vertical: 2),
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainerLow,
              borderRadius: BorderRadius.circular(tokens.radiusMd),
            ),
            child: Text(
              '+$remaining more',
              style: TextStyle(fontSize: tokens.fontSm, color: colorScheme.onSurfaceVariant),
            ),
          ),
      ],
    );
  }
}

class _AvatarDisplay extends StatelessWidget {
  final dynamic value;
  final String? name;
  const _AvatarDisplay({required this.value, this.name});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final tokens = context.tokens;
    if (value is String && (value as String).isNotEmpty) {
      return CircleAvatar(
        radius: 16,
        backgroundImage: NetworkImage(value as String),
      );
    }
    // Initials fallback
    final initials = _extractInitials(name);
    if (initials.isNotEmpty) {
      return CircleAvatar(
        radius: 16,
        backgroundColor: colorScheme.surfaceContainerHighest,
        child: Text(
          initials,
          style: TextStyle(
            fontSize: tokens.fontSm,
            fontWeight: FontWeight.w600,
            color: colorScheme.onSurfaceVariant,
          ),
        ),
      );
    }
    return CircleAvatar(
      radius: 16,
      backgroundColor: colorScheme.surfaceContainerHighest,
      child: Icon(Icons.business, size: 16, color: colorScheme.outline),
    );
  }

  String _extractInitials(String? name) {
    if (name == null || name.isEmpty) return '';
    final words = name.trim().split(RegExp(r'\s+'));
    if (words.length >= 2) {
      return '${words[0][0]}${words[1][0]}'.toUpperCase();
    }
    return words[0][0].toUpperCase();
  }
}

class _AddressDisplay extends StatelessWidget {
  final dynamic value;
  const _AddressDisplay({required this.value});

  @override
  Widget build(BuildContext context) {
    if (value is! Map) return Text(value.toString());
    final addr = value as Map;
    final parts = <String>[];
    for (final key in ['street1', 'street2', 'city', 'state', 'zip']) {
      final v = addr[key];
      if (v != null && v.toString().isNotEmpty) {
        parts.add(v.toString());
      }
    }
    if (parts.isEmpty) {
      return Text('\u2013', style: TextStyle(color: Theme.of(context).colorScheme.outline));
    }
    return Text(parts.join(', '));
  }
}

class _RichtextDisplay extends StatelessWidget {
  final dynamic value;
  final bool compact;
  const _RichtextDisplay({required this.value, this.compact = false});

  @override
  Widget build(BuildContext context) {
    final html = value.toString();
    if (compact) {
      // Strip HTML and truncate for compact mode
      final stripped = html.replaceAll(RegExp(r'<[^>]*>'), '');
      return Text(
        stripped,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      );
    }
    return Html(
      data: html,
      style: {
        'body': Style(
          margin: Margins.zero,
          padding: HtmlPaddings.zero,
          fontSize: FontSize(context.tokens.fontBase),
        ),
      },
    );
  }
}

class _StringDisplay extends StatelessWidget {
  final dynamic value;
  final bool sensitive;
  final String? maskPattern;
  final String type;

  const _StringDisplay({
    required this.value,
    this.sensitive = false,
    this.maskPattern,
    this.type = 'string',
  });

  @override
  Widget build(BuildContext context) {
    var display = value.toString();

    if (sensitive && maskPattern != null) {
      display = _applyMask(display, maskPattern!);
    }

    if (type == 'phone') {
      display = _formatPhone(display);
    }

    return Text(display);
  }

  String _applyMask(String value, String pattern) {
    final result = StringBuffer();
    var valueIdx = 0;
    for (var i = 0; i < pattern.length && valueIdx < value.length; i++) {
      final maskChar = pattern[i];
      if (maskChar == '#') {
        result.write(value[valueIdx]);
        valueIdx++;
      } else if (maskChar == '*' || maskChar == 'X') {
        result.write('*');
        valueIdx++;
      } else {
        result.write(maskChar);
        if (value[valueIdx] == maskChar) valueIdx++;
      }
    }
    return result.toString();
  }

  String _formatPhone(String phone) {
    final digits = phone.replaceAll(RegExp(r'[^\d]'), '');
    if (digits.length == 10) {
      return '(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}';
    }
    return phone;
  }
}
