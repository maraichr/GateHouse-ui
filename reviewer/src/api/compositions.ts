import { apiGet, apiPost, apiPatch, apiDelete, apiPostYaml } from './client';
import type {
  Composition,
  CompositionWithInfo,
  CompositionMember,
  ComposedSpecResponse,
  ComposedCoverageReport,
} from '../types';

// Compositions
export const listCompositions = () =>
  apiGet<{ compositions: CompositionWithInfo[] }>('/compositions').then((r) => r.compositions);

export const createComposition = (data: {
  name: string;
  display_name: string;
  description?: string;
  host_spec_id: string;
}) => apiPost<Composition>('/compositions', data);

export const getComposition = (compId: string) =>
  apiGet<{
    composition: Composition;
    members: CompositionMember[];
    host_spec_name: string;
  }>(`/compositions/${compId}`);

export const deleteComposition = (compId: string) =>
  apiDelete(`/compositions/${compId}`);

// Composed spec + coverage
export const getComposedSpec = (compId: string) =>
  apiGet<ComposedSpecResponse>(`/compositions/${compId}/composed`);

export const getComposedCoverage = (compId: string) =>
  apiGet<ComposedCoverageReport>(`/compositions/${compId}/coverage`);

// Members
export const addMember = (
  compId: string,
  data: { spec_id: string; service_name: string; prefix?: string; nav_group?: string; nav_order?: number; optional?: boolean },
) => apiPost<CompositionMember>(`/compositions/${compId}/members`, data);

export const removeMember = (compId: string, memberId: string) =>
  apiDelete(`/compositions/${compId}/members/${memberId}`);

export const updateMember = (
  compId: string,
  memberId: string,
  data: { nav_group?: string; nav_order?: number; prefix?: string },
) => apiPatch<CompositionMember>(`/compositions/${compId}/members/${memberId}`, data);

// Export compose.yaml
export const exportComposition = (compId: string) =>
  fetch(`/_reviewer/compositions/${compId}/export`, {
    credentials: 'include',
  }).then((r) => {
    if (!r.ok) throw new Error(`Export failed: ${r.status}`);
    return r.text();
  });

// Import compose.yaml
export const importComposition = (yamlContent: string, baseDir?: string) => {
  const q = baseDir ? `?base_dir=${encodeURIComponent(baseDir)}` : '';
  return apiPostYaml<{
    composition: Composition;
    specs_created: number;
    members_created: number;
  }>(`/compositions/import${q}`, yamlContent);
};
