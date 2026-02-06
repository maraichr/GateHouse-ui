import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ComponentTree } from '../types';
import { fetchSpec } from '../api/specClient';

interface SpecContextValue {
  tree: ComponentTree | null;
  isLoading: boolean;
  error: Error | null;
}

const SpecContext = createContext<SpecContextValue>({
  tree: null,
  isLoading: true,
  error: null,
});

export function SpecProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['spec'],
    queryFn: fetchSpec,
    staleTime: Infinity,
  });

  return (
    <SpecContext.Provider value={{ tree: data ?? null, isLoading, error: error as Error | null }}>
      {children}
    </SpecContext.Provider>
  );
}

export function useSpec() {
  return useContext(SpecContext);
}
