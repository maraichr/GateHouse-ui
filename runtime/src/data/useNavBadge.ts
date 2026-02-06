import { useQuery } from '@tanstack/react-query';
import { apiGet } from './apiClient';
import { NavBadge } from '../types';

interface ListResponse {
  total?: number;
  data?: any[];
}

export function useNavBadge(badge?: NavBadge, apiResource?: string) {
  return useQuery({
    queryKey: ['nav-badge', apiResource, badge],
    queryFn: async (): Promise<number | null> => {
      if (!badge) return null;

      // Direct source endpoint
      if (badge.source) {
        const endpoint = badge.source.replace(/^api:/, '');
        const res = await apiGet<any>(endpoint);
        return typeof res === 'number' ? res : res?.count ?? res?.total ?? null;
      }

      // Count via list endpoint with filter
      if (badge.type === 'count' && apiResource) {
        const params: Record<string, string> = { page_size: '0' };
        if (badge.filter) {
          for (const [key, value] of Object.entries(badge.filter)) {
            params[`filter[${key}]`] = String(value);
          }
        }
        const res = await apiGet<ListResponse>(apiResource, params);
        return res?.total ?? null;
      }

      return null;
    },
    enabled: !!badge && (!!badge.source || (badge.type === 'count' && !!apiResource)),
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
