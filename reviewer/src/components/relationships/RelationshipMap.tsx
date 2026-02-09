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
    return <p className="text-sm text-gray-500">No relationships defined in this spec.</p>;
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
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900">{entity.display_name || entity.name}</h3>
                {entitySource && <ServiceBadge service={entitySource} />}
              </div>
              <div className="text-xs text-gray-500 mb-3">
                {(entity.fields || []).slice(0, 3).map((f) => f.name).join(', ')}
                {(entity.fields || []).length > 3 && `, +${(entity.fields || []).length - 3}`}
              </div>
              {rels.length > 0 && (
                <div className="space-y-1">
                  {rels.map((rel, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400">-</span>
                      <Badge color={rel.isExternal ? 'amber' : rel.isCrossService ? 'indigo' : 'blue'}>{rel.type}</Badge>
                      <span className={rel.isExternal ? 'text-amber-600 italic' : rel.isCrossService ? 'text-indigo-600' : 'text-gray-700'}>
                        {rel.to}
                      </span>
                      {rel.isExternal && <span className="text-amber-500 text-[10px]">(external)</span>}
                      {rel.isCrossService && !rel.isExternal && <span className="text-indigo-500 text-[10px]">(cross-service)</span>}
                    </div>
                  ))}
                </div>
              )}
              {incomingRels.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                  {incomingRels.map((rel, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">From</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Relationship</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">To</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">FK</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Features</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {relationships.map((rel, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-700">
                  <span className="flex items-center gap-1.5">
                    {rel.fromDisplay}
                    {sources?.[rel.from] && <ServiceBadge service={sources[rel.from]} />}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-600">{rel.name}</td>
                <td className={`px-4 py-2 ${rel.isExternal ? 'text-amber-600 italic' : 'text-gray-700'}`}>
                  <span className="flex items-center gap-1.5">
                    {rel.to}
                    {rel.isExternal && <span className="text-[10px]">(ext)</span>}
                    {rel.isCrossService && !rel.isExternal && <span className="text-indigo-500 text-[10px]">(x-svc)</span>}
                  </span>
                </td>
                <td className="px-4 py-2"><Badge color={rel.isCrossService ? 'indigo' : 'blue'}>{rel.type}</Badge></td>
                <td className="px-4 py-2 font-mono text-xs text-gray-500">{rel.foreignKey || '—'}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
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
  );
}
