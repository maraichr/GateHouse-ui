import { ReactNode } from 'react';

interface FormSectionProps {
  title?: string;
  children?: ReactNode;
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="mb-6">
      {title && (
        <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
          {title}
        </h3>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
