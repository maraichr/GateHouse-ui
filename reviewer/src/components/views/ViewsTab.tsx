import { ListViewPreview } from './ListViewPreview';
import { DetailViewPreview } from './DetailViewPreview';
import { FormViewPreview } from './FormViewPreview';
import type { Entity } from '../../types';

interface ViewsTabProps {
  entity: Entity;
}

export function ViewsTab({ entity }: ViewsTabProps) {
  const { views } = entity;

  return (
    <div className="space-y-6">
      {views.list && (
        <section>
          <h3 className="font-semibold text-gray-900 mb-3">List View</h3>
          <ListViewPreview listView={views.list} entity={entity} />
        </section>
      )}
      {views.detail && (
        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Detail View</h3>
          <DetailViewPreview detailView={views.detail} />
        </section>
      )}
      {views.create && (
        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Create Form</h3>
          <FormViewPreview formView={views.create} label="Create" />
        </section>
      )}
      {views.edit && (
        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Edit Form</h3>
          <FormViewPreview formView={views.edit} label="Edit" />
        </section>
      )}
      {!views.list && !views.detail && !views.create && !views.edit && (
        <p className="text-sm text-gray-500">No views defined for this entity.</p>
      )}
    </div>
  );
}
