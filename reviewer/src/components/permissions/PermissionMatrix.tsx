import { Badge } from '../utility/Badge';
import { buildPermissionMatrix } from '../../utils/permissionAnalysis';
import type { AppSpec } from '../../types';

interface PermissionMatrixProps {
  appSpec: AppSpec;
}

export function PermissionMatrix({ appSpec }: PermissionMatrixProps) {
  const { roles, rows } = buildPermissionMatrix(appSpec);

  if (roles.length === 0) {
    return <p className="text-sm text-surface-500 dark:text-zinc-400">No roles defined in this spec.</p>;
  }

  return (
    <div className="surface-card overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-50 dark:bg-zinc-800/50 border-b border-surface-200 dark:border-zinc-800">
            <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 dark:text-zinc-400 uppercase">Entity / Action</th>
            {roles.map((role) => (
              <th key={role} className="text-center px-3 py-3 text-xs font-medium text-surface-500 dark:text-zinc-400 uppercase">
                {role}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100 dark:divide-zinc-800/50">
          {rows.map((row, i) => (
            <tr key={i} className={row.isHeader ? 'bg-surface-50 dark:bg-zinc-800/50' : 'hover:bg-surface-50 dark:hover:bg-zinc-800/30'}>
              <td className={`px-4 py-2 ${row.isHeader ? 'font-semibold text-surface-900 dark:text-zinc-100 pt-4' : 'pl-8 text-surface-600 dark:text-zinc-400'}`}>
                {row.isTransition && <span className="text-surface-400 dark:text-zinc-500 mr-1">→</span>}
                {row.label}
              </td>
              {roles.map((role) => (
                <td key={role} className="text-center px-3 py-2">
                  {row.isHeader ? null : (
                    <span className={
                      row.permissions[role] === 'allowed' ? 'text-green-600 dark:text-green-400' :
                      row.permissions[role] === 'conditional' ? 'text-amber-500 dark:text-amber-400' : 'text-surface-300 dark:text-zinc-600'
                    }>
                      {row.permissions[role] === 'allowed' ? '✓' :
                       row.permissions[role] === 'conditional' ? '◐' : '·'}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
