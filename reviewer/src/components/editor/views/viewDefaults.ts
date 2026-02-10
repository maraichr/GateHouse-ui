import type { Entity, ListView, DetailView, FormView } from '../../../types';

/**
 * Create a default list view from entity fields.
 * Uses first 5 non-hidden, non-primary-key fields as columns.
 */
export function createDefaultListView(entity: Entity): ListView {
  const visibleFields = (entity.fields || []).filter(
    (f) => !f.hidden && !f.primary_key && !f.generated,
  );
  const columnFields = visibleFields.slice(0, 5);

  return {
    columns: columnFields.map((f, i) => ({
      field: f.name,
      ...(i === 0 ? { link_to: 'detail' } : {}),
    })),
    default_sort: columnFields.length > 0
      ? { field: columnFields[0].name, order: 'asc' }
      : undefined,
  };
}

/**
 * Create a default detail view from entity fields.
 * Creates a tabbed layout with a single "Overview" tab containing all non-hidden fields.
 */
export function createDefaultDetailView(entity: Entity): DetailView {
  const visibleFields = (entity.fields || []).filter(
    (f) => !f.hidden && !f.primary_key,
  );

  const header: DetailView['header'] = {
    title: `{{${entity.label_field}}}`,
    ...(entity.status_field ? { status_badge: entity.status_field } : {}),
  };

  return {
    layout: 'tabbed',
    header,
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        icon: 'info',
        sections: [
          {
            title: 'Details',
            layout: 'grid',
            fields: visibleFields.map((f) => f.name),
          },
        ],
      },
    ],
  };
}

/**
 * Create a default form view (create or edit) from entity fields.
 * Groups required fields in first section, optional in second.
 */
export function createDefaultFormView(
  entity: Entity,
  isCreate: boolean,
): FormView {
  const editableFields = (entity.fields || []).filter(
    (f) => !f.hidden && !f.primary_key && !f.generated && !f.computed,
  );
  // For edit forms, also exclude immutable fields
  const fields = isCreate
    ? editableFields
    : editableFields.filter((f) => !f.immutable);

  const requiredFields = fields.filter((f) => f.required);
  const optionalFields = fields.filter((f) => !f.required);

  const sections = [];
  if (requiredFields.length > 0) {
    sections.push({
      title: 'Required Information',
      fields: requiredFields.map((f) => f.name),
    });
  }
  if (optionalFields.length > 0) {
    sections.push({
      title: 'Additional Details',
      fields: optionalFields.map((f) => f.name),
    });
  }
  if (sections.length === 0) {
    sections.push({ title: 'Details', fields: fields.map((f) => f.name) });
  }

  return {
    title: isCreate
      ? `Create ${entity.display_name}`
      : `Edit ${entity.display_name}`,
    layout: 'sectioned',
    submit_label: isCreate ? 'Create' : 'Save Changes',
    sections,
  };
}

/**
 * Count how many of the 4 views are configured on an entity.
 */
export function countConfiguredViews(entity: Entity): { configured: number; total: 4 } {
  let configured = 0;
  if (entity.views?.list) configured++;
  if (entity.views?.detail) configured++;
  if (entity.views?.create) configured++;
  if (entity.views?.edit) configured++;
  return { configured, total: 4 };
}
