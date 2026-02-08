/// Converts PascalCase entity name to kebab-case API resource path.
/// "WorkOrder" → "work-orders"
/// "Subcontractor" → "subcontractors"
String entityToResource(String entityName) {
  // Split on uppercase boundaries
  final buffer = StringBuffer();
  for (var i = 0; i < entityName.length; i++) {
    final char = entityName[i];
    if (i > 0 && char.toUpperCase() == char && char.toLowerCase() != char) {
      buffer.write('-');
    }
    buffer.write(char.toLowerCase());
  }
  var result = buffer.toString();
  // Pluralize: simple 's' suffix
  if (!result.endsWith('s')) {
    result = '${result}s';
  }
  return result;
}
