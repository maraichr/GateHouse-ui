import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../layout/PageHeader';
import { StringField } from './fields/StringField';
import { EnumField } from './fields/EnumField';
import { DateField } from './fields/DateField';
import { ReferenceField } from './fields/ReferenceField';
import { JsonField } from './fields/JsonField';
import { useEntityCreate } from '../../data/useEntityMutation';
import { Field, ComponentNode } from '../../types';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';
import { Button } from '../shared/Button';
import type { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { flattenFields, setByPath } from '../../utils/fieldPaths';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormValues = Record<string, any>;

interface StepConfig {
  id: string;
  title: string;
  description?: string;
  type?: string;
  fields?: string[];
}

interface SteppedFormProps {
  entity?: string;
  api_resource?: string;
  title?: string;
  submit_label?: string;
  cancel_path?: string;
  fields?: Field[];
  overrides?: Record<string, Partial<Field>>;
  childNodes?: ComponentNode[];
}

export function SteppedForm({
  entity,
  api_resource,
  title,
  submit_label,
  cancel_path,
  fields,
  overrides,
  childNodes,
}: SteppedFormProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const createMutation = useEntityCreate(api_resource || '');

  // Extract step configs from childNodes
  const steps = useMemo<StepConfig[]>(() => {
    if (!childNodes?.length) return [];
    return childNodes
      .filter((n) => n.kind === 'form_step' && n.props)
      .map((n) => ({
        id: n.props!.id as string || n.id || '',
        title: (n.props!.title as string) || (n.props!.id as string) || '',
        description: n.props!.description as string | undefined,
        type: n.props!.type as string | undefined,
        fields: n.props!.fields as string[] | undefined,
      }));
  }, [childNodes]);

  const fieldMap = useMemo(
    () => new Map(flattenFields(fields || []).map((f) => [f.name, f])),
    [fields]
  );

  const formFields = useMemo(() => {
    return flattenFields(fields || [])
      .filter((f) => !f.hidden && !f.primary_key && !f.computed && !f.generated)
      .filter((f) => !f.show_in || f.show_in.create)
      .map((f) => {
        if (overrides && overrides[f.name]) return { ...f, ...overrides[f.name] };
        return f;
      });
  }, [fields, overrides]);

  const schema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const f of formFields) {
      let fieldSchema: z.ZodTypeAny = z.string();
      if (f.type === 'object') fieldSchema = z.record(z.any());
      if (f.type === 'array') fieldSchema = z.array(z.any());
      if (f.type === 'email') fieldSchema = z.string().email();
      if (f.min_length) fieldSchema = (fieldSchema as z.ZodString).min(f.min_length);
      if (f.pattern) fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(f.pattern), f.pattern_message);
      if (!f.required) fieldSchema = fieldSchema.optional();
      shape[f.name] = fieldSchema;
    }
    return z.object(shape);
  }, [formFields]);

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const currentStepConfig = steps[currentStep];
  const isReview = currentStepConfig?.type === 'summary';
  const isLastStep = currentStep === steps.length - 1;

  const currentFields = useMemo(() => {
    if (!currentStepConfig?.fields) return [];
    return currentStepConfig.fields
      .map((name) => formFields.find((f) => f.name === name))
      .filter(Boolean) as Field[];
  }, [currentStepConfig, formFields]);

  const handleNext = async () => {
    if (currentStepConfig?.fields) {
      const valid = await trigger(currentStepConfig.fields);
      if (!valid) return;
    }
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

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
    await createMutation.mutateAsync(payload);
    if (cancel_path) navigate(cancel_path);
  };

  return (
    <div>
      <PageHeader title={title || `Create ${entity}`} />
      <div className="max-w-2xl mx-auto p-6">
        {/* Step indicator */}
        <nav className="mb-8">
          <ol className="flex items-center">
            {steps.map((step, i) => (
              <li key={step.id} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}>
                <div className="flex items-center gap-2">
                  <span
                    className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium"
                    style={
                      i < currentStep
                        ? { backgroundColor: 'var(--color-primary)', color: '#fff' }
                        : i === currentStep
                        ? {
                            backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                            color: 'var(--color-primary)',
                            boxShadow: '0 0 0 2px var(--color-primary)',
                          }
                        : { backgroundColor: 'var(--color-bg-alt)', color: 'var(--color-text-faint)' }
                    }
                  >
                    {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span
                    className="text-sm font-medium hidden sm:inline"
                    style={{ color: i === currentStep ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                  >
                    {step.title}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="flex-1 h-0.5 mx-4"
                    style={{ backgroundColor: i < currentStep ? 'var(--color-primary)' : 'var(--color-border)' }}
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step content */}
          <div className="mb-6">
            <h2 className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>{currentStepConfig?.title}</h2>
            {currentStepConfig?.description && (
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>{currentStepConfig.description}</p>
            )}
          </div>

          {isReview ? (
            <div className="space-y-4">
              {steps.filter((s) => s.type !== 'summary').map((step) => (
                <div key={step.id} className="surface-card p-4">
                  <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>{step.title}</h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    {step.fields?.map((name) => {
                      const field = fieldMap.get(name);
                      const value = getValues(name);
                      return (
                        <div key={name}>
                          <dt style={{ color: 'var(--color-text-muted)' }}>{field?.display_name || name}</dt>
                          <dd className="font-medium" style={{ color: 'var(--color-text)' }}>{value || '—'}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {currentFields.map((field) => (
                <FieldRenderer
                  key={field.name}
                  field={field}
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  watch={watch}
                />
              ))}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div>
              {currentStep > 0 && (
                <Button variant="outlined" color="neutral" type="button" onClick={handleBack}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              {cancel_path && (
                <Button variant="outlined" color="neutral" type="button" onClick={() => navigate(cancel_path)}>
                  Cancel
                </Button>
              )}
              {isLastStep ? (
                <Button variant="filled" color="primary" type="submit" loading={isSubmitting}>
                  {submit_label || 'Submit'}
                </Button>
              ) : (
                <Button variant="filled" color="primary" type="button" onClick={handleNext}>
                  Next
                </Button>
              )}
            </div>
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
