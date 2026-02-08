import { ReactNode } from 'react';

interface FormSectionProps {
  title?: string;
  children?: ReactNode;
}

export function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className="mb-6">
      {title && (
        <h3 className="text-lg font-medium mb-4 pb-2 border-b" style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)' }}>
          {title}
        </h3>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
