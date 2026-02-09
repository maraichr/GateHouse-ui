import type { AppSpec } from '../types';

interface PermissionRow {
  label: string;
  isHeader: boolean;
  isTransition: boolean;
  permissions: Record<string, 'allowed' | 'denied' | 'conditional'>;
}

export function buildPermissionMatrix(appSpec: AppSpec): { roles: string[]; rows: PermissionRow[] } {
  const roles = Object.keys(appSpec.auth.roles || {});
  const rows: PermissionRow[] = [];

  for (const entity of appSpec.entities) {
    // Entity header
    rows.push({ label: entity.display_name || entity.name, isHeader: true, isTransition: false, permissions: {} });

    // CRUD actions (check if views exist as proxy for permission)
    const crudActions = [
      { label: 'View (List)', hasView: !!entity.views.list },
      { label: 'View (Detail)', hasView: !!entity.views.detail },
      { label: 'Create', hasView: !!entity.views.create },
      { label: 'Edit', hasView: !!entity.views.edit },
    ];

    for (const action of crudActions) {
      const permissions: Record<string, 'allowed' | 'denied' | 'conditional'> = {};
      for (const role of roles) {
        // If the view exists, all roles are assumed allowed unless restricted
        permissions[role] = action.hasView ? 'allowed' : 'denied';
      }
      rows.push({ label: action.label, isHeader: false, isTransition: false, permissions });
    }

    // Transitions
    if (entity.state_machine) {
      for (const transition of entity.state_machine.transitions) {
        const permissions: Record<string, 'allowed' | 'denied' | 'conditional'> = {};
        for (const role of roles) {
          if (transition.permissions && transition.permissions.length > 0) {
            if (transition.permissions.includes(role)) {
              permissions[role] = transition.guards?.length ? 'conditional' : 'allowed';
            } else {
              permissions[role] = 'denied';
            }
          } else {
            // No permissions defined = all allowed
            permissions[role] = transition.guards?.length ? 'conditional' : 'allowed';
          }
        }
        rows.push({
          label: transition.label || transition.name,
          isHeader: false,
          isTransition: true,
          permissions,
        });
      }
    }
  }

  return { roles, rows };
}
