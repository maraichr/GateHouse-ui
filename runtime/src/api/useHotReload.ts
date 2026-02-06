import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useHotReload() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource('/_renderer/events');

    eventSource.addEventListener('reload', () => {
      console.log('[HotReload] Spec updated, refetching...');
      queryClient.invalidateQueries({ queryKey: ['spec'] });
    });

    eventSource.addEventListener('error', (event) => {
      const data = (event as MessageEvent).data;
      if (data) {
        try {
          const parsed = JSON.parse(data);
          console.error('[HotReload] Error:', parsed.message);
        } catch {
          // SSE connection error, not a message
        }
      }
    });

    eventSource.addEventListener('connected', () => {
      console.log('[HotReload] Connected to renderer SSE');
    });

    eventSource.onerror = () => {
      // EventSource will auto-reconnect
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);
}
