import { useQuery } from '@tanstack/react-query';
import * as api from '../api/specs';
import { getCoverage } from '../api/coverage';

export function useSpecs() {
  return useQuery({ queryKey: ['specs'], queryFn: api.listSpecs });
}

export function useSpec(specId: string | undefined) {
  return useQuery({
    queryKey: ['spec', specId],
    queryFn: () => api.getSpec(specId!),
    enabled: !!specId,
  });
}

export function useVersions(specId: string | undefined, status?: string) {
  return useQuery({
    queryKey: ['versions', specId, status],
    queryFn: () => api.listVersions(specId!, status),
    enabled: !!specId,
  });
}

export function useVersion(specId: string | undefined, versionId: string | undefined) {
  return useQuery({
    queryKey: ['version', specId, versionId],
    queryFn: () => api.getVersion(specId!, versionId!),
    enabled: !!specId && !!versionId,
  });
}

export function useCoverage(specId: string | undefined, versionId: string | undefined) {
  return useQuery({
    queryKey: ['coverage', specId, versionId],
    queryFn: () => getCoverage(specId!, versionId!),
    enabled: !!specId && !!versionId,
  });
}

export function useAnnotations(specId: string | undefined, versionId: string | undefined) {
  return useQuery({
    queryKey: ['annotations', specId, versionId],
    queryFn: () => api.listAnnotations(specId!, versionId!),
    enabled: !!specId && !!versionId,
  });
}

export function useApprovals(specId: string | undefined, versionId: string | undefined) {
  return useQuery({
    queryKey: ['approvals', specId, versionId],
    queryFn: () => api.listApprovals(specId!, versionId!),
    enabled: !!specId && !!versionId,
  });
}

export function useAudit(specId: string | undefined) {
  return useQuery({
    queryKey: ['audit', specId],
    queryFn: () => api.listAudit(specId!),
    enabled: !!specId,
  });
}

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: api.getMe });
}
