import type { CSSProperties } from 'react';

/** Label text style for form fields */
export const labelStyle: CSSProperties = {
  color: 'var(--color-text-secondary)',
};

/** Standard input border + focus ring via CSS vars */
export const inputStyle: CSSProperties = {
  borderColor: 'var(--color-border)',
};

/** Input focus ring color — apply to the wrapping element or use as focus-within */
export const focusRingColor = 'var(--color-primary)';

/** Help text style (below field) */
export const helpStyle: CSSProperties = {
  color: 'var(--color-text-muted)',
};

/** Error text style */
export const errorStyle: CSSProperties = {
  color: 'var(--color-danger)',
};

/** Required indicator (*) style */
export const requiredMarkerStyle: CSSProperties = {
  color: 'var(--color-danger)',
};

/** Muted icon style (currency symbols, adornments) */
export const mutedIconStyle: CSSProperties = {
  color: 'var(--color-text-faint)',
};

/** Toolbar/toolbar background */
export const toolbarBgStyle: CSSProperties = {
  backgroundColor: 'var(--color-bg-alt)',
  borderColor: 'var(--color-border)',
};

/** Toolbar divider line */
export const toolbarDividerStyle: CSSProperties = {
  backgroundColor: 'var(--color-border)',
};

/** File list item background */
export const fileItemBgStyle: CSSProperties = {
  backgroundColor: 'var(--color-bg-alt)',
  color: 'var(--color-text-secondary)',
};

/** Drag zone active style */
export const dragActiveStyle: CSSProperties = {
  borderColor: 'var(--color-primary-400)',
  backgroundColor: 'var(--color-primary-50)',
};

/** Drag zone idle style */
export const dragIdleStyle: CSSProperties = {
  borderColor: 'var(--color-border)',
};

/** Shared input className (structural only, no colors) */
export const inputClassName = 'w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2';

/** Shared input focus ring className referencing CSS var */
export const inputFocusStyle: CSSProperties = {
  // Applied as inline style alongside inputClassName
  borderColor: 'var(--color-border)',
};
