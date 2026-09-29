import type { Meter, MeterListResponse, MeterQuery, Transformer, TransformerListResponse, TransformerQuery } from './types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

function buildQueryString(query?: MeterQuery | TransformerQuery) {
  if (!query) {
    return '';
  }

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value.toString());
    }
  });

  const search = params.toString();
  return search ? `?${search}` : '';
}

async function requestJson<T>(path: string): Promise<T> {
  const token = localStorage.getItem('flock-energy-app-token');
  const response = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function downloadCsv(path: string, fallbackFilename: string): Promise<string> {
  const token = localStorage.getItem('flock-energy-app-token');
  const response = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (response.status === 401) {
    localStorage.removeItem('flock-energy-app-token');
    window.dispatchEvent(new Event('flock-energy-session-expired'));
    throw new Error('Your application session has expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error('The export could not be generated. Please try again.');
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? fallbackFilename;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return filename;
}

export async function fetchMeters(query?: MeterQuery): Promise<MeterListResponse> {
  return requestJson(`/meters${buildQueryString(query)}`);
}

export async function fetchMeter(meterId: string): Promise<Meter> {
  return requestJson(`/meters/${encodeURIComponent(meterId)}`);
}

export async function fetchTransformers(query?: TransformerQuery): Promise<TransformerListResponse> {
  return requestJson(`/transformers${buildQueryString(query)}`);
}

export async function fetchTransformer(code: string): Promise<Transformer> {
  return requestJson(`/transformers/${encodeURIComponent(code)}`);
}

export async function login(username: string, password: string): Promise<{ token: string; user: { username: string } }> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => undefined) as { error?: { message?: string } } | undefined;
    throw new Error(errorBody?.error?.message ?? 'Unable to sign in.');
  }

  return response.json() as Promise<{ token: string; user: { username: string } }>;
}

export async function logout(): Promise<void> {
  const token = localStorage.getItem('flock-energy-app-token');
  if (token) {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

export async function downloadMeterExport(): Promise<string> {
  return downloadCsv('/meters/export', 'meters.csv');
}

export async function downloadTransformerExport(): Promise<string> {
  return downloadCsv('/transformers/export', 'transformers.csv');
}
