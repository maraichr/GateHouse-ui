const BASE = '/_reviewer';

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'same-origin' });

  if (res.status === 401) {
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Not authenticated');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE' });
}

export function apiPostYaml<T>(path: string, yamlContent: string): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-yaml' },
    body: yamlContent,
  });
}
