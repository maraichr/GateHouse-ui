export interface ApiClientConfig {
  baseUrl: string;
  versionPrefix: string;
}

let config: ApiClientConfig = {
  baseUrl: '/api',
  versionPrefix: '/api/v1',
};

export function configureApiClient(cfg: Partial<ApiClientConfig>) {
  config = { ...config, ...cfg };
}

/** Preview params captured once at module load (before SPA navigation strips them). */
const _previewParams: Record<string, string> = (() => {
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};
  for (const key of ['specId', 'versionId', 'compId']) {
    const val = params.get(key);
    if (val) result[key] = val;
  }
  return result;
})();

function getPreviewParams(): Record<string, string> {
  return _previewParams;
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${config.versionPrefix}${path}`, window.location.origin);
  const previewParams = getPreviewParams();
  Object.entries(previewParams).forEach(([k, v]) => url.searchParams.set(k, v));
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const url = new URL(`${config.versionPrefix}${path}`, window.location.origin);
  const previewParams = getPreviewParams();
  Object.entries(previewParams).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const url = new URL(`${config.versionPrefix}${path}`, window.location.origin);
  const previewParams = getPreviewParams();
  Object.entries(previewParams).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
