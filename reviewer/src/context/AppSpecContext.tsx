import { createContext, useContext } from 'react';
import { Outlet, useParams } from 'react-router';
import { useSpec, useCoverage } from '../hooks/useSpec';
import { useComposedSpec, useComposedCoverage } from '../hooks/useComposition';
import type { AppSpec, CoverageReport, ComposedCoverageReport } from '../types';

interface AppSpecContextValue {
  appSpec: AppSpec | null;
  specDisplayName: string;
  basePath: string;
  sources?: Record<string, string>;
  isComposition: boolean;
  isLoading: boolean;
  coverage: CoverageReport | ComposedCoverageReport | null;
  coverageLoading: boolean;
}

const AppSpecContext = createContext<AppSpecContextValue>({
  appSpec: null,
  specDisplayName: '',
  basePath: '',
  isComposition: false,
  isLoading: true,
  coverage: null,
  coverageLoading: true,
});

export function useAppSpecContext() {
  return useContext(AppSpecContext);
}

export function SpecLayout() {
  const { specId } = useParams<{ specId: string }>();
  const { data: specData, isLoading } = useSpec(specId);
  const latestVersion = specData?.latest_version;
  const { data: coverage, isLoading: coverageLoading } = useCoverage(specId, latestVersion?.id);

  const appSpec: AppSpec | null = latestVersion?.spec_data
    ? (typeof latestVersion.spec_data === 'string'
        ? JSON.parse(latestVersion.spec_data)
        : latestVersion.spec_data)
    : null;

  return (
    <AppSpecContext.Provider
      value={{
        appSpec,
        specDisplayName: specData?.spec.display_name ?? '',
        basePath: `/specs/${specId}`,
        isComposition: false,
        isLoading,
        coverage: coverage ?? null,
        coverageLoading,
      }}
    >
      <Outlet />
    </AppSpecContext.Provider>
  );
}

export function CompositionLayout() {
  const { compId } = useParams<{ compId: string }>();
  const { data: composedData, isLoading } = useComposedSpec(compId);
  const { data: coverage, isLoading: coverageLoading } = useComposedCoverage(compId);

  return (
    <AppSpecContext.Provider
      value={{
        appSpec: composedData?.composed_spec ?? null,
        specDisplayName: composedData?.host_name ? `${composedData.host_name} (Composed)` : 'Composition',
        basePath: `/compositions/${compId}`,
        sources: composedData?.sources,
        isComposition: true,
        isLoading,
        coverage: coverage ?? null,
        coverageLoading,
      }}
    >
      <Outlet />
    </AppSpecContext.Provider>
  );
}
