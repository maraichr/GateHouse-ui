import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as compApi from '../api/compositions';
import type { AppSpec, Composition, CompositionMember, ComposedSpecResponse } from '../types';

interface CompositionEditorContextValue {
  composition: Composition | null;
  members: CompositionMember[];
  hostSpecId: string;
  hostSpecName: string;
  activeSpecId: string;
  isHostSpec: boolean;
  isLoading: boolean;
  switchService: (specId: string) => void;
  activeServiceName: string | null;
  /** The fully composed/merged spec (all services aggregated) */
  composedSpec: AppSpec | null;
  /** Entity name → service name mapping */
  composedSources: Record<string, string>;
  /** Whether the composed spec is still loading */
  composedLoading: boolean;
  /** Mapping from spec_id → service_name for all members */
  specIdToServiceName: Record<string, string>;
  previewComposed: () => Promise<ComposedSpecResponse>;
}

const CompositionEditorContext = createContext<CompositionEditorContextValue | null>(null);

/**
 * Returns the composition editor context, or null if not inside a composition editor.
 * This allows MetadataEditor/EntityListEditor to work both standalone and in composition mode.
 */
export function useCompositionEditor(): CompositionEditorContextValue | null {
  return useContext(CompositionEditorContext);
}

interface CompositionEditorProviderProps {
  compId: string;
  initialSpecId?: string;
  children: (activeSpecId: string) => ReactNode;
}

export function CompositionEditorProvider({
  compId,
  initialSpecId,
  children,
}: CompositionEditorProviderProps) {
  const queryClient = useQueryClient();

  // Load composition metadata + members
  const { data, isLoading } = useQuery({
    queryKey: ['composition', compId],
    queryFn: () => compApi.getComposition(compId),
  });

  // Load the composed/merged spec (all services aggregated)
  const { data: composedData, isLoading: composedLoading } = useQuery({
    queryKey: ['composed-spec', compId],
    queryFn: () => compApi.getComposedSpec(compId),
    enabled: !!compId,
  });

  const composition = data?.composition ?? null;
  const members = data?.members ?? [];
  const hostSpecId = composition?.host_spec_id ?? '';
  const hostSpecName = data?.host_spec_name ?? '';

  const composedSpec = composedData?.composed_spec ?? null;
  const composedSources = composedData?.sources ?? {};

  // Build specId → serviceName lookup
  const specIdToServiceName: Record<string, string> = {};
  for (const m of members) {
    specIdToServiceName[m.spec_id] = m.service_name;
  }

  const [activeSpecId, setActiveSpecId] = useState(
    initialSpecId || hostSpecId
  );

  // Sync activeSpecId when composition loads for the first time
  if (!initialSpecId && activeSpecId === '' && hostSpecId) {
    setActiveSpecId(hostSpecId);
  }

  const effectiveSpecId = activeSpecId || hostSpecId;

  const isHostSpec = effectiveSpecId === hostSpecId;

  const activeServiceName = isHostSpec
    ? null
    : members.find((m) => m.spec_id === effectiveSpecId)?.service_name ?? null;

  const switchService = useCallback((specId: string) => {
    setActiveSpecId(specId);
  }, []);

  const previewComposed = useCallback(async () => {
    const result = await compApi.getComposedSpec(compId);
    queryClient.setQueryData(['composed-spec', compId], result);
    return result;
  }, [compId, queryClient]);

  const value: CompositionEditorContextValue = {
    composition,
    members,
    hostSpecId,
    hostSpecName,
    activeSpecId: effectiveSpecId,
    isHostSpec,
    isLoading,
    switchService,
    activeServiceName,
    composedSpec,
    composedSources,
    composedLoading,
    specIdToServiceName,
    previewComposed,
  };

  return (
    <CompositionEditorContext.Provider value={value}>
      {children(effectiveSpecId)}
    </CompositionEditorContext.Provider>
  );
}
