import { Badge } from '../utility/Badge';
import { buildPermissionMatrix } from '../../utils/permissionAnalysis';
import type { AppSpec } from '../../types';

interface PermissionMatrixProps {
  appSpec: AppSpec;
}

export function PermissionMatrix({ appSpec }: PermissionMatrixProps) {
  const { roles, rows } = buildPermissionMatrix(appSpec);

  if (roles.length === 0) {
    return <p className="text-sm text-gray-500">No roles defined in this spec.</p>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Entity / Action</th>
            {roles.map((role) => (
              <th key={role} className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase">
                {role}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className={row.isHeader ? 'bg-gray-50' : 'hover:bg-gray-50'}>
              <td className={`px-4 py-2 ${row.isHeader ? 'font-semibold text-gray-900 pt-4' : 'pl-8 text-gray-600'}`}>
                {row.isTransition && <span className="text-gray-400 mr-1">→</span>}
                {row.label}
              </td>
              {roles.map((role) => (
                <td key={role} className="text-center px-3 py-2">
                  {row.isHeader ? null : (
                    <span className={
                      row.permissions[role] === 'allowed' ? 'text-green-600' :
                      row.permissions[role] === 'conditional' ? 'text-amber-500' : 'text-gray-300'
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
