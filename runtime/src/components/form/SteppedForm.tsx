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
import { useEntityCreate } from '../../data/useEntityMutation';
import { Field } from '../../types';
import { cn } from '../../utils/cn';
import { Check } from 'lucide-react';

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
  children?: any;
}

export function SteppedForm({
  entity,
  api_resource,
  title,
  submit_label,
  cancel_path,
  fields,
  overrides,
  children,
}: SteppedFormProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const createMutation = useEntityCreate(api_resource || '');

  // Extract step configs from children nodes
  const steps = useMemo<StepConfig[]>(() => {
    if (!Array.isArray(children)) return [];
    return children
      .filter((c: any) => c?.props?.id)
      .map((c: any) => ({
        id: c.props.id,
        title: c.props.title || c.props.id,
        description: c.props.description,
        type: c.props.type,
        fields: c.props.fields,
      }));
  }, [children]);

  const fieldMap = useMemo(
    () => new Map(fields?.map((f) => [f.name, f]) || []),
    [fields]
  );

  const formFields = useMemo(() => {
    return (fields || [])
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

  const onSubmit = async (data: any) => {
    await createMutation.mutateAsync(data);
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
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                      i < currentStep
                        ? 'bg-blue-600 text-white'
                        : i === currentStep
                        ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-600'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className={cn(
                    'text-sm font-medium hidden sm:inline',
                    i === currentStep ? 'text-blue-700' : 'text-gray-500'
                  )}>
                    {step.title}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-4',
                    i < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  )} />
                )}
              </li>
            ))}
          </ol>
        </nav>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step content */}
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900">{currentStepConfig?.title}</h2>
            {currentStepConfig?.description && (
              <p className="mt-1 text-sm text-gray-500">{currentStepConfig.description}</p>
            )}
          </div>

          {isReview ? (
            <div className="space-y-4">
              {steps.filter((s) => s.type !== 'summary').map((step) => (
                <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">{step.title}</h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    {step.fields?.map((name) => {
                      const field = fieldMap.get(name);
                      const value = getValues(name);
                      return (
                        <div key={name}>
                          <dt className="text-gray-500">{field?.display_name || name}</dt>
                          <dd className="text-gray-900 font-medium">{value || '—'}</dd>
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
                <FieldRenderer key={field.name} field={field} register={register} errors={errors} />
              ))}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-gray-200">
            <div>
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-3">
              {cancel_path && (
                <button
                  type="button"
                  onClick={() => navigate(cancel_path)}
                  className="px-4 py-2 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              {isLastStep ? (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : submit_label || 'Submit'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldRenderer({ field, register, errors }: { field: Field; register: any; errors: any }) {
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
