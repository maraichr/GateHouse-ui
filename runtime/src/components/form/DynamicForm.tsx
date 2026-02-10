import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../layout/PageHeader';
import { FormSection } from './FormSection';
import { StringField } from './fields/StringField';
import { EnumField } from './fields/EnumField';
import { DateField } from './fields/DateField';
import { ReferenceField } from './fields/ReferenceField';
import { CurrencyField } from './fields/CurrencyField';
import { AddressField } from './fields/AddressField';
import { FileField } from './fields/FileField';
import { ImageField } from './fields/ImageField';
import { JsonField } from './fields/JsonField';
import { useEntityCreate, useEntityUpdate } from '../../data/useEntityMutation';
import { useEntityDetail } from '../../data/useEntityDetail';
import { usePermissions } from '../../auth/usePermissions';
import { Field, ComponentNode, FormSectionConfig } from '../../types';
import type { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { flattenFields, getByPath, setByPath } from '../../utils/fieldPaths';

const LazyRichTextField = React.lazy(() =>
  import('./fields/RichTextField').then(m => ({ default: m.RichTextField }))
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormValues = Record<string, any>;

interface DynamicFormProps {
  entity?: string;
  api_resource?: string;
  title?: string;
  submit_label?: string;
  cancel_path?: string;
  fields?: Field[];
  overrides?: Record<string, Partial<Field>>;
  sections?: FormSectionConfig[];
  childNodes?: ComponentNode[];
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
  childNodes,
}: DynamicFormProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  // Fix 1: Fetch existing record for edit mode
  const { data: record, isLoading: isLoadingRecord } = useEntityDetail(
    api_resource || '',
    isEdit ? id : undefined,
  );

  const createMutation = useEntityCreate(api_resource || '');
  const updateMutation = useEntityUpdate(api_resource || '', id);

  const formFields = useMemo(() => {
    if (!fields) return [];
    return flattenFields(fields).filter((f) => {
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
      if (f.type === 'object') fieldSchema = z.record(z.any());
      if (f.type === 'array') fieldSchema = z.array(z.any());
      if (f.type === 'email') fieldSchema = z.string().email('Invalid email');
      if (f.min_length) fieldSchema = (fieldSchema as z.ZodString).min(f.min_length, `Minimum ${f.min_length} characters`);
      if (f.max_length) fieldSchema = (fieldSchema as z.ZodString).max(f.max_length, `Maximum ${f.max_length} characters`);
      if (f.pattern) fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(f.pattern), f.pattern_message || 'Invalid format');
      if (!f.required) fieldSchema = fieldSchema.optional();
      shape[f.name] = fieldSchema;
    }
    return z.object(shape);
  }, [formFields]);

  // Build default values from record for edit mode
  const defaultValues = useMemo(() => {
    if (!isEdit || !record) return {};
    const vals: FormValues = {};
    for (const f of formFields) {
      const pathValue = getByPath(record, f.name);
      if (pathValue !== undefined) vals[f.name] = pathValue;
    }
    return vals;
  }, [isEdit, record, formFields]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // Fix 1: Reset form when record loads in edit mode
  useEffect(() => {
    if (isEdit && record) {
      const vals: FormValues = {};
      for (const f of formFields) {
        const pathValue = getByPath(record, f.name);
        if (pathValue !== undefined) vals[f.name] = pathValue;
      }
      reset(vals);
    }
  }, [isEdit, record, formFields, reset]);

  const onSubmit = async (data: FormValues) => {
    let payload = data;
    const nestedFields = formFields.filter((f) => f.name.includes('.'));
    if (nestedFields.length > 0) {
      payload = { ...data };
      for (const f of nestedFields) {
        payload = setByPath(payload, f.name, data[f.name]);
        delete payload[f.name];
      }
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        toast.success('Changes saved');
        navigate(`${api_resource}/${id}`);
      } else {
        const result = await createMutation.mutateAsync(payload);
        toast.success('Created successfully');
        const newId = (result as Record<string, unknown>)?.id;
        if (newId) {
          navigate(`${api_resource}/${newId}`);
        } else if (cancel_path) {
          navigate(cancel_path);
        }
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  // Fix 4: Extract sections from childNodes if provided
  const sectionedFields = useMemo(() => {
    // Prefer childNodes (from renderer's CHILD_NODE_KINDS)
    if (childNodes?.length) {
      const sectionNodes = childNodes.filter((n) => n.kind === 'form_section');
      if (sectionNodes.length > 0) {
        return sectionNodes.map((n) => ({
          title: n.props?.title as string | undefined,
          fields: formFields.filter((f) => (n.props?.fields as string[])?.includes(f.name)),
          permissions: n.conditions?.find((c) => c.type === 'permission')?.roles,
        }));
      }
    }

    // Fallback to sections prop
    if (sections?.length) {
      return sections.map((s) => ({
        title: s.title,
        fields: formFields.filter((f) => s.fields?.includes(f.name)),
        permissions: s.permissions,
      }));
    }
    return [{ title: undefined, fields: formFields, permissions: undefined }];
  }, [childNodes, sections, formFields]);

  const { hasPermission } = usePermissions();

  // Show loading state while fetching record in edit mode
  if (isEdit && isLoadingRecord) {
    return (
      <div>
        <PageHeader title={title || `Edit ${entity}`} />
        <div className="max-w-2xl mx-auto p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 rounded w-1/4 mb-2" style={{ backgroundColor: 'var(--color-bg-alt, #e5e7eb)' }} />
                <div className="h-10 rounded" style={{ backgroundColor: 'var(--color-bg, #f3f4f6)' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
                    setValue={setValue}
                    watch={watch}
                  />
                ))}
              </FormSection>
            );
          })}

          <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border, #e5e7eb)' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 interactive-hover"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {isSubmitting ? 'Saving...' : submit_label || 'Save'}
            </button>
            {cancel_path && (
              <button
                type="button"
                onClick={() => navigate(cancel_path)}
                className="px-6 py-2 text-sm font-medium rounded-lg interactive-hover"
                style={{ color: 'var(--color-text-secondary, #374151)', border: '1px solid var(--color-border, #d1d5db)' }}
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
  setValue,
  watch,
}: {
  field: Field;
  register: UseFormRegister<FormValues>;
  errors: FieldErrors<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  watch: UseFormWatch<FormValues>;
}) {
  const error = errors[field.name]?.message as string | undefined;

  switch (field.type) {
    case 'enum':
      return <EnumField field={field} register={register} errors={errors} />;
    case 'date':
    case 'datetime':
      return <DateField field={field} register={register} errors={errors} />;
    case 'reference':
      return <ReferenceField field={field} register={register} errors={errors} />;
    case 'currency':
      return (
        <CurrencyField
          field={field}
          value={watch(field.name)}
          onChange={(v) => setValue(field.name, v, { shouldValidate: true })}
          error={error}
        />
      );
    case 'richtext':
      return (
        <React.Suspense fallback={<div className="animate-pulse rounded h-32" style={{ backgroundColor: 'var(--color-bg, #f3f4f6)' }} />}>
          <LazyRichTextField
            field={field}
            value={watch(field.name)}
            onChange={(v) => setValue(field.name, v, { shouldValidate: true })}
            error={error}
          />
        </React.Suspense>
      );
    case 'address':
      return (
        <AddressField
          field={field}
          value={watch(field.name)}
          onChange={(v) => setValue(field.name, v, { shouldValidate: true })}
          error={error}
        />
      );
    case 'file':
      return (
        <FileField
          field={field}
          value={watch(field.name)}
          onChange={(v) => setValue(field.name, v, { shouldValidate: true })}
          error={error}
        />
      );
    case 'image':
      return (
        <ImageField
          field={field}
          value={watch(field.name)}
          onChange={(v) => setValue(field.name, v, { shouldValidate: true })}
          error={error}
        />
      );
    case 'object':
    case 'array':
      return (
        <JsonField
          field={field}
          value={watch(field.name)}
          onChange={(v) => setValue(field.name, v, { shouldValidate: true })}
          error={error}
        />
      );
    default:
      return <StringField field={field} register={register} errors={errors} />;
  }
}
