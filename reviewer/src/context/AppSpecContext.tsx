import { createContext, useContext } from 'react';
import { Outlet, useParams } from 'react-router';
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

export function CompositionLayout() {
  const { compId } = useParams<{ compId: string }>();
  const { data: composedData, isLoading } = useComposedSpec(compId);
  const { data: coverage, isLoading: coverageLoading } = useComposedCoverage(compId);

  return (
    <AppSpecContext.Provider
      value={{
        appSpec: composedData?.composed_spec ?? null,
        specDisplayName: composedData?.host_name ? `${composedData.host_name} (Composed)` : 'Composition',
        basePath: `/projects/${compId}`,
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
