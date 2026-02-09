import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="w-8" />
            <th
              className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              onClick={() => setSortBy('name')}
            >
              Field {sortBy === 'name' && '↑'}
            </th>
            <th
              className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              onClick={() => setSortBy('type')}
            >
              Type {sortBy === 'type' && '↑'}
            </th>
            <th
              className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
              onClick={() => setSortBy('required')}
            >
              Req {sortBy === 'required' && '↑'}
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Show In
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Flags
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {fields.map((field) => {
            const isExpanded = expandedField === field.name;
            const showIn = field.show_in || inferShowIn(entity, field);
            return (
              <FieldRow
                key={field.name}
                field={field}
                showIn={showIn}
                isExpanded={isExpanded}
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
  onToggle: () => void;
}

function FieldRow({ field, showIn, isExpanded, onToggle }: FieldRowProps) {
  return (
    <>
      <tr
        className="hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="pl-3 py-3 text-gray-400">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </td>
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900">{field.display_name || field.name}</div>
          <div className="text-xs text-gray-400 font-mono">{field.name}</div>
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
          <td colSpan={6} className="bg-gray-50 px-8 py-4">
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
        <h4 className="font-medium text-gray-700 mb-2">Details</h4>
        {field.help_text && (
          <div>
            <span className="text-gray-500">Help text:</span>{' '}
            <span className="text-gray-700">{field.help_text}</span>
          </div>
        )}
        {field.placeholder && (
          <div>
            <span className="text-gray-500">Placeholder:</span>{' '}
            <InlineCode>{field.placeholder}</InlineCode>
          </div>
        )}
        {field.default !== undefined && (
          <div>
            <span className="text-gray-500">Default:</span>{' '}
            <InlineCode>{JSON.stringify(field.default)}</InlineCode>
          </div>
        )}
        {field.format && (
          <div>
            <span className="text-gray-500">Format:</span>{' '}
            <InlineCode>{field.format}</InlineCode>
          </div>
        )}
        {field.entity && (
          <div>
            <span className="text-gray-500">Reference:</span>{' '}
            <Badge color="amber">{field.entity}</Badge>
            {field.display_field && <span className="text-gray-400 ml-1">→ {field.display_field}</span>}
          </div>
        )}
        {field.mask_pattern && (
          <div>
            <span className="text-gray-500">Mask:</span>{' '}
            <InlineCode>{field.mask_pattern}</InlineCode>
          </div>
        )}
      </div>

      {/* Constraints */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-700 mb-2">Constraints</h4>
        {(field.min_length || field.max_length) && (
          <div>
            <span className="text-gray-500">Length:</span>{' '}
            {field.min_length && <span>{field.min_length}</span>}
            {field.min_length && field.max_length && <span> – </span>}
            {field.max_length && <span>{field.max_length}</span>}
          </div>
        )}
        {(field.min !== undefined || field.max !== undefined) && (
          <div>
            <span className="text-gray-500">Range:</span>{' '}
            {field.min !== undefined && <span>{String(field.min)}</span>}
            {field.min !== undefined && field.max !== undefined && <span> – </span>}
            {field.max !== undefined && <span>{String(field.max)}</span>}
          </div>
        )}
        {field.pattern && (
          <div>
            <span className="text-gray-500">Pattern:</span>{' '}
            <InlineCode>{field.pattern}</InlineCode>
            {field.pattern_message && <span className="text-gray-400 text-xs ml-1">({field.pattern_message})</span>}
          </div>
        )}
        {field.precision !== undefined && (
          <div>
            <span className="text-gray-500">Precision:</span> {field.precision}
          </div>
        )}
        {field.future_only && (
          <div><Badge color="blue">Future dates only</Badge></div>
        )}

        {/* Permissions */}
        {field.permissions && (
          <div>
            <h4 className="font-medium text-gray-700 mt-3 mb-1">Permissions</h4>
            {field.permissions.view && (
              <div className="text-xs">View: {field.permissions.view.join(', ')}</div>
            )}
            {field.permissions.edit && (
              <div className="text-xs">Edit: {field.permissions.edit.join(', ')}</div>
            )}
          </div>
        )}
      </div>

      {/* Enum values */}
      {field.type === 'enum' && field.values && field.values.length > 0 && (
        <div className="col-span-full">
          <h4 className="font-medium text-gray-700 mb-2">Values</h4>
          <EnumValueList values={field.values} />
        </div>
      )}

      {/* Display rules */}
      {field.display_rules && field.display_rules.length > 0 && (
        <div className="col-span-full">
          <h4 className="font-medium text-gray-700 mb-2">Display Rules</h4>
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
