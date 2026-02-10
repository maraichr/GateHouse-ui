import { apiGet, apiPost, apiPut, apiPatch, apiDelete, apiPostYaml } from './client';
import type {
  AppSpec,
  Spec,
  SpecVersion,
  SpecVersionSummary,
  SpecWithVersion,
  Annotation,
  Approval,
  AuditEntry,
  ReviewerUser,
} from '../types';

// Auth
export const getMe = () => apiGet<ReviewerUser>('/auth/me');

// Specs
export const listSpecs = () =>
  apiGet<{ specs: SpecWithVersion[] }>('/specs').then((r) => r.specs);

export const createSpec = (data: {
  app_name: string;
  display_name: string;
  description?: string;
  spec_data?: unknown;
  version?: string;
}) => apiPost<Spec>('/specs', data);

export const importSpecYaml = (yaml: string) =>
  apiPostYaml<{ spec: Spec; version: SpecVersion }>('/specs', yaml);

export const getSpec = (specId: string) =>
  apiGet<{ spec: Spec; latest_version: SpecVersion | null }>(`/specs/${specId}`);

export const deleteSpec = (specId: string) => apiDelete(`/specs/${specId}`);

export const getSpecComposition = (specId: string) =>
  apiGet<{ composition_id: string }>(`/specs/${specId}/composition`);

// Versions
export const listVersions = (specId: string, status?: string) => {
  const q = status ? `?status=${status}` : '';
  return apiGet<{ versions: SpecVersionSummary[] }>(
    `/specs/${specId}/versions${q}`,
  ).then((r) => r.versions);
};

export const createVersion = (
  specId: string,
  data: { version: string; spec_data: unknown; parent_id?: string; change_summary?: string },
) => apiPost<SpecVersion>(`/specs/${specId}/versions`, data);

export const getVersion = (specId: string, versionId: string) =>
  apiGet<SpecVersion>(`/specs/${specId}/versions/${versionId}`);

export const updateVersionStatus = (specId: string, versionId: string, status: string) =>
  apiPatch<SpecVersion>(`/specs/${specId}/versions/${versionId}/status`, { status });

export const exportVersion = (specId: string, versionId: string) =>
  fetch(`/_reviewer/specs/${specId}/versions/${versionId}/export`, {
    headers: { 'X-User-Email': localStorage.getItem('reviewer_user') || 'admin@gatehouse.local' },
  }).then((r) => r.text());

// Annotations
export const listAnnotations = (specId: string, versionId: string) =>
  apiGet<{ annotations: Annotation[] }>(
    `/specs/${specId}/versions/${versionId}/annotations`,
  ).then((r) => r.annotations);

export const createAnnotation = (
  specId: string,
  versionId: string,
  data: { element_path: string; element_type: string; body: string; state?: string; parent_id?: string },
) => apiPost<Annotation>(`/specs/${specId}/versions/${versionId}/annotations`, data);

export const updateAnnotation = (annotationId: string, state: string) =>
  apiPatch<Annotation>(`/annotations/${annotationId}`, { state });

export const deleteAnnotation = (annotationId: string) =>
  apiDelete(`/annotations/${annotationId}`);

// Approvals
export const listApprovals = (specId: string, versionId: string) =>
  apiGet<{ approvals: Approval[] }>(
    `/specs/${specId}/versions/${versionId}/approvals`,
  ).then((r) => r.approvals);

export const createApproval = (
  specId: string,
  versionId: string,
  data: { decision: string; notes?: string },
) => apiPost<Approval>(`/specs/${specId}/versions/${versionId}/approvals`, data);

// Users
export const listUsers = () =>
  apiGet<{ users: ReviewerUser[] }>('/users').then((r) => r.users);

export const createUser = (data: { email: string; display_name: string; role: string }) =>
  apiPost<ReviewerUser>('/users', data);

export const updateUser = (userId: string, role: string) =>
  apiPatch<ReviewerUser>(`/users/${userId}`, { role });

// Drafts
export const getDraft = (specId: string) =>
  apiGet<{ draft: AppSpec | null; updated_at: string | null }>(`/specs/${specId}/draft`);

export const saveDraft = (specId: string, draft: AppSpec) =>
  apiPut<{ status: string }>(`/specs/${specId}/draft`, draft);

export const discardDraft = (specId: string) =>
  apiDelete(`/specs/${specId}/draft`);

export const initDraft = (specId: string) =>
  apiPut<{ draft: AppSpec }>(`/specs/${specId}/draft/init`);

export const publishDraft = (specId: string, version?: string, changeSummary?: string) =>
  apiPost<{
    version: SpecVersion;
    warnings: string[];
    blocking_errors?: string[];
    parity_status?: 'pass' | 'warn' | 'fail';
  }>(`/specs/${specId}/publish`, {
    version,
    change_summary: changeSummary,
  });

// Mock Data Generation
export const generateMockData = (specId: string) =>
  fetch(`/_reviewer/specs/${specId}/generate-mock-data`, {
    method: 'POST',
    credentials: 'include',
  }).then((r) => {
    if (!r.ok) throw new Error(`Generation failed: ${r.status}`);
    return r.text();
  });

// Audit
export const listAudit = (specId: string) =>
  apiGet<{ audit: AuditEntry[] }>(`/specs/${specId}/audit`).then((r) => r.audit);

export const getTimeToFirstSpecKPI = () =>
  apiGet<{
    kpi: {
      projects_with_version: number;
      average_minutes: number;
      p50_minutes: number;
      p90_minutes: number;
    };
  }>('/kpi/time-to-first-spec').then((r) => r.kpi);
