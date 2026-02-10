import { Badge } from '../utility/Badge';
import { ServiceBadge } from '../utility/ServiceBadge';
import type { AppSpec } from '../../types';

interface RelationshipMapProps {
  appSpec: AppSpec;
  sources?: Record<string, string>;
}

export function RelationshipMap({ appSpec, sources }: RelationshipMapProps) {
  const entityNames = new Set((appSpec.entities || []).map((e) => e.name));

  const relationships = (appSpec.entities || []).flatMap((entity) =>
    (entity.relationships || []).map((rel) => ({
      from: entity.name,
      fromDisplay: entity.display_name || entity.name,
      to: rel.entity,
      name: rel.display_name || rel.name,
      type: rel.type,
      foreignKey: rel.foreign_key,
      isExternal: !entityNames.has(rel.entity),
      showInDetail: rel.show_in_detail,
      inlineCreate: rel.inline_create,
      isCrossService: sources ? sources[entity.name] !== sources[rel.entity] : false,
    })),
  );

  if (relationships.length === 0) {
    return <p className="text-sm text-surface-500 dark:text-zinc-400">No relationships defined in this spec.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Entity nodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(appSpec.entities || []).map((entity) => {
          const rels = relationships.filter((r) => r.from === entity.name);
          const incomingRels = relationships.filter((r) => r.to === entity.name);
          const entitySource = sources?.[entity.name];
          return (
            <div
              key={entity.name}
              className="surface-card p-4"
            >
              <div className="flex items-center gap-2 mb-2 min-w-0">
                <h3 className="font-semibold text-surface-900 dark:text-zinc-100 truncate flex-1">{entity.display_name || entity.name}</h3>
                {entitySource && <ServiceBadge service={entitySource} className="flex-shrink-0" />}
              </div>
              <div className="text-xs text-surface-500 dark:text-zinc-400 mb-3 truncate">
                {(entity.fields || []).slice(0, 3).map((f) => f.name).join(', ')}
                {(entity.fields || []).length > 3 && `, +${(entity.fields || []).length - 3}`}
              </div>
              {rels.length > 0 && (
                <div className="space-y-1">
                  {rels.map((rel, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs min-w-0">
                      <span className="text-surface-400 dark:text-zinc-500 flex-shrink-0">-</span>
                      <Badge color={rel.isExternal ? 'amber' : rel.isCrossService ? 'indigo' : 'blue'}>{rel.type}</Badge>
                      <span className={`truncate ${rel.isExternal ? 'text-amber-600 dark:text-amber-400 italic' : rel.isCrossService ? 'text-indigo-600 dark:text-indigo-400' : 'text-surface-700 dark:text-zinc-300'}`}>
                        {rel.to}
                      </span>
                      {rel.isExternal && <span className="text-amber-500 dark:text-amber-400 text-[10px] flex-shrink-0 whitespace-nowrap">(ext)</span>}
                      {rel.isCrossService && !rel.isExternal && <span className="text-indigo-500 dark:text-indigo-400 text-[10px] flex-shrink-0 whitespace-nowrap">(x-svc)</span>}
                    </div>
                  ))}
                </div>
              )}
              {incomingRels.length > 0 && (
                <div className="mt-2 pt-2 border-t border-surface-100 dark:border-zinc-800 space-y-1">
                  {incomingRels.map((rel, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-surface-400 dark:text-zinc-500">
                      <span>←</span>
                      <span>{rel.from}</span>
                      <Badge color="gray">{rel.type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Relationship table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-surface-50 dark:bg-zinc-800/50 border-b border-surface-200 dark:border-zinc-800">
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 dark:text-zinc-400 uppercase">From</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 dark:text-zinc-400 uppercase">Relationship</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 dark:text-zinc-400 uppercase">To</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 dark:text-zinc-400 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 dark:text-zinc-400 uppercase">FK</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-surface-500 dark:text-zinc-400 uppercase">Features</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-zinc-800/50">
            {relationships.map((rel, i) => (
              <tr key={i} className="hover:bg-surface-50 dark:hover:bg-zinc-800/30">
                <td className="px-4 py-2 font-medium text-surface-700 dark:text-zinc-300">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{rel.fromDisplay}</span>
                    {sources?.[rel.from] && <ServiceBadge service={sources[rel.from]} />}
                  </span>
                </td>
                <td className="px-4 py-2 text-surface-600 dark:text-zinc-400">{rel.name}</td>
                <td className={`px-4 py-2 ${rel.isExternal ? 'text-amber-600 dark:text-amber-400 italic' : 'text-surface-700 dark:text-zinc-300'}`}>
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{rel.to}</span>
                    {rel.isExternal && <span className="text-[10px] flex-shrink-0 whitespace-nowrap">(ext)</span>}
                    {rel.isCrossService && !rel.isExternal && <span className="text-indigo-500 dark:text-indigo-400 text-[10px] flex-shrink-0 whitespace-nowrap">(x-svc)</span>}
                  </span>
                </td>
                <td className="px-4 py-2"><Badge color={rel.isCrossService ? 'indigo' : 'blue'}>{rel.type}</Badge></td>
                <td className="px-4 py-2 font-mono text-xs text-surface-500 dark:text-zinc-400">{rel.foreignKey || '—'}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1 flex-wrap">
                    {rel.showInDetail && <Badge color="green">detail</Badge>}
                    {rel.inlineCreate && <Badge color="purple">inline</Badge>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
