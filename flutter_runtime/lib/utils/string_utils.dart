// Shared string utilities for humanizing identifiers.

/// Converts kebab-case or snake_case to Title Case.
/// e.g. "work-orders" → "Work Orders", "created_at" → "Created At"
String humanize(String text) {
  return text
      .replaceAll(RegExp(r'[-_]'), ' ')
      .replaceAllMapped(
          RegExp(r'(^|\s)\w'), (m) => m[0]!.toUpperCase());
}

/// Converts PascalCase to spaced Title Case.
/// e.g. "WorkOrder" → "Work Order"
String humanizePascal(String text) {
  return text
      .replaceAllMapped(
          RegExp(r'([a-z])([A-Z])'), (m) => '${m[1]} ${m[2]}')
      .replaceAllMapped(RegExp(r'^.'), (m) => m[0]!.toUpperCase());
}
