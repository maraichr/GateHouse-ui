import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/specs';
import type { AppSpec, Entity, Field, NavItem, Page } from '../types';

// --- State ---

interface DraftState {
  spec: AppSpec | null;
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;
  lastSavedAt: Date | null;
  error: string | null;
}

const initialState: DraftState = {
  spec: null,
  isDirty: false,
  isSaving: false,
  isLoading: true,
  lastSavedAt: null,
  error: null,
};

// --- Actions ---

type DraftAction =
  | { type: 'SET_SPEC'; spec: AppSpec }
  | { type: 'UPDATE_SPEC'; updater: (spec: AppSpec) => AppSpec }
  | { type: 'MARK_SAVING' }
  | { type: 'MARK_SAVED' }
  | { type: 'MARK_CLEAN' }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null };

function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'SET_SPEC':
      return { ...state, spec: action.spec, isDirty: false, isLoading: false, error: null };
    case 'UPDATE_SPEC':
      if (!state.spec) return state;
      return { ...state, spec: action.updater(state.spec), isDirty: true };
    case 'MARK_SAVING':
      return { ...state, isSaving: true };
    case 'MARK_SAVED':
      return { ...state, isSaving: false, isDirty: false, lastSavedAt: new Date(), error: null };
    case 'MARK_CLEAN':
      return { ...state, isDirty: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.loading };
    case 'SET_ERROR':
      return { ...state, isSaving: false, error: action.error };
    default:
      return state;
  }
}

// --- Context ---

interface DraftEditorContextValue extends DraftState {
  updateSpec: (updater: (spec: AppSpec) => AppSpec) => void;
  updateEntity: (index: number, entity: Entity) => void;
  addEntity: (entity: Entity) => void;
  removeEntity: (index: number) => void;
  addField: (entityIndex: number, field: Field) => void;
  removeField: (entityIndex: number, fieldIndex: number) => void;
  updateField: (entityIndex: number, fieldIndex: number, field: Field) => void;
  updateNavItem: (index: number, item: NavItem) => void;
  addNavItem: (item: NavItem) => void;
  removeNavItem: (index: number) => void;
  addPage: (page: Page) => void;
  removePage: (index: number) => void;
  updatePage: (index: number, page: Page) => void;
  save: () => Promise<void>;
  publish: (version?: string, summary?: string) => Promise<{
    warnings: string[];
    blockingErrors: string[];
    parityStatus: 'pass' | 'warn' | 'fail';
  }>;
  discard: () => Promise<void>;
}

const DraftEditorContext = createContext<DraftEditorContextValue | null>(null);

export function useDraftEditor() {
  const ctx = useContext(DraftEditorContext);
  if (!ctx) throw new Error('useDraftEditor must be used inside DraftEditorProvider');
  return ctx;
}

// --- Provider ---

interface DraftEditorProviderProps {
  specId: string;
  children: ReactNode;
}

export function DraftEditorProvider({ specId, children }: DraftEditorProviderProps) {
  const [state, dispatch] = useReducer(draftReducer, initialState);
  const queryClient = useQueryClient();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const specRef = useRef(state.spec);
  specRef.current = state.spec;

  // Load draft on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { draft } = await api.getDraft(specId);
        if (cancelled) return;
        if (draft) {
          dispatch({ type: 'SET_SPEC', spec: draft });
        } else {
          // No draft — try to initialize from latest version
          const result = await api.initDraft(specId);
          if (cancelled) return;
          dispatch({ type: 'SET_SPEC', spec: result.draft });
        }
      } catch {
        if (cancelled) return;
        dispatch({ type: 'SET_ERROR', error: 'Failed to load draft' });
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    })();
    return () => { cancelled = true; };
  }, [specId]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (draft: AppSpec) => api.saveDraft(specId, draft),
    onMutate: () => dispatch({ type: 'MARK_SAVING' }),
    onSuccess: () => dispatch({ type: 'MARK_SAVED' }),
    onError: (err: Error) => dispatch({ type: 'SET_ERROR', error: err.message }),
  });

  // Auto-save with 2s debounce
  useEffect(() => {
    if (!state.isDirty || !state.spec) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (specRef.current) saveMutation.mutate(specRef.current);
    }, 2000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state.isDirty, state.spec]);

  const save = useCallback(async () => {
    if (!specRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveMutation.mutate(specRef.current);
  }, [saveMutation]);

  const updateSpec = useCallback((updater: (spec: AppSpec) => AppSpec) => {
    dispatch({ type: 'UPDATE_SPEC', updater });
  }, []);

  const updateEntity = useCallback((index: number, entity: Entity) => {
    updateSpec((s) => {
      const entities = [...s.entities];
      entities[index] = entity;
      return { ...s, entities };
    });
  }, [updateSpec]);

  const addEntity = useCallback((entity: Entity) => {
    updateSpec((s) => ({ ...s, entities: [...s.entities, entity] }));
  }, [updateSpec]);

  const removeEntity = useCallback((index: number) => {
    updateSpec((s) => ({
      ...s,
      entities: s.entities.filter((_, i) => i !== index),
    }));
  }, [updateSpec]);

  const addField = useCallback((entityIndex: number, field: Field) => {
    updateSpec((s) => {
      const entities = [...s.entities];
      entities[entityIndex] = {
        ...entities[entityIndex],
        fields: [...entities[entityIndex].fields, field],
      };
      return { ...s, entities };
    });
  }, [updateSpec]);

  const removeField = useCallback((entityIndex: number, fieldIndex: number) => {
    updateSpec((s) => {
      const entities = [...s.entities];
      entities[entityIndex] = {
        ...entities[entityIndex],
        fields: entities[entityIndex].fields.filter((_, i) => i !== fieldIndex),
      };
      return { ...s, entities };
    });
  }, [updateSpec]);

  const updateField = useCallback((entityIndex: number, fieldIndex: number, field: Field) => {
    updateSpec((s) => {
      const entities = [...s.entities];
      const fields = [...entities[entityIndex].fields];
      fields[fieldIndex] = field;
      entities[entityIndex] = { ...entities[entityIndex], fields };
      return { ...s, entities };
    });
  }, [updateSpec]);

  const updateNavItem = useCallback((index: number, item: NavItem) => {
    updateSpec((s) => {
      const items = [...(s.navigation?.items || [])];
      items[index] = item;
      return { ...s, navigation: { ...s.navigation, items } };
    });
  }, [updateSpec]);

  const addNavItem = useCallback((item: NavItem) => {
    updateSpec((s) => ({
      ...s,
      navigation: { ...s.navigation, items: [...(s.navigation?.items || []), item] },
    }));
  }, [updateSpec]);

  const removeNavItem = useCallback((index: number) => {
    updateSpec((s) => ({
      ...s,
      navigation: {
        ...s.navigation,
        items: (s.navigation?.items || []).filter((_, i) => i !== index),
      },
    }));
  }, [updateSpec]);

  const addPage = useCallback((page: Page) => {
    updateSpec((s) => ({ ...s, pages: [...(s.pages || []), page] }));
  }, [updateSpec]);

  const removePage = useCallback((index: number) => {
    updateSpec((s) => ({
      ...s,
      pages: (s.pages || []).filter((_, i) => i !== index),
    }));
  }, [updateSpec]);

  const updatePage = useCallback((index: number, page: Page) => {
    updateSpec((s) => {
      const pages = [...(s.pages || [])];
      pages[index] = page;
      return { ...s, pages };
    });
  }, [updateSpec]);

  const publish = useCallback(async (version?: string, summary?: string) => {
    // Flush any pending save first
    if (state.isDirty && specRef.current) {
      await api.saveDraft(specId, specRef.current);
    }
    const result = await api.publishDraft(specId, version, summary);
    dispatch({ type: 'MARK_CLEAN' });
    queryClient.invalidateQueries({ queryKey: ['spec', specId] });
    queryClient.invalidateQueries({ queryKey: ['versions', specId] });
    return {
      warnings: result.warnings || [],
      blockingErrors: result.blocking_errors || [],
      parityStatus: result.parity_status || 'pass',
    };
  }, [specId, state.isDirty, queryClient]);

  const discard = useCallback(async () => {
    await api.discardDraft(specId);
    // Reload from latest version
    const result = await api.initDraft(specId);
    dispatch({ type: 'SET_SPEC', spec: result.draft });
    queryClient.invalidateQueries({ queryKey: ['spec', specId] });
  }, [specId, queryClient]);

  const value: DraftEditorContextValue = {
    ...state,
    updateSpec,
    updateEntity,
    addEntity,
    removeEntity,
    addField,
    removeField,
    updateField,
    updateNavItem,
    addNavItem,
    removeNavItem,
    addPage,
    removePage,
    updatePage,
    save,
    publish,
    discard,
  };

  return (
    <DraftEditorContext.Provider value={value}>
      {children}
    </DraftEditorContext.Provider>
  );
}
