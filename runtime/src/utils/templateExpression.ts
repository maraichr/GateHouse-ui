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

    return String(value);
  });
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
