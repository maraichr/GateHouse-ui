import { useNavigate, useParams } from 'react-router';
import {
  Database, GitBranch, Navigation as NavIcon, Loader2,
  ArrowRight, Palette, Globe, ChevronRight,
} from 'lucide-react';
import { useCompositionEditor } from '../../context/CompositionEditorContext';
import { ServiceBadge } from '../utility/ServiceBadge';
import { NavigationPreview } from './NavigationPreview';
import type { Entity, NavItem } from '../../types';

/**
 * The default landing page for the composition editor.
 * Shows the full composed picture: all entities across all services,
 * the merged navigation tree, and a summary of the host theme.
 */
export function ComposedOverviewEditor() {
  const { compId } = useParams<{ compId: string }>();
  const compCtx = useCompositionEditor();

  if (!compCtx) return null;

  const {
    composedSpec, composedSources, composedLoading,
    members, hostSpecId, hostSpecName, specIdToServiceName,
  } = compCtx;

  if (composedLoading || !composedSpec) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        <span className="ml-2 text-surface-500 dark:text-zinc-400">Loading composed spec...</span>
      </div>
    );
  }

  const entities = composedSpec.entities || [];
  const navItems = composedSpec.navigation?.items || [];
  const theme = composedSpec.app?.theme;

  // Group entities by service
  const entityGroups = new Map<string, Entity[]>();
  for (const entity of entities) {
    const service = composedSources[entity.name] || hostSpecName;
    if (!entityGroups.has(service)) entityGroups.set(service, []);
    entityGroups.get(service)!.push(entity);
  }

  // Figure out which specId owns a given service name
  const serviceToSpecId: Record<string, string> = { [hostSpecName]: hostSpecId };
  for (const m of members) {
    serviceToSpecId[m.service_name] = m.spec_id;
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Database} label="Entities" value={entities.length} />
        <StatCard icon={GitBranch} label="Relationships" value={entities.reduce((sum, e) => sum + (e.relationships?.length || 0), 0)} />
        <StatCard icon={NavIcon} label="Nav Items" value={countNavItems(navItems)} />
        <StatCard icon={Globe} label="Services" value={members.length + 1} />
      </div>

      {/* Entities — grouped by service */}
      <ComposedEntitiesSection
        compId={compId!}
        entityGroups={entityGroups}
        serviceToSpecId={serviceToSpecId}
        composedSources={composedSources}
      />

      {/* Composed Navigation */}
      <NavigationPreview />

      {/* Host Theme Summary */}
      {theme && (
        <section className="bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-surface-900 dark:text-zinc-100 flex items-center gap-2">
              <Palette className="w-4 h-4 text-surface-400 dark:text-zinc-500" />
              Theme (from Host)
            </h3>
            <EditInServiceLink compId={compId!} specId={hostSpecId} label="Edit in host" />
          </div>
          <div className="flex flex-wrap gap-3">
            {theme.primary_color && <ColorChip label="Primary" color={theme.primary_color} />}
            {theme.secondary_color && <ColorChip label="Secondary" color={theme.secondary_color} />}
            {theme.accent_color && <ColorChip label="Accent" color={theme.accent_color} />}
            {theme.danger_color && <ColorChip label="Danger" color={theme.danger_color} />}
            {theme.success_color && <ColorChip label="Success" color={theme.success_color} />}
            {theme.warning_color && <ColorChip label="Warning" color={theme.warning_color} />}
            {theme.info_color && <ColorChip label="Info" color={theme.info_color} />}
          </div>
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-surface-500 dark:text-zinc-400">
            {theme.mode && <span>Mode: {theme.mode}</span>}
            {theme.density && <span>Density: {theme.density}</span>}
            {theme.font_family && <span>Font: {theme.font_family}</span>}
            {theme.border_radius && <span>Radius: {theme.border_radius}</span>}
            {theme.elevation && <span>Elevation: {theme.elevation}</span>}
            {theme.surface_style && <span>Surface: {theme.surface_style}</span>}
            {theme.header_style && <span>Header: {theme.header_style}</span>}
          </div>
        </section>
      )}
    </div>
  );
}

// --- Composed Entities Section ---

function ComposedEntitiesSection({
  compId,
  entityGroups,
  serviceToSpecId,
  composedSources,
}: {
  compId: string;
  entityGroups: Map<string, Entity[]>;
  serviceToSpecId: Record<string, string>;
  composedSources: Record<string, string>;
}) {
  const navigate = useNavigate();

  // Find entity index within its owning service spec.
  // Since entity order may differ, we navigate to the service's entity list for now.
  const handleEntityClick = (entity: Entity) => {
    const service = composedSources[entity.name];
    const specId = service ? serviceToSpecId[service] : undefined;
    if (specId) {
      navigate(`/projects/${compId}/edit/services/${specId}/entities`);
    }
  };

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-700 p-5">
      <h3 className="font-medium text-surface-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
        <Database className="w-4 h-4 text-surface-400 dark:text-zinc-500" />
        All Entities ({Array.from(entityGroups.values()).flat().length})
      </h3>

      <div className="space-y-4">
        {Array.from(entityGroups.entries()).map(([service, entities]) => {
          const specId = serviceToSpecId[service];
          return (
            <div key={service}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ServiceBadge service={service} />
                  <span className="text-xs text-surface-400 dark:text-zinc-500">{entities.length} entities</span>
                </div>
                {specId && (
                  <EditInServiceLink compId={compId} specId={specId} path="entities" label="Edit" />
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {entities.map((entity) => (
                  <button
                    key={entity.name}
                    onClick={() => handleEntityClick(entity)}
                    className="flex items-start gap-2 p-3 rounded-lg border border-surface-100 dark:border-zinc-800 hover:border-brand-200 dark:hover:border-brand-800 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition-all text-left group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {entity.icon && <span className="text-sm">{entity.icon}</span>}
                        <span className="font-medium text-surface-900 dark:text-zinc-100 group-hover:text-brand-700 dark:group-hover:text-brand-400 truncate text-sm">
                          {entity.display_name || entity.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-surface-400 dark:text-zinc-500">
                        <span>{entity.fields?.length || 0} fields</span>
                        {(entity.relationships?.length || 0) > 0 && (
                          <span>{entity.relationships!.length} rels</span>
                        )}
                        {entity.state_machine && <span>SM</span>}
                      </div>
                    </div>
                    <ChevronRight className="w-3 h-3 text-surface-300 dark:text-zinc-600 mt-1 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// --- Composed Navigation Section ---

function ComposedNavigationSection({
  compId,
  navItems,
  composedSources,
  hostSpecName,
  serviceToSpecId,
}: {
  compId: string;
  navItems: NavItem[];
  composedSources: Record<string, string>;
  hostSpecName: string;
  serviceToSpecId: Record<string, string>;
}) {
  if (navItems.length === 0) {
    return null;
  }

  // Try to determine which service a nav item comes from based on its entity reference
  const getNavItemService = (item: NavItem): string | null => {
    if (item.entity && composedSources[item.entity]) {
      return composedSources[item.entity];
    }
    return null;
  };

  return (
    <section className="bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-surface-900 dark:text-zinc-100 flex items-center gap-2">
          <NavIcon className="w-4 h-4 text-surface-400 dark:text-zinc-500" />
          Composed Navigation ({countNavItems(navItems)} items)
        </h3>
      </div>

      <div className="space-y-1">
        {navItems.map((item) => (
          <NavItemRow
            key={item.id}
            item={item}
            depth={0}
            getService={getNavItemService}
            compId={compId}
            serviceToSpecId={serviceToSpecId}
          />
        ))}
      </div>
    </section>
  );
}

function NavItemRow({
  item,
  depth,
  getService,
  compId,
  serviceToSpecId,
}: {
  item: NavItem;
  depth: number;
  getService: (item: NavItem) => string | null;
  compId: string;
  serviceToSpecId: Record<string, string>;
}) {
  const service = getService(item);
  const navigate = useNavigate();

  const handleClick = () => {
    if (service) {
      const specId = serviceToSpecId[service];
      if (specId) {
        navigate(`/projects/${compId}/edit/services/${specId}/navigation`);
      }
    }
  };

  return (
    <>
      <div
        onClick={service ? handleClick : undefined}
        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${
          service ? 'hover:bg-surface-50 dark:hover:bg-zinc-800 cursor-pointer' : ''
        }`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {item.icon && <span className="text-xs">{item.icon}</span>}
        <span className="text-surface-700 dark:text-zinc-300">{item.label}</span>
        {item.entity && (
          <span className="text-xs text-surface-400 dark:text-zinc-500 font-mono">{item.entity}</span>
        )}
        {item.page && (
          <span className="text-xs text-surface-400 dark:text-zinc-500 font-mono">{item.page}</span>
        )}
        {service && <ServiceBadge service={service} />}
        {item.children && item.children.length > 0 && (
          <span className="text-xs text-surface-400 dark:text-zinc-500">({item.children.length})</span>
        )}
      </div>
      {item.children?.map((child) => (
        <NavItemRow
          key={child.id}
          item={child}
          depth={depth + 1}
          getService={getService}
          compId={compId}
          serviceToSpecId={serviceToSpecId}
        />
      ))}
    </>
  );
}

// --- Shared helpers ---

function EditInServiceLink({
  compId,
  specId,
  path,
  label,
}: {
  compId: string;
  specId: string;
  path?: string;
  label: string;
}) {
  const navigate = useNavigate();
  const to = path
    ? `/projects/${compId}/edit/services/${specId}/${path}`
    : `/projects/${compId}/edit/services/${specId}`;

  return (
    <button
      onClick={() => navigate(to)}
      className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
    >
      {label}
      <ArrowRight className="w-3 h-3" />
    </button>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-700 p-3">
      <div className="flex items-center gap-2 text-surface-500 dark:text-zinc-400 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-xl font-bold text-surface-900 dark:text-zinc-100">{value}</div>
    </div>
  );
}

function ColorChip({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-4 h-4 rounded border border-surface-200 dark:border-zinc-700"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-surface-600 dark:text-zinc-400">{label}</span>
      <span className="text-xs text-surface-400 dark:text-zinc-500 font-mono">{color}</span>
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
