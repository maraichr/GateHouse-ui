import { ComponentTree } from '../types';

/** Preview params captured once at module load (before SPA navigation strips them). */
const _previewQs: string = (() => {
  const pageParams = new URLSearchParams(window.location.search);
  const qs = new URLSearchParams();
  for (const key of ['specId', 'versionId', 'compId']) {
    const val = pageParams.get(key);
    if (val) qs.set(key, val);
  }
  return qs.toString();
})();

export async function fetchSpec(): Promise<ComponentTree> {
  const suffix = _previewQs ? `?${_previewQs}` : '';
  const res = await fetch(`/_renderer/spec${suffix}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch spec: ${res.status}`);
  }
  return res.json();
}
