import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListColumn, Field } from '../../types';
import { EnumBadge } from '../display/EnumBadge';
import { DateDisplay } from '../display/DateDisplay';
import { StarRating } from '../display/StarRating';
import { CurrencyDisplay } from '../display/CurrencyDisplay';
import { StringDisplay } from '../display/StringDisplay';
import { Avatar } from '../display/Avatar';
import { evaluateDisplayRules, styleForRule } from '../../utils/displayRuleEvaluator';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DataTableProps {
  columns?: ListColumn[];
  entity?: string;
  fields?: Field[];
  data: Record<string, any>[];
  entityRoute?: string;
}

export function DataTable({ columns, fields, data, entityRoute }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const navigate = useNavigate();
  const fieldMap = useMemo(() => new Map(fields?.map((f) => [f.name, f]) || []), [fields]);

  const columnHelper = createColumnHelper<Record<string, any>>();

  const tableCols = useMemo(() => {
    return (columns || []).map((col) => {
      const field = fieldMap.get(col.field);

      return columnHelper.accessor((row) => row[col.field], {
        id: col.field,
        header: () => field?.display_name || col.field,
        cell: (info) => {
          const value = info.getValue();

          // Render based on field type
          if (field?.type === 'image' || field?.display_as === 'avatar') {
            return <Avatar src={value} name={info.row.original.company_name} size="sm" />;
          }
          if (field?.type === 'enum') {
            return <EnumBadge value={value} values={field.values} />;
          }
          if (field?.type === 'datetime' || field?.type === 'date') {
            return <DateDisplay value={value} format={field.format} />;
          }
          if (field?.display_as === 'star_rating') {
            return <StarRating value={value} />;
          }
          if (field?.type === 'currency') {
            return <CurrencyDisplay value={value} currency={field.currency} />;
          }
          if (field?.type === 'array') {
            if (Array.isArray(value)) {
              const display = value.slice(0, col.max_display || 3);
              const remaining = value.length - display.length;
              return (
                <div className="flex gap-1 flex-wrap">
                  {display.map((v: unknown, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--color-bg-alt, #f3f4f6)' }}>{String(v)}</span>
                  ))}
                  {remaining > 0 && (
                    <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--color-bg, #f9fafb)', color: 'var(--color-text-muted, #6b7280)' }}>+{remaining} more</span>
                  )}
                </div>
              );
            }
          }

          // Link to detail (handle link_to as object {type:"route"} or string "detail")
          const isDetailLink = col.link_to === 'detail' ||
            (typeof col.link_to === 'object' && (col.link_to as { type?: string })?.type === 'route');
          if (isDetailLink && entityRoute) {
            return (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`${entityRoute}/${info.row.original.id}`); }}
                className="hover:underline font-medium text-left"
                style={{ color: 'var(--color-primary)' }}
              >
                {String(value ?? '')}
              </button>
            );
          }

          // Reference display
          if (col.display_field) {
            return <StringDisplay value={info.row.original[col.display_field] ?? value} />;
          }

          // Apply display rule styling if defined
          const ruleResult = evaluateDisplayRules(field?.display_rules, value);
          if (ruleResult) {
            return (
              <span style={styleForRule(ruleResult.style)} title={ruleResult.tooltip}>
                {ruleResult.label || <StringDisplay value={value} sensitive={field?.sensitive} mask_pattern={field?.mask_pattern} />}
              </span>
            );
          }

          return <StringDisplay value={value} sensitive={field?.sensitive} mask_pattern={field?.mask_pattern} input_type={field?.input_type} />;
        },
        enableSorting: field?.sortable ?? false,
        size: typeof col.width === 'number' ? col.width : undefined,
      });
    });
  }, [columns, fieldMap, columnHelper, entityRoute, navigate]);

  const table = useReactTable({
    data,
    columns: tableCols,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto surface-card">
      <table className="min-w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead style={{ backgroundColor: 'var(--color-bg)' }}>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider',
                    header.column.getCanSort() && 'cursor-pointer'
                  )}
                  style={{ color: 'var(--color-text-muted, #6b7280)', borderBottom: '1px solid var(--color-border, #e5e7eb)' }}
                  aria-sort={
                    header.column.getIsSorted() === 'asc' ? 'ascending' :
                    header.column.getIsSorted() === 'desc' ? 'descending' :
                    header.column.getCanSort() ? 'none' : undefined
                  }
                >
                  <div className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && <ArrowUp className="h-3 w-3" aria-hidden="true" />}
                    {header.column.getIsSorted() === 'desc' && <ArrowDown className="h-3 w-3" aria-hidden="true" />}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody style={{ backgroundColor: 'var(--color-surface)' }}>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="transition-colors" style={{ borderBottom: '1px solid var(--color-border, #e5e7eb)', cursor: entityRoute ? 'pointer' : undefined }}
              onClick={() => {
                if (entityRoute) {
                  const id = row.original.id;
                  if (id != null) navigate(`${entityRoute}/${id}`);
                }
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg, #f9fafb)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-sm whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted, #6b7280)' }}>
          No data available
        </div>
      )}
    </div>
  );
}
