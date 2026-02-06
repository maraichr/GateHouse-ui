import { useQuery } from '@tanstack/react-query';
import { apiGet } from './apiClient';

export function useWidgetData(source?: string) {
  const enabled = !!source;

  // Parse source like "api:GET /dashboard/stats"
  let method = 'GET';
  let path = '';
  if (source) {
    const match = source.match(/^api:(?:(GET|POST)\s+)?(.+)$/i);
    if (match) {
      method = (match[1] || 'GET').toUpperCase();
      path = match[2];
    }
  }

  return useQuery({
    queryKey: ['widget-data', source],
    queryFn: () => apiGet<any>(path),
    enabled,
    staleTime: 30_000,
  });
}
