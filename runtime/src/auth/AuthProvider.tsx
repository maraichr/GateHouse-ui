import { createContext, ReactNode, useMemo } from 'react';

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
}

export const AuthContext = createContext<AuthContextValue>({
  user: { id: '1', name: 'Admin User', email: 'admin@acme.com', roles: ['admin'] },
  isAuthenticated: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const params = new URLSearchParams(window.location.search);
  const role = params.get('role') || 'admin';

  const user = useMemo<AuthUser>(() => ({
    id: '1',
    name: role === 'admin' ? 'Admin User' : role === 'viewer' ? 'Viewer' : 'User',
    email: `${role}@acme.com`,
    roles: [role],
  }), [role]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: true }}>
      {children}
    </AuthContext.Provider>
  );
}
