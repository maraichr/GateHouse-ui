import { useQuery } from '@tanstack/react-query';
import { apiGet } from './apiClient';

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
        page_size: String(pageSize),
      };
      if (search) params.search = search;
      if (sort) {
        params.sort = sort.field;
        params.order = sort.order;
      }
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            params[`filter[${k}]`] = String(v);
          }
        });
      }
      return apiGet<{ data: any[]; total: number; page: number }>(apiResource, params);
    },
    placeholderData: (prev) => prev,
  });
}
