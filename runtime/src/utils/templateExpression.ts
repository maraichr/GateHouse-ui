export function evaluateTemplate(template: string, context: Record<string, any>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    const trimmed = expr.trim();
    const parts = trimmed.split('|').map((p: string) => p.trim());
    const path = parts[0];
    const filter = parts[1];

    const value = resolvePath(path, context);
    if (value == null) return '';

    if (filter === 'mask') {
      const str = String(value);
      if (str.length > 6) {
        return str.slice(0, 3) + '***' + str.slice(-4);
      }
      return '***';
    }
    if (filter === 'lowercase') return String(value).toLowerCase();
    if (filter === 'uppercase') return String(value).toUpperCase();
    if (filter === 'date') return formatDate(value);

    // Auto-format ISO datetime strings
    const str = String(value);
    if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
      return formatDate(str);
    }

    return str;
  });
}

function formatDate(value: any): string {
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return String(value);
  }
}

function resolvePath(path: string, context: Record<string, any>): any {
  const segments = path.split('.');
  let current: any = context;

  for (const seg of segments) {
    if (current == null) return null;
    current = current[seg];
  }

  return current;
}
