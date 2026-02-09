import type { AppSpec } from '../types';

export interface SearchEntry {
  type: 'entity' | 'field' | 'enum_value' | 'transition' | 'page' | 'nav_item' | 'permission';
  label: string;
  description: string;
  entityName?: string;
  path?: string;
}

export function buildSearchIndex(spec: AppSpec): SearchEntry[] {
  const entries: SearchEntry[] = [];

  // Entities
  for (const entity of spec.entities) {
    entries.push({
      type: 'entity',
      label: entity.display_name || entity.name,
      description: entity.description || `Entity: ${entity.name}`,
      entityName: entity.name,
    });

    // Fields
    for (const field of entity.fields) {
      entries.push({
        type: 'field',
        label: field.display_name || field.name,
        description: `${entity.display_name || entity.name} → ${field.type}${field.required ? ' (required)' : ''}`,
        entityName: entity.name,
      });

      // Enum values
      if (field.values) {
        for (const val of field.values) {
          const v = typeof val === 'string' ? val : (val as { value: string }).value;
          entries.push({
            type: 'enum_value',
            label: v,
            description: `${entity.display_name || entity.name}.${field.name} enum value`,
            entityName: entity.name,
          });
        }
      }
    }

    // Transitions
    if (entity.state_machine) {
      for (const t of entity.state_machine.transitions) {
        entries.push({
          type: 'transition',
          label: t.label || t.name,
          description: `${entity.display_name || entity.name}: ${t.from.join(',')} → ${t.to}`,
          entityName: entity.name,
        });
      }
    }
  }

  // Pages
  if (spec.pages) {
    for (const page of spec.pages) {
      entries.push({
        type: 'page',
        label: page.title,
        description: `Page: ${page.path}`,
        path: page.path,
      });
    }
  }

  // Nav items
  if (spec.navigation?.items) {
    const addNavItems = (items: typeof spec.navigation.items) => {
      for (const item of items) {
        entries.push({
          type: 'nav_item',
          label: item.label,
          description: `Nav: ${item.entity || item.page || item.path || ''}`,
        });
        if (item.children) addNavItems(item.children);
      }
    };
    addNavItems(spec.navigation.items);
  }

  // Roles from auth config
  if (spec.auth?.roles) {
    for (const [roleName, roleDef] of Object.entries(spec.auth.roles)) {
      entries.push({
        type: 'permission',
        label: roleName,
        description: `Role: ${roleDef.display_name || roleName}`,
      });
    }
  }

  return entries;
}

export function searchEntries(entries: SearchEntry[], query: string): SearchEntry[] {
  if (!query || query.length < 2) return [];
  const lower = query.toLowerCase();
  const results: SearchEntry[] = [];

  for (const entry of entries) {
    if (
      entry.label.toLowerCase().includes(lower) ||
      entry.description.toLowerCase().includes(lower)
    ) {
      results.push(entry);
    }
  }

  // Sort: exact prefix matches first, then by type priority
  const typePriority: Record<string, number> = {
    entity: 0,
    field: 1,
    transition: 2,
    page: 3,
    nav_item: 4,
    enum_value: 5,
    permission: 6,
  };

  results.sort((a, b) => {
    const aPrefix = a.label.toLowerCase().startsWith(lower) ? 0 : 1;
    const bPrefix = b.label.toLowerCase().startsWith(lower) ? 0 : 1;
    if (aPrefix !== bPrefix) return aPrefix - bPrefix;
    return (typePriority[a.type] ?? 99) - (typePriority[b.type] ?? 99);
  });

  return results.slice(0, 30);
}
