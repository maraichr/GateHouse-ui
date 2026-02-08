import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useHotReload() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource('/_renderer/events');

    eventSource.addEventListener('reload', () => {
      if (import.meta.env.DEV) console.log('[HotReload] Spec updated, refetching...');
      queryClient.invalidateQueries({ queryKey: ['spec'] });
    });

    eventSource.addEventListener('spec-changed', () => {
      if (import.meta.env.DEV) console.log('[HotReload] Example switched, refetching all...');
      queryClient.invalidateQueries();
    });

    eventSource.addEventListener('error', (event) => {
      const data = (event as MessageEvent).data;
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (import.meta.env.DEV) console.error('[HotReload] Error:', parsed.message);
        } catch {
          // SSE connection error, not a message
        }
      }
    });

    eventSource.addEventListener('connected', () => {
      if (import.meta.env.DEV) console.log('[HotReload] Connected to renderer SSE');
    });

    eventSource.onerror = () => {
      // EventSource will auto-reconnect
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);
}
