import { useQuery } from '@tanstack/react-query';
import { apiGet } from './apiClient';

export function useEntityDetail(apiResource: string, id: string | undefined) {
  return useQuery({
    queryKey: ['entity-detail', apiResource, id],
    queryFn: () => apiGet<any>(`${apiResource}/${id}`),
    enabled: !!id,
  });
}
