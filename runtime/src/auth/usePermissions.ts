import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

export function usePermissions() {
  const { user } = useContext(AuthContext);

  function hasPermission(requiredRoles: string[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    if (user.roles.includes('admin')) return true;
    return requiredRoles.some((role) => user.roles.includes(role));
  }

  function hasRole(role: string): boolean {
    return user.roles.includes(role);
  }

  return { hasPermission, hasRole, user };
}
