import { ChevronRight, AlertTriangle } from 'lucide-react';
import { Badge } from '../utility/Badge';
import type { AppSpec, NavItem } from '../../types';

interface NavBlueprintProps {
  appSpec: AppSpec;
}

export function NavBlueprint({ appSpec }: NavBlueprintProps) {
  const entityNames = new Set(appSpec.entities.map((e) => e.name));
  const pageIds = new Set(appSpec.pages.map((p) => p.id));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="space-y-1">
        {appSpec.navigation.items.map((item) => (
          <NavBlueprintItem
            key={item.id}
            item={item}
            depth={0}
            entityNames={entityNames}
            pageIds={pageIds}
          />
        ))}
      </div>
    </div>
  );
}

interface NavBlueprintItemProps {
  item: NavItem;
  depth: number;
  entityNames: Set<string>;
  pageIds: Set<string>;
}

function NavBlueprintItem({ item, depth, entityNames, pageIds }: NavBlueprintItemProps) {
  const hasChildren = item.children && item.children.length > 0;
  const isEntityBroken = item.entity && !entityNames.has(item.entity);
  const isPageBroken = item.page && !pageIds.has(item.page);
  const hasBrokenRef = isEntityBroken || isPageBroken;

  return (
    <div style={{ paddingLeft: depth * 20 }}>
      <div className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-50 text-sm group">
        {hasChildren ? (
          <ChevronRight className="w-3 h-3 text-gray-400" />
        ) : (
          <span className="w-3" />
        )}
        {item.icon && <span className="text-gray-400 text-xs">{item.icon}</span>}
        <span className="font-medium text-gray-700">{item.label}</span>

        {/* Target info */}
        <div className="flex items-center gap-1.5 ml-auto">
          {item.entity && (
            <Badge color={isEntityBroken ? 'red' : 'blue'}>
              entity: {item.entity}
            </Badge>
          )}
          {item.page && (
            <Badge color={isPageBroken ? 'red' : 'purple'}>
              page: {item.page}
            </Badge>
          )}
          {item.path && !item.entity && !item.page && (
            <span className="text-xs text-gray-400 font-mono">{item.path}</span>
          )}
          {item.permissions && item.permissions.length > 0 && (
            <Badge color="gray">{item.permissions.join(', ')}</Badge>
          )}
          {item.badge && (
            <Badge color={item.badge.color || 'gray'}>badge: {item.badge.type}</Badge>
          )}
          {hasBrokenRef && (
            <span title="Broken reference"><AlertTriangle className="w-3.5 h-3.5 text-red-500" /></span>
          )}
        </div>
      </div>
      {hasChildren && item.children!.map((child) => (
        <NavBlueprintItem
          key={child.id}
          item={child}
          depth={depth + 1}
          entityNames={entityNames}
          pageIds={pageIds}
        />
      ))}
    </div>
  );
}
