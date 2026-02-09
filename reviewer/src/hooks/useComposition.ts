import { useQuery } from '@tanstack/react-query';
import * as api from '../api/compositions';

export function useCompositions() {
  return useQuery({ queryKey: ['compositions'], queryFn: api.listCompositions });
}

export function useComposition(compId: string | undefined) {
  return useQuery({
    queryKey: ['composition', compId],
    queryFn: () => api.getComposition(compId!),
    enabled: !!compId,
  });
}

export function useComposedSpec(compId: string | undefined) {
  return useQuery({
    queryKey: ['composed-spec', compId],
    queryFn: () => api.getComposedSpec(compId!),
    enabled: !!compId,
  });
}

export function useComposedCoverage(compId: string | undefined) {
  return useQuery({
    queryKey: ['composed-coverage', compId],
    queryFn: () => api.getComposedCoverage(compId!),
    enabled: !!compId,
  });
}
