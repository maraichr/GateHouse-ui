import { useQuery } from '@tanstack/react-query';
import { apiGet } from './apiClient';

function resolveDate(val: string): string {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  if (val === 'today') return todayStr;
  const match = val.match(/^today\s*\+\s*(\d+)d$/);
  if (match) {
    const future = new Date(today);
    future.setDate(future.getDate() + parseInt(match[1], 10));
    return future.toISOString().slice(0, 10);
  }
  return val;
}

interface UseEntityListOptions {
  apiResource: string;
  search?: string;
  filters?: Record<string, any>;
  sort?: { field: string; order: string };
  page?: number;
  pageSize?: number;
}

export function useEntityList({ apiResource, search, filters, sort, page = 1, pageSize = 25 }: UseEntityListOptions) {
  return useQuery({
    queryKey: ['entity-list', apiResource, search, filters, sort, page, pageSize],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: String(page),
        page_size: String(pageSize),
      };
      if (search) params.search = search;
      if (sort) {
        params.sort = sort.field;
        params.order = sort.order;
      }
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v === undefined || v === null || v === '') return;

          // Date range: { from, to } or { $gte, $lte }
          if (typeof v === 'object' && !Array.isArray(v) && (v.from || v.to || v.$gte || v.$lte)) {
            const from = v.from || v.$gte;
            const to = v.to || v.$lte;
            if (from) params[`filter[${k}][from]`] = resolveDate(String(from));
            if (to) params[`filter[${k}][to]`] = resolveDate(String(to));
            return;
          }

          // Numeric range: { min, max }
          if (typeof v === 'object' && !Array.isArray(v) && (v.min != null || v.max != null)) {
            if (v.min != null) params[`filter[${k}][min]`] = String(v.min);
            if (v.max != null) params[`filter[${k}][max]`] = String(v.max);
            return;
          }

          // Array (multi-select)
          if (Array.isArray(v)) {
            params[`filter[${k}]`] = v.join(',');
            return;
          }

          params[`filter[${k}]`] = String(v);
        });
      }
      return apiGet<{ data: any[]; total: number; page: number }>(apiResource, params);
    },
    placeholderData: (prev) => prev,
  });
}
