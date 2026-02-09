import type { Entity, Field } from '../types';

/**
 * Infer show_in for a field by scanning entity views.
 * Mirrors the Go builder logic that determines where a field appears.
 */
export function inferShowIn(
  entity: Entity,
  field: Field,
): { list: boolean; detail: boolean; create: boolean; edit: boolean } {
  const result = { list: false, detail: false, create: false, edit: false };
  const name = field.name;

  // List: check columns
  if (entity.views?.list?.columns) {
    result.list = entity.views.list.columns.some((c) => c.field === name);
  }

  // Detail: check tabs/sections
  if (entity.views?.detail) {
    const dv = entity.views.detail;
    if (dv.tabs) {
      for (const tab of dv.tabs) {
        if (tab.sections) {
          for (const sec of tab.sections) {
            if (sec.fields?.includes(name)) {
              result.detail = true;
            }
          }
        }
      }
    }
    if (dv.left) {
      for (const sec of dv.left) {
        if (sec.fields?.includes(name)) {
          result.detail = true;
        }
      }
    }
    if (dv.right?.sections) {
      for (const sec of dv.right.sections) {
        if (sec.fields?.includes(name)) {
          result.detail = true;
        }
      }
    }
  }

  // Create: check form steps/sections
  if (entity.views?.create) {
    const fv = entity.views.create;
    if (fv.steps) {
      result.create = fv.steps.some((s) => s.fields?.includes(name));
    }
    if (fv.sections) {
      result.create = result.create || fv.sections.some((s) => s.fields.includes(name));
    }
  }

  // Edit: check form steps/sections
  if (entity.views?.edit) {
    const fv = entity.views.edit;
    if (fv.steps) {
      result.edit = fv.steps.some((s) => s.fields?.includes(name));
    }
    if (fv.sections) {
      result.edit = result.edit || fv.sections.some((s) => s.fields.includes(name));
    }
  }

  return result;
}
