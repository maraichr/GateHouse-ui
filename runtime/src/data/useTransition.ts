import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from './apiClient';

interface TransitionPayload {
  comment?: string;
  [key: string]: any;
}

export function useTransition(apiResource: string, id: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, payload }: { name: string; payload?: TransitionPayload }) =>
      apiPost(`${apiResource}/${id}/transitions/${name}`, payload || {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-detail', apiResource, id] });
      queryClient.invalidateQueries({ queryKey: ['entity-list', apiResource] });
    },
  });
}
