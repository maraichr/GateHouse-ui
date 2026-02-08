import { createContext, ReactNode, useMemo, useState, useCallback } from 'react';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  avatar?: string;
}

export interface AuthContextValue {
  user: AuthUser;
  isAuthenticated: boolean;
  setRole: (role: string) => void;
}

const ROLE_NAMES: Record<string, string> = {
  admin: 'Admin User',
  compliance_officer: 'Compliance Officer',
  viewer: 'Viewer',
};

export const AuthContext = createContext<AuthContextValue>({
  user: { id: '1', name: 'Admin User', email: 'admin@acme.com', roles: ['admin'] },
  isAuthenticated: true,
  setRole: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const params = new URLSearchParams(window.location.search);
  const initialRole = params.get('role') || 'admin';
  const [role, setRole] = useState(initialRole);

  const user = useMemo<AuthUser>(() => ({
    id: '1',
    name: ROLE_NAMES[role] || 'User',
    email: `${role}@acme.com`,
    roles: [role],
  }), [role]);

  const handleSetRole = useCallback((newRole: string) => {
    setRole(newRole);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: true, setRole: handleSetRole }}>
      {children}
    </AuthContext.Provider>
  );
}
