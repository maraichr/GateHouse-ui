import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../layout/PageHeader';
import { FormSection } from './FormSection';
import { StringField } from './fields/StringField';
import { EnumField } from './fields/EnumField';
import { DateField } from './fields/DateField';
import { ReferenceField } from './fields/ReferenceField';
import { useEntityCreate, useEntityUpdate } from '../../data/useEntityMutation';
import { usePermissions } from '../../auth/usePermissions';
import { Field } from '../../types';

interface DynamicFormProps {
  entity?: string;
  api_resource?: string;
  title?: string;
  submit_label?: string;
  cancel_path?: string;
  fields?: Field[];
  overrides?: Record<string, Partial<Field>>;
  sections?: any[];
  children?: any;
}

export function DynamicForm({
  entity,
  api_resource,
  title,
  submit_label,
  cancel_path,
  fields,
  overrides,
  sections,
}: DynamicFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const createMutation = useEntityCreate(api_resource || '');
  const updateMutation = useEntityUpdate(api_resource || '', id);

  const formFields = useMemo(() => {
    if (!fields) return [];
    return fields.filter((f) => {
      if (f.hidden || f.primary_key) return false;
      if (f.computed || f.generated) return false;
      const showIn = f.show_in;
      if (!showIn) return true;
      return isEdit ? showIn.edit : showIn.create;
    }).map((f) => {
      if (overrides && overrides[f.name]) {
        return { ...f, ...overrides[f.name] };
      }
      return f;
    });
  }, [fields, overrides, isEdit]);

  const schema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const f of formFields) {
      let fieldSchema: z.ZodTypeAny = z.string();
      if (f.type === 'email') fieldSchema = z.string().email('Invalid email');
      if (f.min_length) fieldSchema = (fieldSchema as z.ZodString).min(f.min_length, `Minimum ${f.min_length} characters`);
      if (f.max_length) fieldSchema = (fieldSchema as z.ZodString).max(f.max_length, `Maximum ${f.max_length} characters`);
      if (f.pattern) fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(f.pattern), f.pattern_message || 'Invalid format');
      if (!f.required) fieldSchema = fieldSchema.optional();
      shape[f.name] = fieldSchema;
    }
    return z.object(shape);
  }, [formFields]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: any) => {
    if (isEdit) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
    if (cancel_path) navigate(cancel_path);
  };

  // Group fields by sections if sections are provided
  const sectionedFields = useMemo(() => {
    if (sections?.length) {
      return sections.map((s) => ({
        title: s.title,
        fields: formFields.filter((f) => s.fields?.includes(f.name)),
        permissions: s.permissions,
      }));
    }
    return [{ title: undefined, fields: formFields, permissions: undefined }];
  }, [sections, formFields]);

  const { hasPermission } = usePermissions();

  return (
    <div>
      <PageHeader title={title || (isEdit ? `Edit ${entity}` : `Create ${entity}`)} />
      <div className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {sectionedFields.map((section, si) => {
            if (section.permissions && !hasPermission(section.permissions)) return null;
            return (
              <FormSection key={si} title={section.title}>
                {section.fields.map((field) => (
                  <FieldRenderer
                    key={field.name}
                    field={field}
                    register={register}
                    errors={errors}
                  />
                ))}
              </FormSection>
            );
          })}

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : submit_label || 'Save'}
            </button>
            {cancel_path && (
              <button
                type="button"
                onClick={() => navigate(cancel_path)}
                className="px-6 py-2 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldRenderer({
  field,
  register,
  errors,
}: {
  field: Field;
  register: any;
  errors: any;
}) {
  switch (field.type) {
    case 'enum':
      return <EnumField field={field} register={register} errors={errors} />;
    case 'date':
    case 'datetime':
      return <DateField field={field} register={register} errors={errors} />;
    case 'reference':
      return <ReferenceField field={field} register={register} errors={errors} />;
    default:
      return <StringField field={field} register={register} errors={errors} />;
  }
}
