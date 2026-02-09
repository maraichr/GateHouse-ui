import { apiGet } from './client';
import type { CoverageReport } from '../types';

export const getCoverage = (specId: string, versionId: string) =>
  apiGet<CoverageReport>(`/specs/${specId}/versions/${versionId}/coverage`);
