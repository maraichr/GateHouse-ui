import { ReactNode } from 'react';

// Field wrapper components for form field kinds.
// These are rendered inside DynamicForm/SteppedForm and simply pass through children.
// The actual field rendering is handled by the form components themselves.

function FieldWrapper({ label, children }: { label?: string; children?: ReactNode }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</label>}
      {children}
    </div>
  );
}

export function FieldString(props: any) {
  return <FieldWrapper label={props.display_name}>{props.children}</FieldWrapper>;
}

export function FieldEnum(props: any) {
  return <FieldWrapper label={props.display_name}>{props.children}</FieldWrapper>;
}

export function FieldDate(props: any) {
  return <FieldWrapper label={props.display_name}>{props.children}</FieldWrapper>;
}

export function FieldReference(props: any) {
  return <FieldWrapper label={props.display_name}>{props.children}</FieldWrapper>;
}

export function FieldCurrency(props: any) {
  return <FieldWrapper label={props.display_name}>{props.children}</FieldWrapper>;
}

export function FieldRichtext(props: any) {
  return <FieldWrapper label={props.display_name}>{props.children}</FieldWrapper>;
}

export function FieldAddress(props: any) {
  return <FieldWrapper label={props.display_name}>{props.children}</FieldWrapper>;
}
