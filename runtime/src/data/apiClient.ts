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

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${config.versionPrefix}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${config.versionPrefix}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${config.versionPrefix}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
