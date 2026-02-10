import { useCallback, useEffect, useState } from 'react';

export type EditorMode = 'guided' | 'expert';

const STORAGE_KEY = 'gh-studio-authoring-mode';
const LEGACY_STORAGE_KEY = 'gh-studio-editor-mode';
const EVENT_NAME = 'gh:authoring-mode';

function readMode(): EditorMode {
  const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
  if (stored === 'expert' || stored === 'advanced') return 'expert';
  return 'guided';
}

export function useEditorMode() {
  const [mode, setModeState] = useState<EditorMode>(() => readMode());

  const setMode = useCallback((next: EditorMode) => {
    localStorage.setItem(STORAGE_KEY, next);
    setModeState(next);
    window.dispatchEvent(new CustomEvent<EditorMode>(EVENT_NAME, { detail: next }));
  }, []);

  useEffect(() => {
    const onModeChange = (event: Event) => {
      const custom = event as CustomEvent<EditorMode>;
      if (custom.detail === 'expert' || custom.detail === 'guided') {
        setModeState(custom.detail);
      } else {
        setModeState(readMode());
      }
    };
    window.addEventListener(EVENT_NAME, onModeChange);
    window.addEventListener('storage', onModeChange);
    return () => {
      window.removeEventListener(EVENT_NAME, onModeChange);
      window.removeEventListener('storage', onModeChange);
    };
  }, []);

  return { mode, setMode };
}
