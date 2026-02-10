import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Navigation as NavIcon } from 'lucide-react';
import { useCompositionEditor } from '../../context/CompositionEditorContext';
import { ServiceBadge } from '../utility/ServiceBadge';
import { Card } from '../ui/Card';
import { getNavIcon } from '../../utils/navIconMap';
import type { NavItem } from '../../types';

/**
 * Visual sidebar mockup showing the merged navigation structure.
 * Color-coded by service, with polished icons and animations.
 */
export function NavigationPreview() {
  const compCtx = useCompositionEditor();
  if (!compCtx) return null;

  const { composedSpec, composedSources, hostSpecName } = compCtx;
  const navItems = composedSpec?.navigation?.items || [];

  if (navItems.length === 0) {
    return (
      <Card>
        <div className="text-center py-8 text-surface-400 dark:text-zinc-500">
          <NavIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No navigation items configured yet</p>
          <p className="text-xs mt-1">Add navigation items to service specs to see the composed sidebar</p>
        </div>
      </Card>
    );
  }

  // Determine which service each nav item belongs to
  const getNavItemService = (item: NavItem): string => {
    if (item.entity && composedSources[item.entity]) {
      return composedSources[item.entity];
    }
    return hostSpecName;
  };

  return (
    <Card padding="sm">
      <h3 className="font-medium text-surface-900 dark:text-zinc-100 flex items-center gap-2 mb-4 text-sm">
        <NavIcon className="w-4 h-4 text-surface-400 dark:text-zinc-500" />
        Navigation Preview
        <span className="text-xs text-surface-400 dark:text-zinc-500 font-normal">
          ({countNavItems(navItems)} items)
        </span>
      </h3>

      {/* Mini sidebar mockup */}
      <div className="bg-surface-50 dark:bg-zinc-800/60 rounded-lg border border-surface-200 dark:border-zinc-700 overflow-hidden">
        {/* Branding header mockup */}
        <div className="px-4 py-3 border-b border-surface-200 dark:border-zinc-700 bg-surface-100 dark:bg-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-500/20 flex items-center justify-center">
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                {composedSpec?.app?.display_name?.[0] || 'A'}
              </span>
            </div>
            <span className="text-sm font-semibold text-surface-900 dark:text-zinc-100 truncate">
              {composedSpec?.app?.display_name || 'App'}
            </span>
          </div>
        </div>

        {/* Nav items */}
        <div className="py-2 space-y-0.5">
          {navItems.map((item, idx) => (
            <PreviewNavItem
              key={item.id}
              item={item}
              depth={0}
              getService={getNavItemService}
              isFirst={idx === 0}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-2">
        <ServiceLegendItem service={hostSpecName} isHost />
        {compCtx.members.map((m) => (
          <ServiceLegendItem key={m.id} service={m.service_name} optional={m.optional} />
        ))}
      </div>
    </Card>
  );
}

/** Deterministic pseudo-count from item ID for badge preview */
function pseudoBadgeCount(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return String(Math.abs(hash % 12) + 1);
}

const badgeColorMap: Record<string, string> = {
  danger: 'bg-danger-100 dark:bg-danger-950 text-danger-600 dark:text-danger-400',
  warning: 'bg-warning-100 dark:bg-warning-950 text-warning-600 dark:text-warning-400',
  success: 'bg-success-100 dark:bg-success-950 text-success-600 dark:text-success-400',
  info: 'bg-info-100 dark:bg-info-950 text-info-600 dark:text-info-400',
};

function PreviewNavItem({
  item,
  depth,
  getService,
  isFirst,
}: {
  item: NavItem;
  depth: number;
  getService: (item: NavItem) => string;
  isFirst?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;
  const service = getService(item);
  const IconComponent = getNavIcon(item.icon);

  // Animate children expand/collapse
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [expanded, item.children]);

  const badgeColor = item.badge?.color
    ? (badgeColorMap[item.badge.color] || badgeColorMap.info)
    : 'bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400';

  return (
    <>
      <div
        className={`flex items-center gap-1.5 px-3 py-2 mx-1 rounded-md hover:bg-surface-100 dark:hover:bg-zinc-700/50 group transition-colors duration-200 relative ${
          isFirst ? 'before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-full before:bg-brand-500' : ''
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 text-surface-400 dark:text-zinc-500 transition-transform duration-200"
          >
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`} />
          </button>
        )}
        {!hasChildren && <span className="w-4" />}

        {IconComponent ? (
          <IconComponent className="w-3.5 h-3.5 text-surface-400 dark:text-zinc-500 flex-shrink-0" />
        ) : item.icon ? (
          <span className="w-3.5 h-3.5 rounded bg-surface-200 dark:bg-zinc-700 flex-shrink-0" title={item.icon} />
        ) : null}

        <span className="text-xs text-surface-700 dark:text-zinc-300 flex-1 truncate">
          {item.label}
        </span>

        {item.badge && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${badgeColor}`}>
            {item.badge.type === 'count' ? pseudoBadgeCount(item.id || item.label) : '!'}
          </span>
        )}

        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out">
          <ServiceBadge service={service} />
        </span>
      </div>

      {hasChildren && (
        <div
          ref={contentRef}
          className="overflow-hidden transition-all duration-200 ease-in-out"
          style={{
            maxHeight: expanded ? (contentHeight ?? 1000) : 0,
            opacity: expanded ? 1 : 0,
          }}
        >
          {item.children!.map((child) => (
            <PreviewNavItem
              key={child.id}
              item={child}
              depth={depth + 1}
              getService={getService}
            />
          ))}
        </div>
      )}
    </>
  );
}

function ServiceLegendItem({ service, isHost, optional }: { service: string; isHost?: boolean; optional?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border ${
      isHost
        ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800'
        : 'bg-surface-50 dark:bg-zinc-800/50 border-surface-200 dark:border-zinc-700'
    }`}>
      <ServiceBadge service={service} />
      {isHost && (
        <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400">
          HOST
        </span>
      )}
      {optional && (
        <span className="text-[9px] text-surface-400 dark:text-zinc-500 italic">opt</span>
      )}
    </div>
  );
}

function countNavItems(items: NavItem[]): number {
  let count = 0;
  for (const item of items) {
    count++;
    if (item.children) {
      count += countNavItems(item.children);
    }
  }
  return count;
}
