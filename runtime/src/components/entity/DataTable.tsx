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
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DataTableProps {
  columns?: ListColumn[];
  entity?: string;
  fields?: Field[];
  data: any[];
  entityRoute?: string;
}

export function DataTable({ columns, fields, data, entityRoute }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const navigate = useNavigate();
  const fieldMap = useMemo(() => new Map(fields?.map((f) => [f.name, f]) || []), [fields]);

  const columnHelper = createColumnHelper<any>();

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
                  {display.map((v: any, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{String(v)}</span>
                  ))}
                  {remaining > 0 && (
                    <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-xs">+{remaining} more</span>
                  )}
                </div>
              );
            }
          }

          // Link to detail
          if (col.link_to === 'detail' && entityRoute) {
            return (
              <button
                onClick={() => navigate(`${entityRoute}/${info.row.original.id}`)}
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-left"
              >
                {String(value ?? '')}
              </button>
            );
          }

          // Reference display
          if (col.display_field) {
            return <StringDisplay value={info.row.original[col.display_field] ?? value} />;
          }

          return <StringDisplay value={value} sensitive={field?.sensitive} mask_pattern={field?.mask_pattern} />;
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
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                    header.column.getCanSort() && 'cursor-pointer hover:text-gray-700'
                  )}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && <ArrowUp className="h-3 w-3" />}
                    {header.column.getIsSorted() === 'desc' && <ArrowDown className="h-3 w-3" />}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
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
        <div className="py-8 text-center text-sm text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
}
