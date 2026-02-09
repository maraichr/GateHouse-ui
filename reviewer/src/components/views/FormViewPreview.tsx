import { FileText, Eye } from 'lucide-react';
import { Badge } from '../utility/Badge';
import type { FormView } from '../../types';

interface FormViewPreviewProps {
  formView: FormView;
  label: string;
}

export function FormViewPreview({ formView, label }: FormViewPreviewProps) {
  const isMultiStep = formView.steps && formView.steps.length > 0;

  return (
    <div className="space-y-4">
      {/* Header info */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
        <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">{label} Form</div>
        <div className="flex items-center gap-3 flex-wrap text-xs">
          <div>
            <span className="text-gray-500">Title: </span>
            <span className="font-medium text-gray-800">{formView.title}</span>
          </div>
          <Badge color="gray">{formView.layout}</Badge>
          {isMultiStep && <Badge color="blue">multi-step ({formView.steps!.length})</Badge>}
          {formView.submit_label && (
            <div>
              <span className="text-gray-500">Submit: </span>
              <span className="font-medium text-gray-800">"{formView.submit_label}"</span>
            </div>
          )}
          {formView.cancel_path && (
            <div>
              <span className="text-gray-500">Cancel → </span>
              <span className="font-mono text-gray-600">{formView.cancel_path}</span>
            </div>
          )}
        </div>
      </div>

      {/* Steps (multi-step wizard) */}
      {isMultiStep && (
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <FileText className="w-3.5 h-3.5" />
            Steps
          </div>
          <div className="space-y-2">
            {formView.steps!.map((step, i) => (
              <div key={step.id} className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-reviewer-100 text-reviewer-700 text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span className="text-xs font-medium text-gray-800">{step.title}</span>
                  <span className="text-xs font-mono text-gray-400">{step.id}</span>
                  {step.type && <Badge color="purple">{step.type}</Badge>}
                </div>
                {step.description && (
                  <p className="text-xs text-gray-500 ml-7 mb-1">{step.description}</p>
                )}
                {step.fields && step.fields.length > 0 && (
                  <div className="ml-7 text-xs text-gray-500 font-mono text-[11px]">
                    {step.fields.join(' · ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sections (single-page form) */}
      {formView.sections && formView.sections.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <FileText className="w-3.5 h-3.5" />
            Sections
          </div>
          <div className="space-y-2">
            {formView.sections.map((section, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-800">{section.title}</span>
                  {section.permissions && section.permissions.length > 0 && (
                    <div className="flex items-center gap-0.5">
                      <Eye className="w-3 h-3 text-purple-400" />
                      {section.permissions.map((p) => (
                        <Badge key={p} color="purple">{p}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                {section.fields.length > 0 && (
                  <div className="text-xs text-gray-500 font-mono text-[11px]">
                    {section.fields.join(' · ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Field overrides */}
      {formView.field_overrides && Object.keys(formView.field_overrides).length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Field Overrides</div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(formView.field_overrides).map(([field, override]) => (
              <div key={field} className="text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1">
                <span className="font-medium text-amber-800">{field}</span>
                <span className="text-amber-600 ml-1">
                  {Object.keys(override).join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
