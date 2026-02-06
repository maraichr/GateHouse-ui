import { ReactNode } from 'react';
import { StringDisplay } from './display/StringDisplay';
import { EnumBadge } from './display/EnumBadge';
import { DateDisplay } from './display/DateDisplay';
import { CurrencyDisplay } from './display/CurrencyDisplay';
import { StarRating } from './display/StarRating';
import { Badge } from './display/Badge';
import { Avatar } from './display/Avatar';

// --- Layout passthroughs ---

export function Page({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <div>
      {title && <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>}
      {children}
    </div>
  );
}

export function TwoColumn({ children }: { children?: ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>;
}

export function FormStep({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function Header({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

// --- Display wrappers ---
// These wrap the existing display components so they can be registered as component kinds.

export function DisplayString(props: any) {
  return <StringDisplay value={props.value} sensitive={props.sensitive} mask_pattern={props.mask_pattern} />;
}

export function DisplayEnum(props: any) {
  return <EnumBadge value={props.value} values={props.values} />;
}

export function DisplayDate(props: any) {
  return <DateDisplay value={props.value} format={props.format} />;
}

export function DisplayCurrency(props: any) {
  return <CurrencyDisplay value={props.value} currency={props.currency} />;
}

export function DisplayStarRating(props: any) {
  return <StarRating value={props.value} />;
}

export function DisplayBadge(props: any) {
  return <Badge label={props.label || props.value || ''} color={props.color} />;
}

export function DisplayAvatar(props: any) {
  return <Avatar src={props.src || props.value} name={props.name} size={props.size} />;
}
