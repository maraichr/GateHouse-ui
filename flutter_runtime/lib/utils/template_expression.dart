/// Evaluates template expressions like "{{record.company_name}}"
String evaluateTemplate(String template, Map<String, dynamic> record) {
  return template.replaceAllMapped(
    RegExp(r'\{\{([^}]+)\}\}'),
    (match) {
      final expr = match.group(1)!.trim();
      // Handle pipe operators like {{record.tax_id | mask}}
      final parts = expr.split('|').map((s) => s.trim()).toList();
      final path = parts[0];

      // Resolve dotted path: record.field or just field
      dynamic value;
      if (path.startsWith('record.')) {
        value = _resolvePath(record, path.substring(7));
      } else {
        value = _resolvePath(record, path);
      }

      var stringValue = value?.toString() ?? '';

      // Apply pipe transforms
      for (var i = 1; i < parts.length; i++) {
        final pipe = parts[i];
        switch (pipe) {
          case 'mask':
            // Simple mask: show first 2, mask rest
            if (stringValue.length > 4) {
              stringValue =
                  '${stringValue.substring(0, 2)}${'*' * (stringValue.length - 2)}';
            }
            break;
          case 'lowercase':
            stringValue = stringValue.toLowerCase();
            break;
          case 'uppercase':
            stringValue = stringValue.toUpperCase();
            break;
        }
      }
      return stringValue;
    },
  );
}

dynamic _resolvePath(Map<String, dynamic> data, String path) {
  final segments = path.split('.');
  dynamic current = data;
  for (final segment in segments) {
    if (current is Map<String, dynamic>) {
      current = current[segment];
    } else {
      return null;
    }
  }
  return current;
}
