import 'package:flutter/material.dart';

import 'design_tokens.dart';

/// Converts spec theme config to Flutter ThemeData with GHTokens extension.
ThemeData buildThemeFromSpec(Map<String, dynamic>? theme) {
  final mode = theme?['mode'] as String? ?? 'light';
  final primaryHex = theme?['primary_color'] as String?;
  final secondaryHex = theme?['secondary_color'] as String?;

  final brightness = mode == 'dark' ? Brightness.dark : Brightness.light;
  final primaryColor = _parseColor(primaryHex) ?? Colors.blue.shade800;
  final secondaryColor = _parseColor(secondaryHex) ?? Colors.purple.shade600;

  final colorScheme = ColorScheme.fromSeed(
    seedColor: primaryColor,
    secondary: secondaryColor,
    brightness: brightness,
  );

  // Build design tokens from the spec theme map.
  final tokens = GHTokens.fromSpec(theme);

  return ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    appBarTheme: AppBarTheme(
      backgroundColor: colorScheme.surface,
      foregroundColor: colorScheme.onSurface,
      elevation: 0,
    ),
    cardTheme: CardThemeData(
      elevation: 1,
      margin: const EdgeInsets.symmetric(vertical: 4),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(tokens.radiusMd),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(tokens.radiusSm),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
    ),
    extensions: <ThemeExtension<dynamic>>[tokens],
  );
}

Color? _parseColor(String? hex) {
  if (hex == null || hex.isEmpty) return null;
  hex = hex.replaceFirst('#', '');
  if (hex.length == 6) hex = 'FF$hex';
  return Color(int.parse(hex, radix: 16));
}

/// Get a color for a semantic name (success, danger, warning, info, neutral).
///
/// When a [GHTokens] instance is available (via [tokens] parameter), the shade
/// 600 from the token palette is used instead of the hardcoded Material colors.
/// This keeps semantic colors consistent with the spec theme.
Color semanticColor(
  String? name, {
  required ColorScheme colorScheme,
  GHTokens? tokens,
}) {
  // If tokens are available, resolve from the palette shade 600.
  if (tokens != null) {
    switch (name) {
      case 'success':
        return tokens.success[600]!;
      case 'danger':
      case 'error':
        return tokens.danger[600]!;
      case 'warning':
        return tokens.warning[600]!;
      case 'info':
        return tokens.info[600]!;
      case 'neutral':
        return tokens.neutral[600]!;
      case 'primary':
        return tokens.primary[600]!;
      case 'secondary':
        return tokens.secondary[600]!;
      case 'accent':
        return tokens.accent[600]!;
    }
  }

  // Fallback to hardcoded Material colors when tokens are not provided.
  switch (name) {
    case 'success':
      return Colors.green.shade600;
    case 'danger':
    case 'error':
      return Colors.red.shade600;
    case 'warning':
      return Colors.orange.shade600;
    case 'info':
      return Colors.blue.shade600;
    case 'neutral':
      return Colors.grey.shade600;
    case 'primary':
      return colorScheme.primary;
    default:
      return Colors.grey.shade600;
  }
}

/// Semantic name -> spec theme key mapping
const _semanticToThemeKey = <String, String>{
  'primary': 'primary_color',
  'secondary': 'secondary_color',
  'accent': 'accent_color',
  'success': 'success_color',
  'danger': 'danger_color',
  'warning': 'warning_color',
  'info': 'info_color',
  'neutral': 'neutral',
  'blue': 'info_color',
  'green': 'success_color',
  'red': 'danger_color',
  'amber': 'warning_color',
  'purple': 'secondary_color',
};

/// Default fallbacks when theme doesn't specify a color
const _defaultSemanticHex = <String, String>{
  'primary_color': '#3B82F6',
  'secondary_color': '#7C3AED',
  'accent_color': '#F59E0B',
  'success_color': '#16A34A',
  'danger_color': '#DC2626',
  'warning_color': '#F59E0B',
  'info_color': '#3B82F6',
};

/// Resolve a semantic color name to its actual theme color.
/// Reads from the spec theme config so chart colors follow the theme.
Color resolveChartColor(String semanticName, Map<String, dynamic>? specTheme) {
  final lower = semanticName.toLowerCase();
  final themeKey = _semanticToThemeKey[lower];
  if (themeKey == null) {
    // Try parsing as raw hex
    final parsed = _parseColor(semanticName);
    return parsed ?? Colors.grey.shade600;
  }
  final hex = specTheme?[themeKey] as String? ?? _defaultSemanticHex[themeKey];
  return _parseColor(hex) ?? Colors.grey.shade600;
}

const _defaultChartPalette = ['primary', 'success', 'warning', 'danger', 'secondary', 'info'];

/// Get the chart color palette resolved to actual Colors from the spec theme.
List<Color> getChartPalette(Map<String, dynamic>? specTheme) {
  final paletteNames = (specTheme?['chart_palette'] as List?)
      ?.map((e) => e.toString())
      .toList();
  final names = (paletteNames != null && paletteNames.isNotEmpty)
      ? paletteNames
      : _defaultChartPalette;
  return names.map((n) => resolveChartColor(n, specTheme)).toList();
}

/// Parse a hex color string (public for chart use)
Color parseHexColor(String hex) => _parseColor(hex) ?? Colors.grey.shade600;
