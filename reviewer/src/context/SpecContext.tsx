import { createContext, useContext, useState, type ReactNode } from 'react';

interface SpecContextValue {
  specId: string | null;
  versionId: string | null;
  setSpecId: (id: string | null) => void;
  setVersionId: (id: string | null) => void;
}

const SpecContext = createContext<SpecContextValue>({
  specId: null,
  versionId: null,
  setSpecId: () => {},
  setVersionId: () => {},
});

export function SpecProvider({ children }: { children: ReactNode }) {
  const [specId, setSpecId] = useState<string | null>(null);
  const [versionId, setVersionId] = useState<string | null>(null);

  return (
    <SpecContext.Provider value={{ specId, versionId, setSpecId, setVersionId }}>
      {children}
    </SpecContext.Provider>
  );
}

export function useSpecContext() {
  return useContext(SpecContext);
}
