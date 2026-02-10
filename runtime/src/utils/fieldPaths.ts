import type { Field } from '../types';

function toSegments(path: string): string[] {
  return path
    .replace(/\[\]/g, '')
    .split('.')
    .filter(Boolean);
}

export function getByPath(record: Record<string, any> | undefined, path: string): any {
  if (!record || !path) return undefined;
  return toSegments(path).reduce<any>((acc, seg) => {
    if (acc == null) return undefined;
    return acc[seg];
  }, record);
}

export function setByPath(target: Record<string, any>, path: string, value: any): Record<string, any> {
  const segments = toSegments(path);
  if (segments.length === 0) return target;

  const result: Record<string, any> = { ...target };
  let cur: Record<string, any> = result;

  for (let i = 0; i < segments.length - 1; i += 1) {
    const seg = segments[i];
    const next = cur[seg];
    cur[seg] = next && typeof next === 'object' ? { ...next } : {};
    cur = cur[seg];
  }

  cur[segments[segments.length - 1]] = value;
  return result;
}

export function flattenFields(fields: Field[] = [], prefix = ''): Field[] {
  const flat: Field[] = [];

  for (const field of fields) {
    const path = prefix ? `${prefix}.${field.name}` : field.name;
    flat.push({ ...field, path, name: path });

    if (field.type === 'object' && Array.isArray(field.fields) && field.fields.length > 0) {
      flat.push(...flattenFields(field.fields, path));
    }
  }

  return flat;
}
