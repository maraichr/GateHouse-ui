/**
 * Convert PascalCase entity name to kebab-case API resource path.
 * e.g. "WorkOrder" -> "/work-orders", "Trade" -> "/trades"
 */
export function entityToResource(entityName: string): string {
  const kebab = entityName
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
  return `/${kebab}s`;
}
