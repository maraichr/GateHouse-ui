/// Resolves presentation hints for Flutter renderer.
/// Picks "flutter" key from presentation map, falls back to "web" or default.
String resolvePresentation(dynamic presentation, {String fallback = 'default'}) {
  if (presentation is Map) {
    return (presentation['flutter'] ?? presentation['web'] ?? fallback)
        .toString();
  }
  if (presentation is String) return presentation;
  return fallback;
}

/// Resolve layout from a filter config layout value
String resolveLayout(dynamic layout, {String fallback = 'inline'}) {
  if (layout is Map) {
    return (layout['flutter'] ?? layout['web'] ?? fallback).toString();
  }
  if (layout is String) return layout;
  return fallback;
}
