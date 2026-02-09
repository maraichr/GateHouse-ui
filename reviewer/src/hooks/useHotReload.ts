import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useHotReload() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const evtSource = new EventSource('/_renderer/events');
    evtSource.onmessage = () => {
      queryClient.invalidateQueries();
    };
    return () => evtSource.close();
  }, [queryClient]);
}
