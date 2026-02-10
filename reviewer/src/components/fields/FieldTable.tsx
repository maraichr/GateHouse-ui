import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { TypeBadge } from './TypeBadge';
import { RequiredIndicator } from './RequiredIndicator';
import { ShowInMatrix } from './ShowInMatrix';
import { EnumValueList } from './EnumValueList';
import { DisplayRuleCard } from './DisplayRuleCard';
import { InlineCode } from '../utility/InlineCode';
import { Badge } from '../utility/Badge';
import { inferShowIn } from '../../utils/fieldAnalysis';
import type { Entity, Field, AppSpec } from '../../types';

interface FieldTableProps {
  entity: Entity;
  appSpec: AppSpec;
}

export function FieldTable({ entity, appSpec }: FieldTableProps) {
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'required'>('name');

  const fields = [...(entity.fields || [])].sort((a, b) => {
    if (sortBy === 'type') return a.type.localeCompare(b.type);
    if (sortBy === 'required') return (b.required ? 1 : 0) - (a.required ? 1 : 0);
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="surface-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-50 dark:bg-zinc-800/50 border-b border-surface-200 dark:border-zinc-800">
            <th className="w-8" />
            <th
              className="text-left px-4 py-3 text-xs font-medium text-surface-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-surface-700 dark:hover:text-zinc-200 transition-colors"
              onClick={() => setSortBy('name')}
              aria-sort={sortBy === 'name' ? 'ascending' : undefined}
            >
              Field {sortBy === 'name' && '↑'}
            </th>
            <th
              className="text-left px-4 py-3 text-xs font-medium text-surface-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-surface-700 dark:hover:text-zinc-200 transition-colors"
              onClick={() => setSortBy('type')}
              aria-sort={sortBy === 'type' ? 'ascending' : undefined}
            >
              Type {sortBy === 'type' && '↑'}
            </th>
            <th
              className="text-center px-4 py-3 text-xs font-medium text-surface-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-surface-700 dark:hover:text-zinc-200 transition-colors"
              onClick={() => setSortBy('required')}
              aria-sort={sortBy === 'required' ? 'ascending' : undefined}
            >
              Req {sortBy === 'required' && '↑'}
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 dark:text-zinc-400 uppercase tracking-wider">
              Show In
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 dark:text-zinc-400 uppercase tracking-wider">
              Flags
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100 dark:divide-zinc-800/50">
          {fields.map((field, i) => {
            const isExpanded = expandedField === field.name;
            const showIn = field.show_in || inferShowIn(entity, field);
            return (
              <FieldRow
                key={field.name}
                field={field}
                showIn={showIn}
                isExpanded={isExpanded}
                isStriped={i % 2 === 1}
                onToggle={() => setExpandedField(isExpanded ? null : field.name)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface FieldRowProps {
  field: Field;
  showIn: { list: boolean; detail: boolean; create: boolean; edit: boolean };
  isExpanded: boolean;
  isStriped: boolean;
  onToggle: () => void;
}

function FieldRow({ field, showIn, isExpanded, isStriped, onToggle }: FieldRowProps) {
  return (
    <>
      <tr
        className={clsx(
          'cursor-pointer transition-colors',
          isStriped ? 'bg-surface-50/50 dark:bg-zinc-800/20' : '',
          'hover:bg-brand-50/50 dark:hover:bg-brand-950/20',
        )}
        onClick={onToggle}
      >
        <td className="pl-3 py-3 text-surface-400 dark:text-zinc-500">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </td>
        <td className="px-4 py-3">
          <div className="font-medium text-surface-900 dark:text-zinc-100">{field.display_name || field.name}</div>
          <div className="text-xs text-surface-400 dark:text-zinc-500 font-mono">{field.name}</div>
        </td>
        <td className="px-4 py-3">
          <TypeBadge type={field.type} />
        </td>
        <td className="px-4 py-3 text-center">
          <RequiredIndicator required={field.required || false} />
        </td>
        <td className="px-4 py-3">
          <ShowInMatrix showIn={showIn} />
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-1 flex-wrap">
            {field.primary_key && <Badge color="amber">PK</Badge>}
            {field.sensitive && <Badge color="red">Sensitive</Badge>}
            {field.immutable && <Badge color="gray">Immutable</Badge>}
            {!!field.computed && <Badge color="blue">Computed</Badge>}
            {field.searchable && <Badge color="indigo">Search</Badge>}
            {field.filterable && <Badge color="purple">Filter</Badge>}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={6} className="bg-surface-50 dark:bg-zinc-800/30 px-8 py-4">
            <FieldDetail field={field} />
          </td>
        </tr>
      )}
    </>
  );
}

function FieldDetail({ field }: { field: Field }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm animate-fade-in">
      {/* Basic info */}
      <div className="space-y-2">
        <h4 className="font-medium text-surface-700 dark:text-zinc-300 mb-2">Details</h4>
        {field.help_text && (
          <div>
            <span className="text-surface-500 dark:text-zinc-400">Help text:</span>{' '}
            <span className="text-surface-700 dark:text-zinc-300">{field.help_text}</span>
          </div>
        )}
        {field.placeholder && (
          <div>
            <span className="text-surface-500 dark:text-zinc-400">Placeholder:</span>{' '}
            <InlineCode>{field.placeholder}</InlineCode>
          </div>
        )}
        {field.default !== undefined && (
          <div>
            <span className="text-surface-500 dark:text-zinc-400">Default:</span>{' '}
            <InlineCode>{JSON.stringify(field.default)}</InlineCode>
          </div>
        )}
        {field.format && (
          <div>
            <span className="text-surface-500 dark:text-zinc-400">Format:</span>{' '}
            <InlineCode>{field.format}</InlineCode>
          </div>
        )}
        {field.entity && (
          <div>
            <span className="text-surface-500 dark:text-zinc-400">Reference:</span>{' '}
            <Badge color="amber">{field.entity}</Badge>
            {field.display_field && <span className="text-surface-400 dark:text-zinc-500 ml-1">→ {field.display_field}</span>}
          </div>
        )}
        {field.mask_pattern && (
          <div>
            <span className="text-surface-500 dark:text-zinc-400">Mask:</span>{' '}
            <InlineCode>{field.mask_pattern}</InlineCode>
          </div>
        )}
      </div>

      {/* Constraints */}
      <div className="space-y-2">
        <h4 className="font-medium text-surface-700 dark:text-zinc-300 mb-2">Constraints</h4>
        {(field.min_length || field.max_length) && (
          <div>
            <span className="text-surface-500 dark:text-zinc-400">Length:</span>{' '}
            {field.min_length && <span>{field.min_length}</span>}
            {field.min_length && field.max_length && <span> – </span>}
            {field.max_length && <span>{field.max_length}</span>}
          </div>
        )}
        {(field.min !== undefined || field.max !== undefined) && (
          <div>
            <span className="text-surface-500 dark:text-zinc-400">Range:</span>{' '}
            {field.min !== undefined && <span>{String(field.min)}</span>}
            {field.min !== undefined && field.max !== undefined && <span> – </span>}
            {field.max !== undefined && <span>{String(field.max)}</span>}
          </div>
        )}
        {field.pattern && (
          <div>
            <span className="text-surface-500 dark:text-zinc-400">Pattern:</span>{' '}
            <InlineCode>{field.pattern}</InlineCode>
            {field.pattern_message && <span className="text-surface-400 dark:text-zinc-500 text-xs ml-1">({field.pattern_message})</span>}
          </div>
        )}
        {field.precision !== undefined && (
          <div>
            <span className="text-surface-500 dark:text-zinc-400">Precision:</span> {field.precision}
          </div>
        )}
        {field.future_only && (
          <div><Badge color="blue">Future dates only</Badge></div>
        )}

        {/* Permissions */}
        {field.permissions && (
          <div>
            <h4 className="font-medium text-surface-700 dark:text-zinc-300 mt-3 mb-1">Permissions</h4>
            {field.permissions.view && (
              <div className="text-xs text-surface-600 dark:text-zinc-400">View: {field.permissions.view.join(', ')}</div>
            )}
            {field.permissions.edit && (
              <div className="text-xs text-surface-600 dark:text-zinc-400">Edit: {field.permissions.edit.join(', ')}</div>
            )}
          </div>
        )}
      </div>

      {/* Enum values */}
      {field.type === 'enum' && field.values && field.values.length > 0 && (
        <div className="col-span-full">
          <h4 className="font-medium text-surface-700 dark:text-zinc-300 mb-2">Values</h4>
          <EnumValueList values={field.values} />
        </div>
      )}

      {/* Display rules */}
      {field.display_rules && field.display_rules.length > 0 && (
        <div className="col-span-full">
          <h4 className="font-medium text-surface-700 dark:text-zinc-300 mb-2">Display Rules</h4>
          <div className="space-y-2">
            {field.display_rules.map((rule, i) => (
              <DisplayRuleCard key={i} rule={rule} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
