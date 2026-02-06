import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost, apiPatch } from './apiClient';

export function useEntityCreate(apiResource: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, any>) => apiPost(apiResource, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-list', apiResource] });
    },
  });
}

export function useEntityUpdate(apiResource: string, id: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, any>) => apiPatch(`${apiResource}/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-list', apiResource] });
      queryClient.invalidateQueries({ queryKey: ['entity-detail', apiResource, id] });
    },
  });
}
