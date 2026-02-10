import { useCallback, useEffect, useState } from 'react';

export type EditorMode = 'basic' | 'advanced';

const STORAGE_KEY = 'gh-studio-editor-mode';
const EVENT_NAME = 'gh:editor-mode';

function readMode(): EditorMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'advanced' ? 'advanced' : 'basic';
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
      if (custom.detail === 'advanced' || custom.detail === 'basic') {
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
