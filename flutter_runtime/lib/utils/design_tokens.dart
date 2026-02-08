import 'dart:ui' show lerpDouble;

import 'package:flutter/material.dart';

/// Design-token ThemeExtension that mirrors the React CSS-var token system.
///
/// Tokens are derived from the spec `theme` map via [GHTokens.fromSpec].
/// Access in widgets: `context.tokens.spaceMd`, `context.tokens.primary[600]!`.
class GHTokens extends ThemeExtension<GHTokens> {
  const GHTokens({
    required this.primary,
    required this.secondary,
    required this.accent,
    required this.danger,
    required this.success,
    required this.info,
    required this.warning,
    required this.neutral,
    required this.spaceXs,
    required this.spaceSm,
    required this.spaceMd,
    required this.spaceLg,
    required this.spaceXl,
    required this.radiusSm,
    required this.radiusMd,
    required this.radiusLg,
    required this.radiusXl,
    required this.radiusFull,
    required this.fontXs,
    required this.fontSm,
    required this.fontBase,
    required this.fontLg,
    required this.fontXl,
    required this.font2xl,
    required this.shadowSm,
    required this.shadowMd,
    required this.shadowLg,
    required this.shadowXl,
    required this.motionFast,
    required this.motionNormal,
    required this.motionSlow,
  });

  // ---------------------------------------------------------------------------
  // Semantic color palettes  (shade keys: 50,100,200,...,900,950)
  // ---------------------------------------------------------------------------
  final Map<int, Color> primary;
  final Map<int, Color> secondary;
  final Map<int, Color> accent;
  final Map<int, Color> danger;
  final Map<int, Color> success;
  final Map<int, Color> info;
  final Map<int, Color> warning;
  final Map<int, Color> neutral;

  // ---------------------------------------------------------------------------
  // Spacing (density-aware)
  // ---------------------------------------------------------------------------
  final double spaceXs;
  final double spaceSm;
  final double spaceMd;
  final double spaceLg;
  final double spaceXl;

  // ---------------------------------------------------------------------------
  // Border radii
  // ---------------------------------------------------------------------------
  final double radiusSm;
  final double radiusMd;
  final double radiusLg;
  final double radiusXl;
  final double radiusFull;

  // ---------------------------------------------------------------------------
  // Typography scale
  // ---------------------------------------------------------------------------
  final double fontXs;
  final double fontSm;
  final double fontBase;
  final double fontLg;
  final double fontXl;
  final double font2xl;

  // ---------------------------------------------------------------------------
  // Elevation / shadows
  // ---------------------------------------------------------------------------
  final List<BoxShadow> shadowSm;
  final List<BoxShadow> shadowMd;
  final List<BoxShadow> shadowLg;
  final List<BoxShadow> shadowXl;

  // ---------------------------------------------------------------------------
  // Motion / animation durations
  // ---------------------------------------------------------------------------
  final Duration motionFast;
  final Duration motionNormal;
  final Duration motionSlow;

  // ---------------------------------------------------------------------------
  // Breakpoints (static constants)
  // ---------------------------------------------------------------------------
  static const double breakpointMd = 840.0;
  static const double breakpointLg = 1200.0;

  // ---------------------------------------------------------------------------
  // Factory: derive all tokens from the spec `theme` map
  // ---------------------------------------------------------------------------
  factory GHTokens.fromSpec(Map<String, dynamic>? theme) {
    final density = theme?['density'] as String? ?? 'comfortable';
    final fontScale = theme?['font_scale'] as String? ?? 'md';
    final motionMode = theme?['motion_mode'] as String? ?? 'full';
    final borderRadius = theme?['border_radius'] as String? ?? 'md';
    final elevation = theme?['elevation'] as String? ?? 'md';

    // -- Colors ---------------------------------------------------------------
    final primarySeed =
        _parseColor(theme?['primary_color'] as String?) ?? const Color(0xFF3B82F6);
    final secondarySeed =
        _parseColor(theme?['secondary_color'] as String?) ?? const Color(0xFF7C3AED);
    final accentSeed =
        _parseColor(theme?['accent_color'] as String?) ?? const Color(0xFFF59E0B);
    final dangerSeed =
        _parseColor(theme?['danger_color'] as String?) ?? const Color(0xFFDC2626);
    final successSeed =
        _parseColor(theme?['success_color'] as String?) ?? const Color(0xFF16A34A);
    final infoSeed =
        _parseColor(theme?['info_color'] as String?) ?? const Color(0xFF3B82F6);
    final warningSeed =
        _parseColor(theme?['warning_color'] as String?) ?? const Color(0xFFF59E0B);
    final neutralSeed = const Color(0xFF6B7280); // grey-500

    return GHTokens(
      primary: _generateShadeScale(primarySeed),
      secondary: _generateShadeScale(secondarySeed),
      accent: _generateShadeScale(accentSeed),
      danger: _generateShadeScale(dangerSeed),
      success: _generateShadeScale(successSeed),
      info: _generateShadeScale(infoSeed),
      warning: _generateShadeScale(warningSeed),
      neutral: _generateShadeScale(neutralSeed),
      // Spacing
      spaceXs: _spacingFor(density, 'xs'),
      spaceSm: _spacingFor(density, 'sm'),
      spaceMd: _spacingFor(density, 'md'),
      spaceLg: _spacingFor(density, 'lg'),
      spaceXl: _spacingFor(density, 'xl'),
      // Radii
      radiusSm: _radiusFor(borderRadius, 'sm'),
      radiusMd: _radiusFor(borderRadius, 'md'),
      radiusLg: _radiusFor(borderRadius, 'lg'),
      radiusXl: _radiusFor(borderRadius, 'xl'),
      radiusFull: _radiusFor(borderRadius, 'full'),
      // Font sizes
      fontXs: _fontFor(fontScale, 'xs'),
      fontSm: _fontFor(fontScale, 'sm'),
      fontBase: _fontFor(fontScale, 'base'),
      fontLg: _fontFor(fontScale, 'lg'),
      fontXl: _fontFor(fontScale, 'xl'),
      font2xl: _fontFor(fontScale, '2xl'),
      // Shadows
      shadowSm: _shadowFor(elevation, 'sm'),
      shadowMd: _shadowFor(elevation, 'md'),
      shadowLg: _shadowFor(elevation, 'lg'),
      shadowXl: _shadowFor(elevation, 'xl'),
      // Motion
      motionFast: _motionFor(motionMode, 'fast'),
      motionNormal: _motionFor(motionMode, 'normal'),
      motionSlow: _motionFor(motionMode, 'slow'),
    );
  }

  // ---------------------------------------------------------------------------
  // copyWith
  // ---------------------------------------------------------------------------
  @override
  GHTokens copyWith({
    Map<int, Color>? primary,
    Map<int, Color>? secondary,
    Map<int, Color>? accent,
    Map<int, Color>? danger,
    Map<int, Color>? success,
    Map<int, Color>? info,
    Map<int, Color>? warning,
    Map<int, Color>? neutral,
    double? spaceXs,
    double? spaceSm,
    double? spaceMd,
    double? spaceLg,
    double? spaceXl,
    double? radiusSm,
    double? radiusMd,
    double? radiusLg,
    double? radiusXl,
    double? radiusFull,
    double? fontXs,
    double? fontSm,
    double? fontBase,
    double? fontLg,
    double? fontXl,
    double? font2xl,
    List<BoxShadow>? shadowSm,
    List<BoxShadow>? shadowMd,
    List<BoxShadow>? shadowLg,
    List<BoxShadow>? shadowXl,
    Duration? motionFast,
    Duration? motionNormal,
    Duration? motionSlow,
  }) {
    return GHTokens(
      primary: primary ?? this.primary,
      secondary: secondary ?? this.secondary,
      accent: accent ?? this.accent,
      danger: danger ?? this.danger,
      success: success ?? this.success,
      info: info ?? this.info,
      warning: warning ?? this.warning,
      neutral: neutral ?? this.neutral,
      spaceXs: spaceXs ?? this.spaceXs,
      spaceSm: spaceSm ?? this.spaceSm,
      spaceMd: spaceMd ?? this.spaceMd,
      spaceLg: spaceLg ?? this.spaceLg,
      spaceXl: spaceXl ?? this.spaceXl,
      radiusSm: radiusSm ?? this.radiusSm,
      radiusMd: radiusMd ?? this.radiusMd,
      radiusLg: radiusLg ?? this.radiusLg,
      radiusXl: radiusXl ?? this.radiusXl,
      radiusFull: radiusFull ?? this.radiusFull,
      fontXs: fontXs ?? this.fontXs,
      fontSm: fontSm ?? this.fontSm,
      fontBase: fontBase ?? this.fontBase,
      fontLg: fontLg ?? this.fontLg,
      fontXl: fontXl ?? this.fontXl,
      font2xl: font2xl ?? this.font2xl,
      shadowSm: shadowSm ?? this.shadowSm,
      shadowMd: shadowMd ?? this.shadowMd,
      shadowLg: shadowLg ?? this.shadowLg,
      shadowXl: shadowXl ?? this.shadowXl,
      motionFast: motionFast ?? this.motionFast,
      motionNormal: motionNormal ?? this.motionNormal,
      motionSlow: motionSlow ?? this.motionSlow,
    );
  }

  // ---------------------------------------------------------------------------
  // lerp  (for animated theme transitions)
  // ---------------------------------------------------------------------------
  @override
  GHTokens lerp(covariant GHTokens? other, double t) {
    if (other == null) return this;
    return GHTokens(
      primary: _lerpShadeMap(primary, other.primary, t),
      secondary: _lerpShadeMap(secondary, other.secondary, t),
      accent: _lerpShadeMap(accent, other.accent, t),
      danger: _lerpShadeMap(danger, other.danger, t),
      success: _lerpShadeMap(success, other.success, t),
      info: _lerpShadeMap(info, other.info, t),
      warning: _lerpShadeMap(warning, other.warning, t),
      neutral: _lerpShadeMap(neutral, other.neutral, t),
      spaceXs: lerpDouble(spaceXs, other.spaceXs, t)!,
      spaceSm: lerpDouble(spaceSm, other.spaceSm, t)!,
      spaceMd: lerpDouble(spaceMd, other.spaceMd, t)!,
      spaceLg: lerpDouble(spaceLg, other.spaceLg, t)!,
      spaceXl: lerpDouble(spaceXl, other.spaceXl, t)!,
      radiusSm: lerpDouble(radiusSm, other.radiusSm, t)!,
      radiusMd: lerpDouble(radiusMd, other.radiusMd, t)!,
      radiusLg: lerpDouble(radiusLg, other.radiusLg, t)!,
      radiusXl: lerpDouble(radiusXl, other.radiusXl, t)!,
      radiusFull: lerpDouble(radiusFull, other.radiusFull, t)!,
      fontXs: lerpDouble(fontXs, other.fontXs, t)!,
      fontSm: lerpDouble(fontSm, other.fontSm, t)!,
      fontBase: lerpDouble(fontBase, other.fontBase, t)!,
      fontLg: lerpDouble(fontLg, other.fontLg, t)!,
      fontXl: lerpDouble(fontXl, other.fontXl, t)!,
      font2xl: lerpDouble(font2xl, other.font2xl, t)!,
      shadowSm: t < 0.5 ? shadowSm : other.shadowSm,
      shadowMd: t < 0.5 ? shadowMd : other.shadowMd,
      shadowLg: t < 0.5 ? shadowLg : other.shadowLg,
      shadowXl: t < 0.5 ? shadowXl : other.shadowXl,
      motionFast: t < 0.5 ? motionFast : other.motionFast,
      motionNormal: t < 0.5 ? motionNormal : other.motionNormal,
      motionSlow: t < 0.5 ? motionSlow : other.motionSlow,
    );
  }

  // ---------------------------------------------------------------------------
  // Convenience: get a palette map by semantic name
  // ---------------------------------------------------------------------------
  Map<int, Color> paletteFor(String name) {
    switch (name) {
      case 'primary':
        return primary;
      case 'secondary':
        return secondary;
      case 'accent':
        return accent;
      case 'danger':
      case 'error':
        return danger;
      case 'success':
        return success;
      case 'info':
        return info;
      case 'warning':
        return warning;
      case 'neutral':
        return neutral;
      default:
        return neutral;
    }
  }

  // ===========================================================================
  //  PRIVATE HELPERS
  // ===========================================================================

  /// Parse a hex color string, returning null on failure.
  static Color? _parseColor(String? hex) {
    if (hex == null || hex.isEmpty) return null;
    hex = hex.replaceFirst('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    final value = int.tryParse(hex, radix: 16);
    return value != null ? Color(value) : null;
  }

  // ---------------------------------------------------------------------------
  // Shade-scale generation via HSL
  // ---------------------------------------------------------------------------

  /// Shade keys in ascending order.
  static const _shadeKeys = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

  /// Target lightness for each shade (0.0 - 1.0).
  /// Shade 600 maps to the seed color's own hue/saturation with lightness at
  /// index 6.  The scale goes from very light (50) to very dark (950).
  static const _shadeLightness = <int, double>{
    50: 0.96,
    100: 0.92,
    200: 0.85,
    300: 0.76,
    400: 0.64,
    500: 0.52,
    600: 0.0, // placeholder -- replaced by seed lightness
    700: 0.35,
    800: 0.27,
    900: 0.20,
    950: 0.14,
  };

  /// Generate a shade map from a seed [color].
  /// Shade 600 uses the seed color itself. Lighter shades increase lightness
  /// toward white; darker shades decrease lightness toward black.
  static Map<int, Color> _generateShadeScale(Color color) {
    final hsl = HSLColor.fromColor(color);
    final map = <int, Color>{};
    for (final shade in _shadeKeys) {
      if (shade == 600) {
        map[shade] = color;
      } else {
        final targetL = _shadeLightness[shade]!;
        // Blend the target lightness with the seed to keep hue/saturation
        // consistent.  For shades lighter than 600 we move toward white,
        // for darker we move toward black.
        final l = targetL.clamp(0.0, 1.0);
        map[shade] = HSLColor.fromAHSL(1.0, hsl.hue, hsl.saturation, l).toColor();
      }
    }
    return Map.unmodifiable(map);
  }

  // ---------------------------------------------------------------------------
  // Spacing look-up tables
  // ---------------------------------------------------------------------------
  static const _spacingTable = <String, Map<String, double>>{
    'compact': {'xs': 4, 'sm': 8, 'md': 12, 'lg': 16, 'xl': 24},
    'comfortable': {'xs': 8, 'sm': 12, 'md': 16, 'lg': 24, 'xl': 32},
    'spacious': {'xs': 12, 'sm': 16, 'md': 24, 'lg': 32, 'xl': 48},
  };

  static double _spacingFor(String density, String size) {
    return _spacingTable[density]?[size] ?? _spacingTable['comfortable']![size]!;
  }

  // ---------------------------------------------------------------------------
  // Font-size look-up tables
  // ---------------------------------------------------------------------------
  static const _fontTable = <String, Map<String, double>>{
    'sm': {'xs': 11, 'sm': 12, 'base': 13, 'lg': 15, 'xl': 18, '2xl': 20},
    'md': {'xs': 12, 'sm': 13, 'base': 14, 'lg': 16, 'xl': 20, '2xl': 24},
    'lg': {'xs': 14, 'sm': 15, 'base': 16, 'lg': 18, 'xl': 24, '2xl': 30},
  };

  static double _fontFor(String scale, String size) {
    return _fontTable[scale]?[size] ?? _fontTable['md']![size]!;
  }

  // ---------------------------------------------------------------------------
  // Radius look-up tables
  // ---------------------------------------------------------------------------
  static const _radiusTable = <String, Map<String, double>>{
    'none': {'sm': 0, 'md': 0, 'lg': 0, 'xl': 0, 'full': 0},
    'sm': {'sm': 2, 'md': 4, 'lg': 6, 'xl': 8, 'full': 9999},
    'md': {'sm': 4, 'md': 6, 'lg': 8, 'xl': 12, 'full': 9999},
    'lg': {'sm': 6, 'md': 8, 'lg': 12, 'xl': 16, 'full': 9999},
    'full': {'sm': 8, 'md': 12, 'lg': 16, 'xl': 24, 'full': 9999},
  };

  static double _radiusFor(String preset, String size) {
    return _radiusTable[preset]?[size] ?? _radiusTable['md']![size]!;
  }

  // ---------------------------------------------------------------------------
  // Shadow look-up tables
  // ---------------------------------------------------------------------------
  static const _shadowColor = Color(0x1A000000); // black 10%
  static const _shadowColorMd = Color(0x26000000); // black 15%
  static const _shadowColorLg = Color(0x33000000); // black 20%

  static final _shadowTable = <String, Map<String, List<BoxShadow>>>{
    'none': {
      'sm': const [],
      'md': const [],
      'lg': const [],
      'xl': const [],
    },
    'sm': {
      'sm': const [
        BoxShadow(color: _shadowColor, blurRadius: 1, offset: Offset(0, 1)),
      ],
      'md': const [
        BoxShadow(color: _shadowColor, blurRadius: 2, offset: Offset(0, 1)),
        BoxShadow(color: _shadowColor, blurRadius: 3, offset: Offset(0, 2)),
      ],
      'lg': const [
        BoxShadow(color: _shadowColor, blurRadius: 4, offset: Offset(0, 2)),
        BoxShadow(color: _shadowColor, blurRadius: 6, offset: Offset(0, 4)),
      ],
      'xl': const [
        BoxShadow(color: _shadowColor, blurRadius: 6, offset: Offset(0, 4)),
        BoxShadow(color: _shadowColor, blurRadius: 10, offset: Offset(0, 8)),
      ],
    },
    'md': {
      'sm': const [
        BoxShadow(color: _shadowColor, blurRadius: 2, offset: Offset(0, 1)),
      ],
      'md': const [
        BoxShadow(color: _shadowColorMd, blurRadius: 4, offset: Offset(0, 2)),
        BoxShadow(color: _shadowColor, blurRadius: 6, offset: Offset(0, 4)),
      ],
      'lg': const [
        BoxShadow(color: _shadowColorMd, blurRadius: 8, offset: Offset(0, 4)),
        BoxShadow(color: _shadowColor, blurRadius: 12, offset: Offset(0, 8)),
      ],
      'xl': const [
        BoxShadow(color: _shadowColorLg, blurRadius: 12, offset: Offset(0, 8)),
        BoxShadow(color: _shadowColorMd, blurRadius: 20, offset: Offset(0, 16)),
      ],
    },
    'lg': {
      'sm': const [
        BoxShadow(color: _shadowColorMd, blurRadius: 3, offset: Offset(0, 2)),
      ],
      'md': const [
        BoxShadow(color: _shadowColorMd, blurRadius: 6, offset: Offset(0, 4)),
        BoxShadow(color: _shadowColor, blurRadius: 10, offset: Offset(0, 8)),
      ],
      'lg': const [
        BoxShadow(color: _shadowColorLg, blurRadius: 12, offset: Offset(0, 8)),
        BoxShadow(color: _shadowColorMd, blurRadius: 20, offset: Offset(0, 16)),
      ],
      'xl': const [
        BoxShadow(color: _shadowColorLg, blurRadius: 20, offset: Offset(0, 12)),
        BoxShadow(color: _shadowColorMd, blurRadius: 30, offset: Offset(0, 24)),
      ],
    },
  };

  static List<BoxShadow> _shadowFor(String preset, String size) {
    return _shadowTable[preset]?[size] ?? _shadowTable['md']![size]!;
  }

  // ---------------------------------------------------------------------------
  // Motion look-up tables
  // ---------------------------------------------------------------------------
  static const _motionTable = <String, Map<String, int>>{
    'full': {'fast': 150, 'normal': 200, 'slow': 300},
    'reduced': {'fast': 50, 'normal': 100, 'slow': 150},
    'none': {'fast': 0, 'normal': 0, 'slow': 0},
  };

  static Duration _motionFor(String mode, String speed) {
    final ms = _motionTable[mode]?[speed] ?? _motionTable['full']![speed]!;
    return Duration(milliseconds: ms);
  }

  // ---------------------------------------------------------------------------
  // lerp helper for shade maps
  // ---------------------------------------------------------------------------
  static Map<int, Color> _lerpShadeMap(
    Map<int, Color> a,
    Map<int, Color> b,
    double t,
  ) {
    final result = <int, Color>{};
    for (final key in _shadeKeys) {
      final ca = a[key] ?? Colors.transparent;
      final cb = b[key] ?? Colors.transparent;
      result[key] = Color.lerp(ca, cb, t)!;
    }
    return Map.unmodifiable(result);
  }
}

// =============================================================================
// BuildContext extension for ergonomic access
// =============================================================================

/// Provides `context.tokens` shorthand for accessing [GHTokens].
extension GHTokensExtension on BuildContext {
  GHTokens get tokens => Theme.of(this).extension<GHTokens>()!;
}
